import React from "react";
import ReactDOM from "react-dom";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Archive, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import MasterKanbanCard from "./MasterKanbanCard";
import DragLiftWrapper from "./DragLiftWrapper";

/**
 * MasterKanbanColumn — generic kanban column.
 *
 * Combines:
 *   - pip-events' clean props API (slim, predictable)
 *   - pip-support's optional bulk actions (Tidy Up, Archive Some, Archive All)
 *   - pip-events' portal-on-drag (escapes blurred/clipped ancestors)
 *
 * The column itself is presentational. The parent passes:
 *   - `colorClasses` / `headerClasses` for per-status theming
 *   - `renderCardContent(ticket)` to render the ticket body
 *
 * Theming overrides (v0.1.2 — all optional, default to previous hard-coded values):
 *   - shellClasses, listClasses, titleClasses, countBadgeClasses,
 *     descriptionClasses, emptyClasses
 *   - bareCard — forwarded to MasterKanbanCard to skip the default white chrome
 *
 * Optional action props (hidden unless provided):
 *   - onTidyUp, onArchiveSome, onArchiveAll
 */
export default function MasterKanbanColumn({
  status,
  tickets = [],
  isLoading = false,
  isDimmed = false,
  highlightedTicketId,
  unreadByTicket = {},
  onTicketClick,
  renderCardContent,
  // Per-status theming (parent decides)
  colorClasses = "from-white/20 to-white/10 border-white/30",
  headerClasses = "bg-white/30 border-white/40",
  // Optional bulk actions
  onTidyUp,
  onArchiveSome,
  onArchiveAll,
  emptyLabel = "No items",
  // Optional per-column subtitle (e.g. workflow description / next-step hint)
  description,
  // v0.1.2 — opt-in theming overrides (all default to previous hard-coded values,
  // so existing callsites are unaffected)
  shellClasses = "flex-shrink-0 w-[42vw] md:w-72 lg:w-80 h-full flex flex-col rounded-2xl border bg-gradient-to-b backdrop-blur-sm transition-opacity",
  listClasses = "flex-1 p-3 space-y-2 min-h-32 overflow-y-auto transition-colors",
  titleClasses = "text-sm font-semibold text-slate-800",
  countBadgeClasses = "text-xs font-medium text-slate-600 bg-white/60 rounded-full px-2 py-0.5",
  descriptionClasses = "text-[11px] text-slate-600/80 mt-0.5 leading-snug",
  emptyClasses = "text-center text-xs text-slate-500 py-8",
  bareCard = false,
}) {
  // Drag is enabled on ALL viewports (including touch). The portal-to-body
  // pattern on the dragged card keeps the pointer aligned correctly on mobile.
  return (
    <div
      data-kanban-column
      className={cn(
        shellClasses,
        colorClasses,
        isDimmed && "opacity-60"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-start justify-between px-4 py-3 border-b rounded-t-2xl gap-2", headerClasses)}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={titleClasses}>{status}</h3>
            <span className={countBadgeClasses}>
              {tickets.length}
            </span>
          </div>
          {description && (
            <p className={descriptionClasses}>
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onTidyUp && tickets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTidyUp}
              className="h-7 px-2 text-xs gap-1 text-slate-700 hover:bg-white/50"
              title="Tidy Up"
            >
              <Sparkles className="w-3 h-3" />
              Tidy
            </Button>
          )}
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

      {/* Droppable list */}
      <Droppable droppableId={status}>
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            data-kanban-list
            className={cn(
              listClasses,
              dropSnapshot.isDraggingOver && "bg-white/30"
            )}
          >
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : tickets.length === 0 ? (
              <div className={emptyClasses}>{emptyLabel}</div>
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
                          // iOS-style: kill text-selection callouts & system gestures
                          // mid-drag so the finger keeps full control of the card.
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
                            bareCard={bareCard}
                          />
                        </DragLiftWrapper>
                      </div>
                    );
                    // Portal dragged item to body — escapes blurred/clipped ancestors
                    // and keeps the pointer aligned in viewport coordinates.
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
      </Droppable>
    </div>
  );
}