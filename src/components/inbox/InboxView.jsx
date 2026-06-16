import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MessagesSquare, Info } from "lucide-react";
import EmailThreadPanel from "@/components/email/EmailThreadPanel";
import InboxStatusRail from "./InboxStatusRail";
import InboxThreadList from "./InboxThreadList";
import InboxContactPanel from "./InboxContactPanel";
import InboxStatusDropdown from "./InboxStatusDropdown";
import FranchiseMeetingPills from "./FranchiseMeetingPills";
import FddCountdownPill from "@/components/board/FddCountdownPill";
import {
  SOURCE_META,
  statusOrderFor,
  entityForSource,
  statusLabel,
  displayName,
} from "./inboxConfig";

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
  const [showArchived, setShowArchived] = useState(false);
  // Mobile/tablet (< xl) tab to switch the right pane between the conversation
  // and the contact details. Resets to "conversation" whenever the selected
  // ticket changes so opening a new conversation always lands on the email view.
  const [mobileTab, setMobileTab] = useState("conversation");

  // Reset state when source changes — default to the first status of the new
  // source so the user lands on a focused list (and the first conversation in
  // that list will auto-preselect via the effect below on desktop).
  useEffect(() => {
    setStatusFilter(statusOrderFor(sourceKey)[0] || null);
    setSearch("");
    setSelectedId(null);
    setShowArchived(false);
  }, [sourceKey]);

  useEffect(() => {
    setMobileTab("conversation");
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

  const tickets = useMemo(
    () =>
      (rawTickets || []).map((t) => {
        const emailKey = (t.email || "").toLowerCase().trim();
        return { ...t, _cal_booking: emailKey ? calBookings[emailKey] || null : null };
      }),
    [rawTickets, calBookings]
  );

  // Per-status counts for the left rail (non-archived only).
  const statusCounts = useMemo(() => {
    const c = {};
    statuses.forEach((s) => (c[s] = 0));
    tickets.forEach((t) => {
      if (t.archived) return;
      if (c[t.status] !== undefined) c[t.status]++;
    });
    return c;
  }, [tickets, statuses]);

  const archivedCount = useMemo(
    () => tickets.filter((t) => t.archived).length,
    [tickets]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (showArchived) {
        if (!t.archived) return false;
      } else {
        if (t.archived) return false;
        if (statusFilter && t.status !== statusFilter) return false;
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
  }, [tickets, search, statusFilter, showArchived]);

  // Auto-select first thread when nothing is selected (desktop only).
  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      const isDesktop =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop) setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selectedTicket = tickets.find((t) => t.id === selectedId) || null;

  const title = showArchived
    ? "Archived"
    : statusFilter
    ? statusLabel(sourceKey, statusFilter)
    : meta.label;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex gap-2 md:gap-3 px-2 pb-3">
        {/* Status rail — visible on mobile/tablet too; hidden only when a
            conversation is opened on screens < lg (full-screen reading mode). */}
        <div className={selectedTicket ? "hidden lg:flex" : "flex"}>
          <InboxStatusRail
            sourceKey={sourceKey}
            statuses={statuses}
            active={statusFilter}
            onChange={(s) => {
              setStatusFilter(s);
              setShowArchived(false);
              // Clear so the auto-select effect picks the first ticket of the
              // newly-filtered list across the thread + conversation + contact
              // panels.
              setSelectedId(null);
            }}
            counts={statusCounts}
            accent={accent}
            archivedActive={showArchived}
            onArchived={() => {
              setShowArchived(true);
              setStatusFilter(null);
              setSelectedId(null);
            }}
            archivedCount={archivedCount}
          />
        </div>

        {/* Thread list */}
        <div
          className={`flex-1 min-w-0 lg:flex-none lg:w-[340px] ${
            selectedTicket ? "hidden lg:flex" : "flex"
          } flex-col min-h-0`}
        >
          <InboxThreadList
            title={title}
            count={filtered.length}
            tickets={filtered}
            selectedId={selectedId}
            onSelect={(t) => setSelectedId(t.id)}
            search={search}
            setSearch={setSearch}
            sourceKey={sourceKey}
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
              {/* Mobile/tablet header: back + container(name + #) + status + (tablet only) horizontal toggle */}
              <div className="xl:hidden flex items-center gap-2 mb-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden inline-flex items-center gap-1 text-xs text-white/80 hover:text-white shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" /> List
                </button>
                {/* Backgrounded container behind client name + ticket # + (franchise) FDD pill */}
                <div className="flex items-center gap-1.5 min-w-0 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur">
                  <span className="text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {displayName(selectedTicket)}
                  </span>
                  {selectedTicket.app_number && (
                    <span className="text-[10px] text-white/60 shrink-0">
                      #{selectedTicket.app_number}
                    </span>
                  )}
                  {sourceKey === "franchise" && (
                    <FddCountdownPill ticket={selectedTicket} />
                  )}
                </div>
                <InboxStatusDropdown ticket={selectedTicket} sourceKey={sourceKey} />
                {/* Franchise FDD timer + Cal.com pills — mobile/tablet header
                    (xl+ shows the full cluster inside the details panel). */}
                {sourceKey === "franchise" && (
                  <FranchiseMeetingPills ticket={selectedTicket} compact />
                )}
                {/* Horizontal toggle — tablet/desktop only (mobile uses the vertical strip). */}
                <div className="hidden md:flex ml-auto items-center gap-0.5 p-0.5 rounded-full bg-white/15 border border-white/25">
                  <button
                    type="button"
                    onClick={() => setMobileTab("conversation")}
                    className={`h-7 px-3 rounded-full text-[11px] font-medium transition-colors ${
                      mobileTab === "conversation"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    Conversation
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("details")}
                    className={`h-7 px-3 rounded-full text-[11px] font-medium transition-colors ${
                      mobileTab === "details"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Main row: panel + (mobile-only) vertical conv/details strip on the right */}
              <div className="flex-1 min-h-0 flex gap-2">
                {/* Conversation — always visible on xl+, hidden on < xl when
                    the user switches to the details tab. */}
                <div
                  className={`flex-1 min-w-0 min-h-0 flex-col ${
                    mobileTab === "details" ? "hidden xl:flex" : "flex"
                  }`}
                >
                  <EmailThreadPanel
                    ticket={selectedTicket}
                    ticketType={entity}
                    currentUser={user}
                    markAsRead={markAsRead}
                  />
                </div>

                {/* Details inline — only used on < xl when the user switches
                    to the details tab; xl+ uses the side-column instance below. */}
                <div
                  className={`flex-1 min-w-0 min-h-0 xl:hidden ${
                    mobileTab === "details" ? "flex flex-col" : "hidden"
                  }`}
                >
                  <InboxContactPanel
                    ticket={selectedTicket}
                    sourceKey={sourceKey}
                    detailFields={detailFieldsBySource[sourceKey] || []}
                    accent={accent}
                  />
                </div>

                {/* Vertical conv/details strip — mobile only */}
                <div className="md:hidden flex flex-col gap-1 shrink-0 self-start p-1 rounded-2xl bg-white/15 border border-white/25 backdrop-blur shadow-lg">
                  <button
                    type="button"
                    onClick={() => setMobileTab("conversation")}
                    title="Conversation"
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      mobileTab === "conversation"
                        ? "bg-white text-slate-900 shadow"
                        : "text-white/75 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <MessagesSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("details")}
                    title="Details"
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      mobileTab === "details"
                        ? "bg-white text-slate-900 shadow"
                        : "text-white/75 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/60 bg-white/5 rounded-2xl border border-white/10 backdrop-blur">
              <MessagesSquare className="w-10 h-10 mb-2 opacity-60" />
              <span className="text-sm">Select a conversation to get started.</span>
            </div>
          )}
        </div>

        {/* Contact panel — side column on xl+ only */}
        {selectedTicket && (
          <div className="hidden xl:flex w-[300px] shrink-0 flex-col min-h-0">
            <InboxContactPanel
              ticket={selectedTicket}
              sourceKey={sourceKey}
              detailFields={detailFieldsBySource[sourceKey] || []}
              accent={accent}
            />
          </div>
        )}
      </div>
    </div>
  );
}