import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Trash2, Archive } from "lucide-react";
import TicketCard from "./TicketCard";
import { getStatusMeta } from "./boardConfig";

// Drag-and-drop reordering is desktop-only. Below the `lg` breakpoint we
// render the swimlane scroller, where vertical card-list scrolling and
// horizontal lane swiping take priority over DnD. Detect that here so we
// can skip the drag handle on touch viewports.
function useIsTouchViewport() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isTouch;
}

// Wraps a single Draggable card. While the user is dragging, the card is
// portaled to <body> so it isn't clipped by the column's overflow and isn't
// offset by ancestor transforms (e.g. the AnimatePresence motion.div on the
// desktop grid). @hello-pangea/dnd handles position/size automatically via
// draggableProps.style when the rendered node is a direct child of body.
function DraggableTicket({
  dragProvided,
  dragSnapshot,
  ticket,
  onStatusChange,
  onArchiveChange,
  onTicketClick,
  highlightedTicketId,
  viewMode,
  statusOptions,
  boardKey,
  unreadCount,
}) {
  const card = (
    <div
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      {...dragProvided.dragHandleProps}
      style={{
        ...dragProvided.draggableProps.style,
        touchAction: "auto",
      }}
    >
      <TicketCard
        ticket={ticket}
        onStatusChange={onStatusChange}
        onArchiveChange={onArchiveChange}
        onClick={() => !dragSnapshot.isDragging && onTicketClick?.(ticket)}
        isDragging={dragSnapshot.isDragging}
        isHighlighted={highlightedTicketId === ticket.id}
        viewMode={viewMode}
        statusOptions={statusOptions}
        boardKey={boardKey}
        unreadCount={unreadCount}
      />
    </div>
  );

  return dragSnapshot.isDragging ? ReactDOM.createPortal(card, document.body) : card;
}

// Generic palettes keyed by column name (status or category). Falls back gracefully.
const columnColors = {
  // statuses
  new: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  pending: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  scheduled: "from-orange-400/20 to-orange-300/20 border-orange-300/40",
  discussion: "from-amber-400/20 to-amber-300/20 border-amber-300/40",
  site_selection: "from-cyan-400/20 to-cyan-300/20 border-cyan-300/40",
  lease: "from-indigo-400/20 to-indigo-300/20 border-indigo-300/40",
  build_out: "from-violet-400/20 to-violet-300/20 border-violet-300/40",
  training: "from-teal-400/20 to-teal-300/20 border-teal-300/40",
  reviewed: "from-blue-400/20 to-blue-300/20 border-blue-300/40",
  contacted: "from-purple-400/20 to-purple-300/20 border-purple-300/40",
  approved: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  invited: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  qualified: "from-pink-400/20 to-pink-300/20 border-pink-300/40",
  closed: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  declined: "from-rose-400/20 to-rose-300/20 border-rose-300/40",
  ghosted: "from-zinc-400/20 to-zinc-300/20 border-zinc-300/40",
};

const headerColors = {
  new: "bg-slate-500/30 border-slate-400/40",
  pending: "bg-slate-500/30 border-slate-400/40",
  scheduled: "bg-orange-500/30 border-orange-400/40",
  discussion: "bg-amber-500/30 border-amber-400/40",
  site_selection: "bg-cyan-500/30 border-cyan-400/40",
  lease: "bg-indigo-500/30 border-indigo-400/40",
  build_out: "bg-violet-500/30 border-violet-400/40",
  training: "bg-teal-500/30 border-teal-400/40",
  reviewed: "bg-blue-500/30 border-blue-400/40",
  contacted: "bg-purple-500/30 border-purple-400/40",
  approved: "bg-emerald-500/30 border-emerald-400/40",
  invited: "bg-emerald-500/30 border-emerald-400/40",
  qualified: "bg-pink-500/30 border-pink-400/40",
  closed: "bg-slate-500/30 border-slate-400/40",
  declined: "bg-rose-500/30 border-rose-400/40",
  ghosted: "bg-zinc-500/30 border-zinc-400/40",
};

