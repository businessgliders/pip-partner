import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import EmailThreadPanel from "@/components/email/EmailThreadPanel";
import InboxStatusRail from "./InboxStatusRail";
import InboxThreadList from "./InboxThreadList";
import InboxContactPanel from "./InboxContactPanel";
import {
  SOURCE_META,
  statusOrderFor,
  entityForSource,
  statusLabel,
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

  const [statusFilter, setStatusFilter] = useState(null); // null = "All"
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Reset state when source changes.
  useEffect(() => {
    setStatusFilter(null);
    setSearch("");
    setSelectedId(null);
    setShowArchived(false);
  }, [sourceKey]);

  // Shares the same query key as ApplicationBoard's main fetch, so react-query
  // de-duplicates and we don't double-fetch when toggling between views.
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["app-board", entity],
    queryFn: () => base44.entities[entity].list("-created_date", 500),
    refetchInterval: 5000,
    enabled: !!entity,
  });

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
      <div className="flex-1 min-h-0 flex gap-3 px-2 pb-3">
        {/* Status rail (desktop+tablet) */}
        <InboxStatusRail
          sourceKey={sourceKey}
          statuses={statuses}
          active={statusFilter}
          onChange={(s) => {
            setStatusFilter(s);
            setShowArchived(false);
          }}
          counts={statusCounts}
          accent={accent}
          archivedActive={showArchived}
          onArchived={() => {
            setShowArchived(true);
            setStatusFilter(null);
          }}
          archivedCount={archivedCount}
        />

        {/* Thread list */}
        <div
          className={`w-full lg:w-[340px] shrink-0 ${
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

        {/* Conversation panel */}
        <div
          className={`flex-1 min-w-0 ${
            selectedTicket ? "flex" : "hidden lg:flex"
          } flex-col min-h-0`}
        >
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="lg:hidden mb-2 inline-flex items-center gap-1 text-xs text-white/80 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back to list
              </button>
              <div className="flex-1 min-h-0">
                <EmailThreadPanel
                  ticket={selectedTicket}
                  ticketType={entity}
                  currentUser={user}
                  markAsRead={markAsRead}
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

        {/* Contact panel (desktop only) */}
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