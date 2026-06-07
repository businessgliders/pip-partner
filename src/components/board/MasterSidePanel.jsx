import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import MasterKanbanCard from "@/components/master-kanban/MasterKanbanCard";
import DragLiftWrapper from "@/components/master-kanban/DragLiftWrapper";
import { Button } from "@/components/ui/button";

/**
 * MasterSidePanel — slim collapsible hosted panel for "closing" statuses
 * (closed / ghosted / declined). Lives INSIDE the parent <DragDropContext> so
 * cards from the main board can be dropped into it.
 *
 * Visual contract mirrors the legacy HostedSidePanel:
 *   - Collapsed: thin vertical handle with status label + count, fixed to the
 *     right edge of the board, stacked vertically when multiple panels exist
 *     (via `verticalAlign`: "top" | "middle" | "bottom").
 *   - Expanded: 18rem-wide drawer sliding out from the handle, with the same
 *     glass column chrome as a regular MasterKanbanColumn.
 *
 * `droppableId` is the raw status key (matches the main board's columns), so
 * the parent's onDragEnd translator works the same way.
 */
export default function MasterSidePanel({
  status,
  statusKey,
  tickets = [],
  description,
  colorClasses = "from-white/20 to-white/10 border-white/30",
  headerClasses = "bg-white/30 border-white/40",
  highlightedTicketId,
  unreadByTicket = {},
  onTicketClick,
  renderCardContent,
  onArchiveSome,
  onArchiveAll,
  verticalAlign = "middle",
}) {
  const [expanded, setExpanded] = useState(false);

  const topClass =
    verticalAlign === "top"
      ? "top-4"
      : verticalAlign === "bottom"
        ? "bottom-4"
        : "top-1/2 -translate-y-1/2";

  return (
    <div
      className={cn(
        "hidden lg:flex absolute right-0 z-30 items-stretch",
        topClass
      )}
    >
      {/* Expanded drawer */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          expanded ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "h-[60vh] max-h-[640px] flex flex-col rounded-2xl border bg-gradient-to-b backdrop-blur-sm shadow-xl mr-1",
            colorClasses
          )}
        >
          <div
            className={cn(
              "flex items-start justify-between px-4 py-3 border-b rounded-t-2xl gap-2",
              headerClasses
            )}
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{status}</h3>
                <span className="text-xs font-medium text-slate-600 bg-white/60 rounded-full px-2 py-0.5">
                  {tickets.length}
                </span>
              </div>
              {description && (
                <p className="text-[11px] text-slate-600/80 mt-0.5 leading-snug">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onArchiveSome && tickets.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchiveSome}
                  className="h-7 px-2 text-xs text-slate-700 hover:bg-white/50"
                  title="Clean Up"
                >
                  Clean
                </Button>
              )}
              {onArchiveAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchiveAll}
                  disabled={tickets.length === 0}
                  className="h-7 px-2 text-xs gap-1 text-slate-700 hover:bg-white/50 disabled:opacity-40"
                  title="Archive All"
                >
                  <Archive className="w-3 h-3" />
                  All
                </Button>
              )}
            </div>
          </div>

          {expanded && <Droppable droppableId={statusKey}>
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                data-kanban-list
                className={cn(
                  "flex-1 p-3 space-y-2 overflow-y-auto transition-colors",
                  dropSnapshot.isDraggingOver && "bg-white/30"
                )}
              >
                {tickets.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">
                    No items
                  </div>
                ) : (
                  tickets.map((ticket, index) => (
                    <Draggable
                      key={ticket.id}
                      draggableId={ticket.id}
                      index={index}
                    >
                      {(provided, snapshot) => {
                        const child = (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              zIndex: snapshot.isDragging ? 9999 : "auto",
                              WebkitUserSelect: "none",
                              userSelect: "none",
                              WebkitTouchCallout: "none",
                              touchAction: snapshot.isDragging ? "none" : "manipulation",
                            }}
                          >
                            <DragLiftWrapper isDragging={snapshot.isDragging}>
                              <MasterKanbanCard
                                ticket={ticket}
                                onClick={() => !snapshot.isDragging && onTicketClick?.(ticket)}
                                isDragging={snapshot.isDragging}
                                isHighlighted={ticket.id === highlightedTicketId}
                                unreadCount={unreadByTicket[ticket.id] || 0}
                                renderContent={renderCardContent}
                                dragBorderClasses={headerClasses}
                              />
                            </DragLiftWrapper>
                          </div>
                        );
                        if (snapshot.isDragging && typeof document !== "undefined") {
                          return ReactDOM.createPortal(child, document.body);
                        }
                        return child;
                      }}
                    </Draggable>
                  ))
                )}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>}
        </div>
      </div>

      {/* Collapsed handle — drop target only when collapsed (otherwise the
          expanded drawer owns the droppable for this status). */}
      {!expanded ? (
        <Droppable droppableId={statusKey}>
          {(dropProvided, dropSnapshot) => (
            <button
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
              onClick={() => setExpanded(true)}
              title={`Show ${status}`}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 px-2 py-4 rounded-l-xl backdrop-blur-md border border-r-0 shadow-lg text-white hover:bg-white/30 transition-all",
                dropSnapshot.isDraggingOver
                  ? "bg-white/40 border-white/60"
                  : "bg-white/20 border-white/30"
              )}
              style={{ writingMode: "vertical-rl" }}
            >
              <span className="text-[10px] font-semibold tracking-wider uppercase">
                {status}
              </span>
              <div
                className="flex items-center gap-1"
                style={{ writingMode: "horizontal-tb" }}
              >
                <ChevronLeft className="w-4 h-4" />
                {tickets.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[8px] font-bold text-gray-900">
                    {tickets.length}
                  </span>
                )}
              </div>
              <span className="hidden">{dropProvided.placeholder}</span>
            </button>
          )}
        </Droppable>
      ) : (
        <button
          onClick={() => setExpanded(false)}
          title={`Hide ${status}`}
          className="flex flex-col items-center justify-center gap-1.5 px-2 py-4 rounded-l-xl backdrop-blur-md bg-white/20 border border-r-0 border-white/30 shadow-lg text-white hover:bg-white/30 transition-all"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase">
            {status}
          </span>
          <div className="flex items-center gap-1" style={{ writingMode: "horizontal-tb" }}>
            <ChevronRight className="w-4 h-4" />
            {tickets.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[8px] font-bold text-gray-900">
                {tickets.length}
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
}