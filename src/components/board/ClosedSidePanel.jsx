import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import KanbanColumn from "./KanbanColumn";

/**
 * Glass-style slide-in side panel that hosts the "closed"/"declined" swimlane,
 * keeping it out of the main grid but a click away. Uses the existing
 * KanbanColumn so DnD, status changes, and counts continue to work.
 */
export default function ClosedSidePanel({
  status,
  tickets,
  onStatusChange,
  onArchiveChange,
  onTicketClick,
  isLoading,
  highlightedTicketId,
  onArchiveSome,
  onArchiveAll,
  viewMode,
  statusOptions,
  boardKey,
  unreadCountByTicket,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:bg-black/20"
          aria-hidden="true"
        />
      )}

      {/* Handle (always visible, anchored to right edge) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 px-2 py-4 rounded-l-xl backdrop-blur-xl bg-white/20 border border-r-0 border-white/30 shadow-lg hover:bg-white/30 transition-colors"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: open
            ? "translate(-380px, -50%)"
            : "translate(0, -50%)",
          transition: "transform 300ms ease-in-out, background-color 200ms",
        }}
        aria-label={`${open ? "Close" : "Open"} ${status} panel`}
      >
        <ChevronRight
          className="w-4 h-4 text-white"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 300ms",
          }}
        />
        <span className="text-[10px] tracking-[0.2em] font-semibold text-white uppercase">
          {status} · {tickets.length}
        </span>
      </button>

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 h-screen w-[380px] max-w-[90vw] z-40 p-4 flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <div
          className="flex-1 min-h-0 rounded-2xl overflow-hidden backdrop-blur-2xl border border-white/30 shadow-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
          }}
        >
          <KanbanColumn
            status={status}
            tickets={tickets}
            onStatusChange={onStatusChange}
            onArchiveChange={onArchiveChange}
            onTicketClick={onTicketClick}
            isLoading={isLoading}
            highlightedTicketId={highlightedTicketId}
            onArchiveSome={onArchiveSome}
            onArchiveAll={onArchiveAll}
            viewMode={viewMode}
            statusOptions={statusOptions}
            boardKey={boardKey}
            unreadCountByTicket={unreadCountByTicket}
          />
        </div>
      </aside>
    </>
  );
}