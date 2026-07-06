import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MessagesSquare } from "lucide-react";
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
 *   Left rail (desktop) / top strip (mobile): status filter
 *   Middle: thread list (submissions in the active source)
 *   Right: EmailThreadPanel (conversation) + InboxContactPanel (details)
 *
 * `onMobileThreadStateChange` — fires with { threadOpen } whenever a
 * mobile/tablet user opens or closes a conversation, so the parent page can
 * hide chrome (iOS bottom tab bar) and give the whole viewport to the thread.
 */
export default function InboxView({
  activeTab,
  onTabChange,
  user,
  detailFieldsBySource = {},
  unreadCountByTicket = {},
  markAsRead,
  onMobileThreadStateChange,
  initialTicketId = null,
  onInitialTicketConsumed,
}) {
  const sourceKey = activeTab;
  const meta = SOURCE_META[sourceKey] || SOURCE_META.franchise;
  const accent = meta.accent;
  const entity = entityForSource(sourceKey);
  const statuses = statusOrderFor(sourceKey);

  const [statusFilter, setStatusFilter] = useState(() => statusOrderFor(sourceKey)[0] || null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(initialTicketId || null);
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
  // If we're being handed an initialTicketId at the same time (deep-link from
  // calendar/map), keep it selected instead of clearing.
  useEffect(() => {
    setStatusFilter(statusOrderFor(sourceKey)[0] || null);
    setSearch("");
    setSelectedId(initialTicketId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  // Close the drawer whenever the user switches to a different conversation.
  useEffect(() => {
    setDetailsDrawerOpen(false);
  }, [selectedId]);

  // Notify the parent (ApplicationBoard) whenever the mobile/tablet thread
  // panel takes over the viewport, so the iOS bottom tab bar can be hidden
  // during reading and reappear once the user backs out to the list.
  useEffect(() => {
    if (!onMobileThreadStateChange) return;
    onMobileThreadStateChange({ threadOpen: !!selectedId });
  }, [selectedId, onMobileThreadStateChange]);

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
      if (statusFilter === notInterestedKey) {
        if (!t.archived && t.status !== notInterestedKey) return false;
      } else {
        if (t.archived) return false;
        if (statusFilter === UPCOMING_MEETINGS_KEY) {
          const startIso = t._cal_booking?.start;
          if (!startIso || new Date(startIso).getTime() < now) return false;
        } else if (statusFilter) {
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

  // Deep-link from another view (calendar/map): when an initialTicketId is
  // provided, point the status rail at that ticket's bucket so it's visible
  // in the list, then hand the "consumed" signal back up so the parent can
  // clear its handoff state.
  const initialConsumedRef = React.useRef(false);
  useEffect(() => {
    if (!initialTicketId || initialConsumedRef.current) return;
    if (!tickets || tickets.length === 0) return;
    const t = tickets.find((x) => x.id === initialTicketId);
    if (!t) return;
    // Prefer the archived bucket for archived tickets, otherwise the ticket's
    // own status (or its folded rail parent).
    if (t.archived) {
      setStatusFilter(notInterestedKey);
    } else {
      const bucketKey = foldedChildToParent[t.status] || t.status;
      if (statuses.includes(bucketKey)) setStatusFilter(bucketKey);
    }
    setSelectedId(initialTicketId);
    initialConsumedRef.current = true;
    onInitialTicketConsumed?.();
  }, [initialTicketId, tickets, notInterestedKey, foldedChildToParent, statuses, onInitialTicketConsumed]);

  // Reset the consumed guard if the parent hands us a NEW ticket id later.
  useEffect(() => {
    initialConsumedRef.current = false;
  }, [initialTicketId]);

  // Auto-select the first available thread — desktop only. On mobile/tablet
  // the user lands on the list and picks a conversation themselves.
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

  // Status rail — a single shared instance rendered in two different slots:
  //  · Mobile (< md): horizontal strip above the thread list.
  //  · md+ (tablet + desktop): vertical rail on the left, always visible.
  const railOnChange = (s) => {
    setStatusFilter(s);
    // Clear so the auto-select effect picks the first ticket of the newly-
    // filtered list.
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex gap-2 md:gap-3 px-2 pb-3">
        {/* Vertical status rail — md+ only. On mobile it's rendered as a
            horizontal strip above the thread list (see below). */}
        <div className="hidden md:flex">
          <InboxStatusRail
            sourceKey={sourceKey}
            statuses={statuses}
            active={statusFilter}
            onChange={railOnChange}
            counts={statusCounts}
            accent={accent}
            orientation="vertical"
          />
        </div>

        {/* Thread list column — hidden on mobile/tablet once a conversation
            is selected, so the email panel gets the entire viewport. */}
        <div
          className={`flex-1 min-w-0 lg:flex-none lg:w-[340px] ${
            selectedTicket ? "hidden lg:flex" : "flex"
          } flex-col min-h-0`}
        >
          {/* Mobile-only horizontal status rail at the top of the list. */}
          <div className="md:hidden mb-2">
            <InboxStatusRail
              sourceKey={sourceKey}
              statuses={statuses}
              active={statusFilter}
              onChange={railOnChange}
              counts={statusCounts}
              accent={accent}
              orientation="horizontal"
            />
          </div>
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

        {/* Right pane: conversation. Details is a persistent side column on
            xl+ and a slide-in drawer on < xl (consistent right-anchored
            pattern across every breakpoint). */}
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

              <div className="flex-1 min-h-0 flex flex-col">
                <EmailThreadPanel
                  ticket={selectedTicket}
                  ticketType={entity}
                  currentUser={user}
                  markAsRead={markAsRead}
                  headerContent={
                    <ThreadHeaderBar
                      ticket={selectedTicket}
                      ticketType={entity}
                      sourceKey={sourceKey}
                      onOpenDetails={() => setDetailsDrawerOpen(true)}
                      showDetailsBtn={true}
                      detailsCollapsed={detailsCollapsed}
                      onToggleDetailsPanel={() => setDetailsCollapsed((v) => !v)}
                    />
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

        {/* Contact panel — persistent side column on xl+ only. */}
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

      {/* Details drawer — < xl only, slides in as an overlay. Same right-
          anchored pattern as the xl+ side column for consistency. */}
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