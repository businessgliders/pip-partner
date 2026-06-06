import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import useHorizontalScroll from "@/hooks/useHorizontalScroll";
import MasterKanbanColumn from "./MasterKanbanColumn";

/**
 * MasterKanbanBoard — generic board orchestrator.
 *
 * Wraps the columns with:
 *   - DragDropContext (parent receives onDragEnd)
 *   - Gold-standard horizontal scroll arrows (from pip-support)
 *
 * The parent owns the data shape and decides:
 *   - `columns`: array of { status, tickets, colorClasses?, headerClasses?, isDimmed? }
 *   - `onDragEnd(result)`: standard @hello-pangea/dnd handler
 *   - `renderCardContent(ticket)`: per-app card body
 *   - `getActions(status)`: optional — returns { onTidyUp, onArchiveSome, onArchiveAll }
 */
export default function MasterKanbanBoard({
  columns = [],
  onDragEnd,
  isLoading = false,
  highlightedTicketId,
  unreadByTicket = {},
  onTicketClick,
  renderCardContent,
  getActions,
  className,
}) {
  const { ref, canScrollLeft, canScrollRight, scrollBy } = useHorizontalScroll();

  return (
    <div className={cn("relative", className)}>
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white transition"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
      )}
      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white transition"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div ref={ref} className="flex gap-4 overflow-x-auto pb-4 px-2 scroll-smooth snap-x">
          {columns.map((col) => {
            const actions = getActions?.(col.status) || {};
            return (
              <MasterKanbanColumn
                key={col.status}
                status={col.status}
                tickets={col.tickets || []}
                isLoading={isLoading}
                isDimmed={col.isDimmed}
                colorClasses={col.colorClasses}
                headerClasses={col.headerClasses}
                description={col.description}
                highlightedTicketId={highlightedTicketId}
                unreadByTicket={unreadByTicket}
                onTicketClick={onTicketClick}
                renderCardContent={renderCardContent}
                emptyLabel={col.emptyLabel}
                {...actions}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}