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
  "flex-1 overflow-y-auto kanban-scroll p-2 md:p-3 space-y-2 md:space-y-3 transition-colors";

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
  // Optional: when provided, fades the desktop grid between key values
  // (used by Franchise to animate between Step One / Step Two).
  animateKey,
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

  // Desktop mirrors the mobile/tablet swimlane pattern exactly: flex row with
  // explicit per-column widths via `calc()` so each column has a concrete CSS
  // pixel width (just like mobile's `w-[78%]` / `w-[300px]`). This is what
  // makes drag behave smoothly on mobile — @hello-pangea/dnd's pre-drag width
  // snapshot is reliable when the parent column has a real pixel width rather
  // than a CSS-Grid-track computed width.
  const colWidth = `calc((100% - ${(columns.length - 1) * 24}px) / ${columns.length})`;
  const desktopGridInner = (
    <div className="hidden lg:flex gap-6 h-full">
      {columns.map((col) => (
        <div
          key={col}
          data-swimlane
          className="flex-shrink-0 min-w-0 h-full"
          style={{ width: colWidth }}
        >
          {columnFor(col)}
        </div>
      ))}
    </div>
  );

  // IMPORTANT: do NOT wrap in framer-motion (AnimatePresence/motion.div).
  // Even opacity-only animations cause framer-motion to write `transform`
  // and `will-change` to the element, which (a) creates a containing block
  // for the portaled `position: fixed` dragged card — making the cursor
  // offset jump — and (b) interferes with @hello-pangea/dnd's width snapshot.
  // We use a plain re-mount with a `key` to keep the Step One / Step Two
  // swap clean. This matches the mobile path which has no animation wrapper.
  const desktopGrid = (
    <div key={animateKey || "static"} className="hidden lg:block h-full">
      {desktopGridInner}
    </div>
  );

  return (
    <div className="board-height-wrap h-full">
      {desktopGrid}

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
    </div>
  );
}