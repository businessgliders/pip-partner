import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MessagesSquare, PanelRightClose, PanelRightOpen } from "lucide-react";
import EmailThreadPanel from "@/components/email/EmailThreadPanel";
import InboxStatusRail from "./InboxStatusRail";
import InboxThreadList from "./InboxThreadList";
import InboxContactPanel from "./InboxContactPanel";
import ThreadHeaderBar from "./ThreadHeaderBar";
import DetailsDrawer from "./DetailsDrawer";
import {
  SOURCE_META,
  statusOrderFor,
  entityForSource,
  statusLabel,
  displayName,
  UPCOMING_MEETINGS_KEY,
  notInterestedStatusFor,
  expandStatusFilter,
  STATUS_FOLD_MAP,
} from "./inboxConfig";
import { getDefaultSort, sortTickets } from "./inboxSort";

/**
 * Inbox View — 3-pane clone of pip-hub's /inbox, adapted to use this app's
 * submission entities + EmailMessage history.
 *
 *   Top: source tabs (Franchise / Instructor / Front Desk)
 *   Left rail: status filter
 *   Middle: thread list (submissions in the active source)
 *   Right: EmailThreadPanel (conversation) + InboxContactPanel (details)
 */
export default function InboxView({
  activeTab,
  onTabChange,
  user,
  detailFieldsBySource = {},
  unreadCountByTicket = {},
  markAsRead,
}) {
  const sourceKey = activeTab;
  const meta = SOURCE_META[sourceKey] || SOURCE_META.franchise;
  const accent = meta.accent;
  const entity = entityForSource(sourceKey);
  const statuses = statusOrderFor(sourceKey);

  const [statusFilter, setStatusFilter] = useState(() => statusOrderFor(sourceKey)[0] || null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const notInterestedKey = notInterestedStatusFor(sourceKey);
  // < xl (mobile + tablet + narrow desktop) — details opens as a slide-in
  // drawer overlay. xl+ uses a persistent side column. Consistent visual
  // pattern (right-anchored, X to close) across every viewport where it appears.
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  // xl+ only — lets the user collapse the persistent details side column for
  // more conversation width. Session-scoped, no persistence needed.
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  // Reset state when source changes — default to the first status of the new
  // source so the user lands on a focused list (and the first conversation in
  // that list will auto-preselect via the effect below on desktop).
  useEffect(() => {
    setStatusFilter(statusOrderFor(sourceKey)[0] || null);
    setSearch("");
    setSelectedId(null);
  }, [sourceKey]);

  // Close the drawer whenever the user switches to a different conversation.
  useEffect(() => {
    setDetailsDrawerOpen(false);
  }, [selectedId]);

  // Shares the same query key as ApplicationBoard's main fetch, so react-query
  // de-duplicates and we don't double-fetch when toggling between views.
  const { data: rawTickets = [], isLoading } = useQuery({
    queryKey: ["app-board", entity],
    queryFn: () => base44.entities[entity].list("-created_date", 500),
    refetchInterval: 5000,
    enabled: !!entity,
  });

  // Cal.com bookings (franchise only) — merged onto tickets as `_cal_booking`
  // so the thread row can show meeting details. Same query key as the board
  // so it's deduped/cached.
  const { data: calBookings = {} } = useQuery({
    queryKey: ["cal-bookings"],
    queryFn: async () => {
      const resp = await base44.functions.invoke("getCalBookings", {});
      return resp?.data?.bookings || {};
    },
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: sourceKey === "franchise",
  });

  // Latest outbound email timestamp per ticket — so the thread row shows the
  // submission date by default, overridden by the most recent email sent.
  // We filter to this source's entity to keep the result set small.
  const { data: lastEmailByTicket = {} } = useQuery({
    queryKey: ["inbox-last-email", entity],
    queryFn: async () => {
      const msgs = await base44.entities.EmailMessage.filter(
        { ticket_type: entity, direction: "outbound" },
        "-sent_at",
        2000
      );
      const map = {};
      for (const m of msgs) {
        const ts = m.sent_at || m.created_date;
        if (!m.ticket_id || !ts) continue;
        // First hit wins because results are sorted by -sent_at.
        if (!map[m.ticket_id]) map[m.ticket_id] = ts;
      }
      return map;
    },
    refetchInterval: 15000,
    staleTime: 10000,
    enabled: !!entity,
  });

  // Set of ticket IDs that have at least one inbound reply — drives the
  // "replied" pill on each row and the replied/not-replied filter.
  const { data: repliedTicketIds = new Set() } = useQuery({
    queryKey: ["inbox-replied-tickets", entity],
    queryFn: async () => {
      const msgs = await base44.entities.EmailMessage.filter(
        { ticket_type: entity, direction: "inbound" },
        "-created_date",
        2000
      );
      const s = new Set();
      for (const m of msgs) if (m.ticket_id) s.add(m.ticket_id);
      return s;
    },
    refetchInterval: 15000,
    staleTime: 10000,
    enabled: !!entity,
  });

  const tickets = useMemo(
    () =>
      (rawTickets || []).map((t) => {
        const emailKey = (t.email || "").toLowerCase().trim();
        return {
          ...t,
          _cal_booking: emailKey ? calBookings[emailKey] || null : null,
          _last_email_at: lastEmailByTicket[t.id] || null,
          _has_reply: repliedTicketIds.has(t.id),
        };
      }),
    [rawTickets, calBookings, lastEmailByTicket, repliedTicketIds]
  );

  // Per-status counts for the left rail. Archived tickets are folded into
  // the "Not Interested" bucket (closed for franchise; declined otherwise)
  // so they're reachable from a single rail item. Includes the "upcoming"
  // pseudo-status (franchise only): tickets that have a Cal.com booking
  // whose start time is in the future.
  // Reverse map: folded child status -> parent rail status (per source).
  const foldedChildToParent = useMemo(() => {
    const map = {};
    const src = STATUS_FOLD_MAP[sourceKey] || {};
    Object.entries(src).forEach(([parent, children]) => {
      children.forEach((c) => (map[c] = parent));
    });
    return map;
  }, [sourceKey]);

  const statusCounts = useMemo(() => {
    const c = {};
    statuses.forEach((s) => (c[s] = 0));
    const now = Date.now();
    tickets.forEach((t) => {
      if (t.archived) {
        if (c[notInterestedKey] !== undefined) c[notInterestedKey]++;
        return;
      }
      // Fold child statuses (e.g. scheduled/discussion/...) into their parent
      // rail bucket so the count reflects everything in that group.
      const bucketKey = foldedChildToParent[t.status] || t.status;
      if (c[bucketKey] !== undefined) c[bucketKey]++;
      const startIso = t._cal_booking?.start;
      if (startIso && new Date(startIso).getTime() >= now) {
        c[UPCOMING_MEETINGS_KEY] = (c[UPCOMING_MEETINGS_KEY] || 0) + 1;
      }
    });
    return c;
  }, [tickets, statuses, notInterestedKey, foldedChildToParent]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return tickets.filter((t) => {
      // "Not Interested" filter shows both declined/closed tickets AND any
      // archived tickets, merged together.
      if (statusFilter === notInterestedKey) {
        if (!t.archived && t.status !== notInterestedKey) return false;
      } else {
        if (t.archived) return false;
        if (statusFilter === UPCOMING_MEETINGS_KEY) {
          const startIso = t._cal_booking?.start;
          if (!startIso || new Date(startIso).getTime() < now) return false;
        } else if (statusFilter) {
          // Expand parent rail status to include any folded child statuses.
          const allowed = expandStatusFilter(sourceKey, statusFilter);
          if (!allowed.includes(t.status)) return false;
        }
      }
      if (!q) return true;
      return (
        (t.full_name || "").toLowerCase().includes(q) ||
        (t.first_name || "").toLowerCase().includes(q) ||
        (t.last_name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.preferred_location || "").toLowerCase().includes(q) ||
        (t.preferred_studio || "").toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter, notInterestedKey]);

  // Auto-select the first available thread whenever nothing is selected —
  // DESKTOP ONLY (>= lg / 1024px). On mobile and tablet, we want users to
  // land on the thread list and pick a conversation themselves; otherwise
  // the email panel takes over the whole screen on load with no way back.
  // We mirror the thread list's sort here so "first" matches the first row
  // the user actually sees on screen.
  useEffect(() => {
    if (selectedId || filtered.length === 0) return;
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;
    const sortMode = getDefaultSort(sourceKey, statusFilter);
    const sorted = sortTickets(filtered, sortMode);
    if (sorted.length > 0) setSelectedId(sorted[0].id);
  }, [filtered, selectedId, sourceKey, statusFilter]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) || null;

  const title =
    statusFilter === UPCOMING_MEETINGS_KEY
      ? "Upcoming Meetings"
      : statusFilter
      ? statusLabel(sourceKey, statusFilter)
      : meta.label;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex gap-2 md:gap-3 px-2 pb-3">
        {/* Status rail — always visible across all viewports, including while
            reading a thread on mobile/tablet (so users can quickly switch
            statuses without backing out of the conversation). */}
        <div className="flex">
          <InboxStatusRail
            sourceKey={sourceKey}
            statuses={statuses}
            active={statusFilter}
            onChange={(s) => {
              setStatusFilter(s);
              // Clear so the auto-select effect picks the first ticket of the
              // newly-filtered list across the thread + conversation + contact
              // panels.
              setSelectedId(null);
            }}
            counts={statusCounts}
            accent={accent}
          />
        </div>

        {/* Thread list */}
        <div
          className={`flex-1 min-w-0 lg:flex-none lg:w-[340px] ${
            selectedTicket ? "hidden lg:flex" : "flex"
          } flex-col min-h-0`}
        >
          <InboxThreadList
            key={`${sourceKey}-${statusFilter || "all"}`}
            title={title}
            count={filtered.length}
            tickets={filtered}
            selectedId={selectedId}
            onSelect={(t) => setSelectedId(t.id)}
            search={search}
            setSearch={setSearch}
            sourceKey={sourceKey}
            statusKey={statusFilter}
            unreadByTicket={unreadCountByTicket}
            isLoading={isLoading}
          />
        </div>

        {/* Right pane: conversation + (on < xl) inline details, controlled by
            mobileTab. On xl+ both conversation and details are visible
            side-by-side in their own columns. */}
        <div
          className={`flex-1 min-w-0 ${
            selectedTicket ? "flex" : "hidden lg:flex"
          } flex-col min-h-0`}
        >
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              {/* Mobile/tablet (< lg) — back-to-list link above the thread. */}
              <div className="lg:hidden mb-2 flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" /> List
                </button>
              </div>

              {/* Conversation — always visible. Details lives in a persistent
                  side column on xl+ and in a slide-in drawer on < xl. This
                  gives the SAME pattern (right-anchored details) everywhere. */}
              <div className="flex-1 min-h-0 flex flex-col">
                <EmailThreadPanel
                  ticket={selectedTicket}
                  ticketType={entity}
                  currentUser={user}
                  markAsRead={markAsRead}
                  headerContent={
                    <div className="flex items-center gap-2 flex-wrap">
                      <ThreadHeaderBar
                        ticket={selectedTicket}
                        ticketType={entity}
                        sourceKey={sourceKey}
                        onOpenDetails={() => setDetailsDrawerOpen(true)}
                        showDetailsBtn={true}
                      />
                      {/* xl+ only — collapse/expand the persistent side panel */}
                      <button
                        type="button"
                        onClick={() => setDetailsCollapsed((v) => !v)}
                        title={detailsCollapsed ? "Show details panel" : "Hide details panel"}
                        className="hidden xl:inline-flex shrink-0 items-center justify-center h-7 w-7 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        {detailsCollapsed ? (
                          <PanelRightOpen className="w-3.5 h-3.5" />
                        ) : (
                          <PanelRightClose className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/60 bg-white/5 rounded-2xl border border-white/10 backdrop-blur">
              <MessagesSquare className="w-10 h-10 mb-2 opacity-60" />
              <span className="text-sm">Select a conversation to get started.</span>
            </div>
          )}
        </div>

        {/* Contact panel — persistent side column on xl+ only.
            Hidden when the user collapses it via the email header toggle. */}
        {selectedTicket && !detailsCollapsed && (
          <div className="hidden xl:flex w-[300px] shrink-0 flex-col min-h-0">
            <InboxContactPanel
              ticket={selectedTicket}
              sourceKey={sourceKey}
              detailFields={detailFieldsBySource[sourceKey] || []}
              accent={accent}
              currentUser={user}
            />
          </div>
        )}
      </div>

      {/* Details drawer — < xl only, slides in as an overlay with an X close.
          Same right-anchored pattern as the xl+ side column for consistency. */}
      {selectedTicket && (
        <div className="xl:hidden">
          <DetailsDrawer
            open={detailsDrawerOpen}
            onClose={() => setDetailsDrawerOpen(false)}
            title={displayName(selectedTicket)}
          >
            <InboxContactPanel
              ticket={selectedTicket}
              sourceKey={sourceKey}
              detailFields={detailFieldsBySource[sourceKey] || []}
              accent={accent}
              currentUser={user}
            />
          </DetailsDrawer>
        </div>
      )}
    </div>
  );
}