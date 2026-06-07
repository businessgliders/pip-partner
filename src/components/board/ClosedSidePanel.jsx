import React from "react";
import { MasterKanbanColumn } from "@/components/master-kanban";
import TicketCard from "./TicketCard";
import { getStatusMeta } from "./boardConfig";

// Side panel used by ApplicationBoard for "closed/declined" + "ghosted"
// statuses. Renders each status as a MasterKanbanColumn with the same
// dark-glass skin used by DarkGlassKanbanGrid, stacked vertically on
// desktop and as a compact floating panel on mobile.

const SHELL_CLASSES =
  "backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-0 bg-gradient-to-b transition-opacity";
const LIST_CLASSES =
  "flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 transition-colors";
const TITLE_CLASSES = "text-white font-semibold capitalize text-xs md:text-sm truncate";
const COUNT_BADGE_CLASSES =
  "text-[11px] px-2 py-0.5 rounded-full bg-white/30 border border-white/40 text-white font-medium";
const DESCRIPTION_CLASSES =
  "text-white/70 text-[10px] leading-tight mt-0.5 truncate hidden md:block";
const EMPTY_CLASSES = "text-center text-white/60 text-xs py-4";

// Neutral palette — closed/declined/ghosted all read as "archived-ish"
const COLOR_CLASSES = {
  closed: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  declined: "from-rose-400/20 to-rose-300/20 border-rose-300/40",
  ghosted: "from-zinc-400/20 to-zinc-300/20 border-zinc-300/40",
};
const HEADER_CLASSES = {
  closed: "bg-slate-500/30 border-slate-400/40",
  declined: "bg-rose-500/30 border-rose-400/40",
  ghosted: "bg-zinc-500/30 border-zinc-400/40",
};

export default function ClosedSidePanel({
  statuses = [],
  onStatusChange,
  onArchiveChange,
  onTicketClick,
  isLoading,
  highlightedTicketId,
  statusOptions,
  boardKey,
  unreadCountByTicket = {},
}) {
  const renderCardContent = (ticket) => (
    <TicketCard
      ticket={ticket}
      onStatusChange={onStatusChange}
      onArchiveChange={onArchiveChange}
      isDragging={false}
      isHighlighted={ticket.id === highlightedTicketId}
      viewMode="status"
      statusOptions={statusOptions}
      boardKey={boardKey}
      unreadCount={unreadCountByTicket[ticket.id] || 0}
    />
  );

  return (
    <div className="absolute bottom-4 right-4 lg:bottom-auto lg:top-0 lg:right-0 lg:h-full w-64 md:w-72 flex flex-col gap-3 z-10">
      {statuses.map(({ status, tickets, onArchiveSome, onArchiveAll }) => {
        const meta = getStatusMeta(boardKey, status);
        return (
          <div key={status} className="min-h-0 max-h-[40vh] lg:max-h-[calc(50vh-120px)] flex flex-col">
            <MasterKanbanColumn
              status={meta?.label || status}
              tickets={tickets}
              isLoading={isLoading}
              highlightedTicketId={highlightedTicketId}
              unreadByTicket={unreadCountByTicket}
              onTicketClick={onTicketClick}
              renderCardContent={renderCardContent}
              colorClasses={COLOR_CLASSES[status] || "from-white/30 to-white/10 border-white/30"}
              headerClasses={HEADER_CLASSES[status] || "bg-white/40 border-white/40"}
              description={meta?.description}
              emptyLabel="None"
              onArchiveSome={tickets.length >= 5 ? onArchiveSome : undefined}
              onArchiveAll={tickets.length >= 5 ? onArchiveAll : undefined}
              shellClasses={SHELL_CLASSES}
              listClasses={LIST_CLASSES}
              titleClasses={TITLE_CLASSES}
              countBadgeClasses={COUNT_BADGE_CLASSES}
              descriptionClasses={DESCRIPTION_CLASSES}
              emptyClasses={EMPTY_CLASSES}
              bareCard
            />
          </div>
        );
      })}
    </div>
  );
}