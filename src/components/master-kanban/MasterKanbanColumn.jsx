import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Archive, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import MasterKanbanCard from "./MasterKanbanCard";

/**
 * DraggableCardWrapper — bulletproof drag positioning, independent of
 * ancestor containing blocks.
 *
 * Problem: @hello-pangea/dnd positions the dragged card with
 * `position: fixed; top: <px>; left: <px>; transform: translate(dx, dy)`.
 * The `top`/`left` values are the card's original location at drag start
 * — but they resolve against whatever the nearest containing block is.
 * If ANY ancestor has `transform`, `filter`, `backdrop-filter`,
 * `perspective`, `will-change: transform/filter`, or `contain: paint/layout`,
 * it becomes the containing block instead of the viewport — and the card
 * appears in the wrong place (commonly snapped to the top-left). Portaling
 * to <body> doesn't help because dnd's `top`/`left` were computed assuming
 * one containing block but now resolve against another.
 *
 * Fix: when dragging, we IGNORE dnd's `top`/`left`/`transform` entirely
 * and position the card ourselves in viewport coordinates:
 *   - Capture the card's `getBoundingClientRect()` at drag start.
 *   - Listen to `pointermove` and compute the new top-left based on the
 *     cursor's delta from where it was when drag started.
 *   - Apply `position: fixed; top: 0; left: 0; transform: translate(...)`
 *     directly, which always resolves correctly because we don't rely on
 *     ancestor coordinate spaces.
 */
function DraggableCardWrapper({ provided, snapshot, children }) {
  const wrapperRef = useRef(null);
  // Width while idle, used during drag so the portaled clone keeps its size.
  const [lockedWidth, setLockedWidth] = useState(null);
  // Drag state: { originLeft, originTop, cursorStartX, cursorStartY, dx, dy }
  const [dragPos, setDragPos] = useState(null);

  // Measure natural width while NOT dragging.
  useEffect(() => {
    if (!wrapperRef.current || snapshot.isDragging) return;
    const el = wrapperRef.current;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setLockedWidth(w);
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [snapshot.isDragging]);

  // Drive viewport-correct positioning while dragging.
  useLayoutEffect(() => {
    if (!snapshot.isDragging) {
      setDragPos(null);
      return;
    }
    if (!wrapperRef.current) return;

    // Capture origin rect BEFORE we override styles (it's still in normal
    // position because dnd hasn't applied its transform on first render).
    const rect = wrapperRef.current.getBoundingClientRect();
    const origin = { originLeft: rect.left, originTop: rect.top };

    let cursorStart = null;
    setDragPos({ ...origin, dx: 0, dy: 0 });

    const handleMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      if (cursorStart == null) {
        cursorStart = { x, y };
        return;
      }
      setDragPos({
        ...origin,
        dx: x - cursorStart.x,
        dy: y - cursorStart.y,
      });
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches[0]) {
        handleMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
      }
    }, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
    };
  }, [snapshot.isDragging]);

  const setRefs = (node) => {
    wrapperRef.current = node;
    provided.innerRef(node);
  };

  // While dragging, override dnd's position with our viewport-correct one.
  const dragStyle =
    snapshot.isDragging && dragPos
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          transform: `translate3d(${dragPos.originLeft + dragPos.dx}px, ${dragPos.originTop + dragPos.dy}px, 0)`,
          width: lockedWidth ? `${lockedWidth}px` : undefined,
          margin: 0,
          zIndex: 9999,
          pointerEvents: "none",
          transition: "none",
        }
      : null;

  return (
    <div
      ref={setRefs}
      data-dnd-card
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        ...(dragStyle || { zIndex: "auto" }),
      }}
    >
      {children}
    </div>
  );
}

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
  listClasses = "flex-1 p-3 space-y-2 min-h-32 overflow-y-auto kanban-scroll transition-colors",
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
          {onArchiveAll && tickets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onArchiveAll}
              className="h-7 px-2 text-xs gap-1 text-slate-700 hover:bg-white/50"
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
                <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                  {(provided, snapshot) => {
                    const child = (
                      <DraggableCardWrapper
                        provided={provided}
                        snapshot={snapshot}
                      >
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
                      </DraggableCardWrapper>
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