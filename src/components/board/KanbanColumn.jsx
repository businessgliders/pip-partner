import React from "react";
import ReactDOM from "react-dom";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import TicketCard from "./TicketCard";

// Generic palettes keyed by column name (status or category). Falls back gracefully.
const columnColors = {
  // statuses
  new: "from-pink-400/20 to-pink-300/20 border-pink-300/40",
  pending: "from-pink-400/20 to-pink-300/20 border-pink-300/40",
  scheduled: "from-blue-400/20 to-blue-300/20 border-blue-300/40",
  reviewed: "from-blue-400/20 to-blue-300/20 border-blue-300/40",
  contacted: "from-purple-400/20 to-purple-300/20 border-purple-300/40",
  approved: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  invited: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  qualified: "from-amber-400/20 to-amber-300/20 border-amber-300/40",
  closed: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  declined: "from-rose-400/20 to-rose-300/20 border-rose-300/40",
};

const headerColors = {
  new: "bg-pink-500/30 border-pink-400/40",
  pending: "bg-pink-500/30 border-pink-400/40",
  scheduled: "bg-blue-500/30 border-blue-400/40",
  reviewed: "bg-blue-500/30 border-blue-400/40",
  contacted: "bg-purple-500/30 border-purple-400/40",
  approved: "bg-emerald-500/30 border-emerald-400/40",
  invited: "bg-emerald-500/30 border-emerald-400/40",
  qualified: "bg-amber-500/30 border-amber-400/40",
  closed: "bg-slate-500/30 border-slate-400/40",
  declined: "bg-rose-500/30 border-rose-400/40",
};

export default function KanbanColumn({
  status,
  tickets,
  onStatusChange,
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
  const key = String(status).toLowerCase();
  const isDimmed = key === "closed" || key === "declined";
  const colCls = columnColors[key] || "from-white/30 to-white/10 border-white/30";
  const headCls = headerColors[key] || "bg-white/40 border-white/40";

  return (
    <div
      className={`backdrop-blur-xl bg-gradient-to-b ${colCls} border rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[70vh] lg:max-h-none lg:h-[calc(100vh-220px)] ${
        isDimmed ? "opacity-60 hover:opacity-100 transition-opacity" : ""
      }`}
    >
      <div className={`backdrop-blur-md ${headCls} border-b px-3 md:px-4 py-3 md:py-4 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-semibold capitalize text-sm md:text-base">{status}</h3>
          <div className="flex items-center gap-2">
            {(key === "qualified" || key === "approved" || key === "reviewed") && onTidyUp && tickets.length > 0 && (
              <button
                onClick={onTidyUp}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/30 hover:bg-white/40 text-white border border-white/40"
              >
                <Sparkles className="w-3 h-3" /> Tidy Up
              </button>
            )}
            {key === "closed" && tickets.length > 0 && onArchiveSome && (
              <button
                onClick={onArchiveSome}
                className="text-[10px] px-2 py-1 rounded-md bg-white/30 hover:bg-white/40 text-white border border-white/40"
              >
                Clean Up
              </button>
            )}
            {key === "closed" && tickets.length > 0 && onArchiveAll && (
              <button
                onClick={onArchiveAll}
                className="text-[10px] px-2 py-1 rounded-md bg-white/30 hover:bg-white/40 text-white border border-white/40"
              >
                Archive All
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
            className={`flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 custom-scrollbar transition-colors ${
              snapshot.isDraggingOver ? "bg-white/10" : ""
            }`}
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
                <Draggable key={ticket._dragId || ticket.id} draggableId={ticket._dragId || ticket.id} index={index}>
                  {(dragProvided, dragSnapshot) => {
                    const card = (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={dragProvided.draggableProps.style}
                      >
                        <TicketCard
                          ticket={ticket}
                          onStatusChange={onStatusChange}
                          onClick={() => onTicketClick?.(ticket)}
                          isDragging={dragSnapshot.isDragging}
                          isHighlighted={highlightedTicketId === ticket.id}
                          viewMode={viewMode}
                          statusOptions={statusOptions}
                          boardKey={boardKey}
                          unreadCount={unreadCountByTicket[ticket.id] || 0}
                        />
                      </div>
                    );
                    return dragSnapshot.isDragging ? ReactDOM.createPortal(card, document.body) : card;
                  }}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
      `}</style>
    </div>
  );
}