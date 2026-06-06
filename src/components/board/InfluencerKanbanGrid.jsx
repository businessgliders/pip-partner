import React from "react";
import { MasterKanbanColumn } from "@/components/master-kanban";
import TicketCard from "./TicketCard";
import { getStatusMeta } from "./boardConfig";

// Glassy dark palette piped through to Master so the influencer board
// keeps the existing look while using the canonical column component.
const columnColors = {
  pending: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  approved: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  declined: "from-rose-400/20 to-rose-300/20 border-rose-300/40",
};

const headerColors = {
  pending: "bg-slate-500/30 border-slate-400/40",
  approved: "bg-emerald-500/30 border-emerald-400/40",
  declined: "bg-rose-500/30 border-rose-400/40",
};

/**
 * InfluencerKanbanGrid — Influencer-only grid using MasterKanbanColumn.
 *
 * Renders the column array directly inside the parent's existing
 * <DragDropContext>. No DragDropContext nesting (parent owns drag).
 *
 * Side panel (declined / ghosted) is rendered separately by the parent
 * via <ClosedSidePanel>, so this component handles only the main lanes.
 */
export default function InfluencerKanbanGrid({
  columns,
  getTicketsByColumn,
  isLoading,
  highlightedTicketId,
  unreadCountByTicket,
  onTicketClick,
  onStatusChange,
  onArchiveChange,
  statusOptions,
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
      boardKey="influencer"
      unreadCount={unreadCountByTicket[ticket.id] || 0}
    />
  );

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden lg:grid grid-cols-4 gap-6 h-full">
        {columns.map((col) => {
          const meta = getStatusMeta("influencer", col);
          return (
            <div key={col} data-swimlane className="min-w-0 h-full">
              <MasterKanbanColumn
                status={meta?.label || col}
                tickets={getTicketsByColumn(col)}
                isLoading={isLoading}
                highlightedTicketId={highlightedTicketId}
                unreadByTicket={unreadCountByTicket}
                onTicketClick={onTicketClick}
                renderCardContent={renderCardContent}
                colorClasses={`backdrop-blur-xl ${columnColors[col] || "from-white/30 to-white/10 border-white/30"}`}
                headerClasses={`backdrop-blur-md ${headerColors[col] || "bg-white/40 border-white/40"}`}
                description={meta?.description}
                emptyLabel="No applications"
              />
            </div>
          );
        })}
      </div>

      {/* Mobile/tablet swimlane — parent's SwimlaneScroller is desktop-grid-aware,
          but for the influencer branch we don't reuse it. The Master columns are
          rendered in the same horizontal scroll container as the rest of the app. */}
      <div className="lg:hidden h-full flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth overscroll-x-contain pb-2 -mx-4 pl-4 pr-4">
        {columns.map((col) => {
          const meta = getStatusMeta("influencer", col);
          return (
            <div
              key={col}
              data-swimlane
              className="flex-shrink-0 w-[78%] sm:w-[300px] md:w-[290px] snap-start h-full"
            >
              <MasterKanbanColumn
                status={meta?.label || col}
                tickets={getTicketsByColumn(col)}
                isLoading={isLoading}
                highlightedTicketId={highlightedTicketId}
                unreadByTicket={unreadCountByTicket}
                onTicketClick={onTicketClick}
                renderCardContent={renderCardContent}
                colorClasses={`backdrop-blur-xl ${columnColors[col] || "from-white/30 to-white/10 border-white/30"}`}
                headerClasses={`backdrop-blur-md ${headerColors[col] || "bg-white/40 border-white/40"}`}
                description={meta?.description}
                emptyLabel="No applications"
              />
            </div>
          );
        })}
      </div>
    </>
  );
}