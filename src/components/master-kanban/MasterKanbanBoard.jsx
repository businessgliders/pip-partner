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
  // v0.1.3 — bounded height on the scroll row so each column's inner list
  // scrolls independently (sticky column headers, content doesn't push the
  // whole page). Defaults tuned by pip-events (140px desktop / 120px mobile based
  // on actual header heights). Override per-app if your chrome is taller/shorter.
  boardHeightClasses = "h-[calc(100dvh-140px)] md:h-[calc(100dvh-120px-56px-env(safe-area-inset-bottom,0px))]",
}) {
  const { ref, canScrollLeft, canScrollRight, scrollBy } = useHorizontalScroll();

  // Lock column scroll while any card is being dragged — prevents the swimlane
  // from panning under the finger on touch devices. Cards still reorder
  // normally (other cards push up/down to make space).
  const handleDragStart = () => {
    if (typeof document !== "undefined") document.body.classList.add("dnd-dragging");
  };
  const handleDragEnd = (result) => {
    if (typeof document !== "undefined") document.body.classList.remove("dnd-dragging");
    onDragEnd?.(result);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mirror mouse-drag exactly on touch: while a card is being dragged,
          freeze every scroll container so ONLY the card moves with the
          pointer (matches how mouse drag feels on desktop, where the page
          and columns don't auto-pan). The library still re-orders cards
          inside the list via placeholders. */}
      <style>{`
        body.dnd-dragging {
          overflow: hidden !important;
          overscroll-behavior: none;
        }
        body.dnd-dragging [data-kanban-list] {
          overflow: hidden !important;
          overscroll-behavior: contain;
        }
      `}</style>
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

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          ref={ref}
          className={cn(
            "flex gap-4 overflow-x-auto pb-4 px-2 scroll-smooth snap-x",
            boardHeightClasses
          )}
        >
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