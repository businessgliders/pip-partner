import React from "react";
import ReactDOM from "react-dom";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Archive, Trash2 } from "lucide-react";
import TicketCard from "./TicketCard";

const columnColors = {
  // Franchise
  new:        "from-pink-400/20 to-pink-300/20 border-pink-300/40",
  scheduled:  "from-blue-400/20 to-blue-300/20 border-blue-300/40",
  contacted:  "from-purple-400/20 to-purple-300/20 border-purple-300/40",
  qualified:  "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  closed:     "from-gray-400/20 to-gray-300/20 border-gray-300/40",
  // Influencer
  pending:    "from-amber-400/20 to-amber-300/20 border-amber-300/40",
  approved:   "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  declined:   "from-rose-400/20 to-rose-300/20 border-rose-300/40",
  // Instructor / Front Admin
  reviewed:   "from-sky-400/20 to-sky-300/20 border-sky-300/40",
  invited:    "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
};

const headerColors = {
  new:        "bg-pink-500/30 border-pink-400/40",
  scheduled:  "bg-blue-500/30 border-blue-400/40",
  contacted:  "bg-purple-500/30 border-purple-400/40",
  qualified:  "bg-emerald-500/30 border-emerald-400/40",
  closed:     "bg-gray-500/30 border-gray-400/40",
  pending:    "bg-amber-500/30 border-amber-400/40",
  approved:   "bg-emerald-500/30 border-emerald-400/40",
  declined:   "bg-rose-500/30 border-rose-400/40",
  reviewed:   "bg-sky-500/30 border-sky-400/40",
  invited:    "bg-emerald-500/30 border-emerald-400/40",
};

const DIM_STATUSES = new Set(["closed", "declined"]);
const RESOLVED_STATUSES = new Set(["qualified", "approved", "invited"]);
const CLOSED_STATUSES = new Set(["closed", "declined"]);

function getBody(provided, snapshot, child) {
  const body = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={provided.draggableProps.style}
    >
      {child(snapshot.isDragging)}
    </div>
  );
  return snapshot.isDragging ? ReactDOM.createPortal(body, document.body) : body;
}

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
  statusOptions,
  tabKey,
}) {
  const isDimmed = DIM_STATUSES.has(status);
  const colorClass = columnColors[status] || "from-slate-400/20 to-slate-300/20 border-slate-300/40";
  const headerClass = headerColors[status] || "bg-slate-500/30 border-slate-400/40";

  return (
    <div
      data-swimlane
      className={`backdrop-blur-xl bg-gradient-to-b ${colorClass} border rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[70vh] lg:max-h-none lg:h-[calc(100vh-260px)] ${isDimmed ? "opacity-60 hover:opacity-100 transition-opacity" : ""}`}
    >
      <div className={`backdrop-blur-md ${headerClass} border-b px-3 md:px-4 py-3 md:py-4 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-semibold text-sm md:text-base capitalize truncate">{status}</h3>
          <span className="inline-flex items-center justify-center bg-white/30 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[24px]">
            {tickets.length}
          </span>
        </div>
        {RESOLVED_STATUSES.has(status) && onTidyUp && tickets.length > 0 && (
          <button
            onClick={onTidyUp}
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/30 hover:bg-white/40 text-white text-xs font-medium"
          >
            <Sparkles className="w-3 h-3" /> Tidy Up
          </button>
        )}
        {CLOSED_STATUSES.has(status) && onArchiveSome && onArchiveAll && tickets.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            <button
              onClick={onArchiveSome}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/30 hover:bg-white/40 text-white text-xs font-medium"
            >
              <Trash2 className="w-3 h-3" /> Clean Up
            </button>
            <button
              onClick={onArchiveAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/30 hover:bg-white/40 text-white text-xs font-medium"
            >
              <Archive className="w-3 h-3" /> Archive All
            </button>
          </div>
        )}
      </div>

      <Droppable droppableId={status}>
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className={`flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-2 ${dropSnapshot.isDraggingOver ? "bg-white/10" : ""}`}
          >
            {isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 md:h-32 rounded-xl bg-white/20" />)
            ) : tickets.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/60 text-sm">No applications</div>
            ) : (
              tickets.map((ticket, idx) => (
                <Draggable key={ticket.id} draggableId={ticket.id} index={idx}>
                  {(prov, snap) => getBody(prov, snap, (isDragging) => (
                    <TicketCard
                      ticket={ticket}
                      onStatusChange={onStatusChange}
                      onClick={() => onTicketClick && onTicketClick(ticket)}
                      isDragging={isDragging}
                      isHighlighted={highlightedTicketId === ticket.id}
                      viewMode={viewMode}
                      statusOptions={statusOptions}
                      tabKey={tabKey}
                    />
                  ))}
                </Draggable>
              ))
            )}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
}