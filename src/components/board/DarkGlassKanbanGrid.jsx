import React from "react";
import { MasterKanbanColumn } from "@/components/master-kanban";
import TicketCard from "./TicketCard";
import { getStatusMeta } from "./boardConfig";

// Shared dark-glass skin used by Influencer / Instructor / Front Desk grids
// inside the canonical MasterKanbanColumn. Keeps the legacy glassmorphic
// look 1:1 while routing through the master library.
//
// The parent passes a per-status palette (colorClasses + headerClasses) so
// each board can pick its own column colors without forking this file.

const SHELL_CLASSES =
  "backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-0 h-[calc(100dvh-260px)] lg:h-[calc(100vh-220px)] bg-gradient-to-b transition-opacity";

const LIST_CLASSES =
  "flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 transition-colors";

const TITLE_CLASSES = "text-white font-semibold capitalize text-xs md:text-base truncate";
const COUNT_BADGE_CLASSES =
  "text-[11px] px-2 py-0.5 rounded-full bg-white/30 border border-white/40 text-white font-medium";
const DESCRIPTION_CLASSES =
  "text-white/70 text-[10px] leading-tight mt-0.5 truncate hidden md:block";
const EMPTY_CLASSES = "text-center text-white/60 text-sm py-8";

export default function DarkGlassKanbanGrid({
  boardKey,
  columns,
  getTicketsByColumn,
  isLoading,
  highlightedTicketId,
  unreadCountByTicket,
  onTicketClick,
  onStatusChange,
  onArchiveChange,
  statusOptions,
  columnColors,
  headerColors,
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

  const columnFor = (col) => {
    const meta = getStatusMeta(boardKey, col);
    return (
      <MasterKanbanColumn
        status={meta?.label || col}
        tickets={getTicketsByColumn(col)}
        isLoading={isLoading}
        highlightedTicketId={highlightedTicketId}
        unreadByTicket={unreadCountByTicket}
        onTicketClick={onTicketClick}
        renderCardContent={renderCardContent}
        colorClasses={columnColors[col] || "from-white/30 to-white/10 border-white/30"}
        headerClasses={headerColors[col] || "bg-white/40 border-white/40"}
        description={meta?.description}
        emptyLabel="No applications"
        shellClasses={SHELL_CLASSES}
        listClasses={LIST_CLASSES}
        titleClasses={TITLE_CLASSES}
        countBadgeClasses={COUNT_BADGE_CLASSES}
        descriptionClasses={DESCRIPTION_CLASSES}
        emptyClasses={EMPTY_CLASSES}
        bareCard
      />
    );
  };

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden lg:grid grid-cols-4 gap-6 h-full">
        {columns.map((col) => (
          <div key={col} data-swimlane className="min-w-0 h-full">
            {columnFor(col)}
          </div>
        ))}
      </div>

      {/* Mobile/tablet horizontal swimlane scroller */}
      <div className="lg:hidden h-full flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth overscroll-x-contain pb-2 -mx-4 pl-4 pr-4">
        {columns.map((col) => (
          <div
            key={col}
            data-swimlane
            className="flex-shrink-0 w-[78%] sm:w-[300px] md:w-[290px] snap-start h-full"
          >
            {columnFor(col)}
          </div>
        ))}
      </div>
    </>
  );
}