export default function KanbanColumn({
  status,
  tickets,
  onStatusChange,
  onArchiveChange,
  onTicketClick,
  isLoading,
  highlightedTicketId,
  onArchiveSome,
  onArchiveAll,
  onTidyUp,
  viewMode,
  statusOptions = [],
  boardKey,
  unreadCountByTicket = {},
}) {
  // Disable drag-and-drop on touch viewports so vertical swimlane scrolling
  // and horizontal lane swipes work without the lib hijacking touch events.
  const isTouch = useIsTouchViewport();
  const key = String(status).toLowerCase();
  const colCls = columnColors[key] || "from-white/30 to-white/10 border-white/30";
  const headCls = headerColors[key] || "bg-white/40 border-white/40";
  const meta = getStatusMeta(boardKey, key);
  const displayLabel = meta?.label || status;
  const description = meta?.description || "";

  return (
    <div
      className={`backdrop-blur-xl bg-gradient-to-b ${colCls} border rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-0`}
    >
      <div className={`backdrop-blur-md ${headCls} border-b px-2 md:px-4 py-2 md:py-4 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-1 md:gap-2">
          <div className="min-w-0">
            <h3 className="text-white font-semibold capitalize text-xs md:text-base truncate">{displayLabel}</h3>
            {description && (
              <p className="text-white/70 text-[10px] leading-tight mt-0.5 truncate hidden md:block">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(key === "qualified" || key === "approved" || key === "reviewed") && onTidyUp && tickets.length > 0 && (
              <button
                onClick={onTidyUp}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/30 hover:bg-white/40 text-white border border-white/40"
              >
                <Sparkles className="w-3 h-3" /> Tidy Up
              </button>
            )}
            {tickets.length >= 5 && onArchiveSome && (
              <button
                onClick={onArchiveSome}
                title="Clean Up"
                className="text-[10px] p-1 lg:px-2 lg:py-1 rounded-md bg-white/30 hover:bg-white/40 text-white border border-white/40 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden lg:inline">Clean Up</span>
              </button>
            )}
            {tickets.length >= 5 && onArchiveAll && (
              <button
                onClick={onArchiveAll}
                title="Archive All"
                className="text-[10px] p-1 lg:px-2 lg:py-1 rounded-md bg-white/30 hover:bg-white/40 text-white border border-white/40 inline-flex items-center gap-1"
              >
                <Archive className="w-3 h-3" />
                <span className="hidden lg:inline">Archive All</span>
              </button>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/30 border border-white/40 text-white font-medium">
              {tickets.length}
            </span>
          </div>
        </div>
      </div>

      <Droppable droppableId={String(status)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 transition-colors ${
              snapshot.isDraggingOver ? "bg-white/10" : ""
            }`}
            style={{ position: "static" }}
          >
            {isLoading ? (
              <>
                <Skeleton className="h-24 md:h-32 rounded-xl bg-white/20" />
                <Skeleton className="h-24 md:h-32 rounded-xl bg-white/20" />
                <Skeleton className="h-24 md:h-32 rounded-xl bg-white/20" />
              </>
            ) : tickets.length === 0 ? (
              <div className="text-center text-white/60 text-sm py-8">No applications</div>
            ) : (
              tickets.map((ticket, index) => (
                <Draggable key={ticket._dragId || ticket.id} draggableId={ticket._dragId || ticket.id} index={index} isDragDisabled={isTouch}>
                  {(dragProvided, dragSnapshot) => (
                    <DraggableTicket
                      dragProvided={dragProvided}
                      dragSnapshot={dragSnapshot}
                      ticket={ticket}
                      onStatusChange={onStatusChange}
                      onArchiveChange={onArchiveChange}
                      onTicketClick={onTicketClick}
                      highlightedTicketId={highlightedTicketId}
                      viewMode={viewMode}
                      statusOptions={statusOptions}
                      boardKey={boardKey}
                      unreadCount={unreadCountByTicket[ticket.id] || 0}
                    />
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}