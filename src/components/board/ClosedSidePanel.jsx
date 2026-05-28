import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import { getStatusLabel } from "./boardConfig";

/**
 * Glass-style slide-in side panel that hosts secondary swimlanes (closed/declined
 * + ghosted), keeping them out of the main grid but a click away. Uses the
 * existing KanbanColumn so DnD, status changes, and counts continue to work.
 *
 * Accepts `statuses`: [{ status, tickets, onArchiveSome?, onArchiveAll? }, ...]
 * Columns are rendered side-by-side inside the panel.
 */
export default function ClosedSidePanel({
  statuses = [],
  onStatusChange,
  onArchiveChange,
  onTicketClick,
  isLoading,
  highlightedTicketId,
  viewMode,
  statusOptions,
  boardKey,
  unreadCountByTicket,
}) {
  const [open, setOpen] = useState(false);

  if (!statuses.length) return null;

  // Panel width scales with number of columns
  const panelWidth = statuses.length === 1 ? 380 : 380 + (statuses.length - 1) * 320;
  const totalCount = statuses.reduce((sum, s) => sum + (s.tickets?.length || 0), 0);
  const handleLabel = statuses.map((s) => getStatusLabel(boardKey, s.status)).join(" · ");

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

      {/* Handle — bottom-right pill on mobile/tablet, vertical right-edge on desktop */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:bg-white/30 transition-colors"
        aria-label={`${open ? "Close" : "Open"} side panel`}
      >
        <ChevronRight
          className="w-3.5 h-3.5 text-white"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(-90deg)",
            transition: "transform 300ms",
          }}
        />
        <span className="text-[10px] tracking-[0.15em] font-semibold text-white uppercase">
          {handleLabel} · {totalCount}
        </span>
      </button>

      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center gap-1.5 px-2 py-4 rounded-l-xl backdrop-blur-xl bg-white/20 border border-r-0 border-white/30 shadow-lg hover:bg-white/30 transition-colors"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: open
            ? `translate(-${panelWidth}px, -50%)`
            : "translate(0, -50%)",
          transition: "transform 300ms ease-in-out, background-color 200ms",
        }}
        aria-label={`${open ? "Close" : "Open"} side panel`}
      >
        <ChevronRight
          className="w-4 h-4 text-white"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 300ms",
          }}
        />
        <span className="text-[10px] tracking-[0.2em] font-semibold text-white uppercase">
          {handleLabel} · {totalCount}
        </span>
      </button>

      {/* Mobile/tablet mini panel — bottom-right floating card */}
      <aside
        className="lg:hidden fixed bottom-16 right-4 z-40 flex flex-col"
        style={{
          width: "min(85vw, 360px)",
          maxHeight: "70vh",
          transform: open ? "translateY(0) scale(1)" : "translateY(8px) scale(0.96)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 250ms ease-out, opacity 250ms ease-out",
          transformOrigin: "bottom right",
        }}
      >
        <div
          className="flex-1 min-h-0 rounded-2xl overflow-hidden backdrop-blur-2xl border border-white/30 shadow-2xl p-2 flex gap-2"
        >
          {statuses.map(({ status, tickets, onArchiveSome, onArchiveAll }) => (
            <div key={status} className="flex-1 min-w-0">
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
          ))}
        </div>
      </aside>

      {/* Desktop panel — full-height slide-in from right */}
      <aside
        className="hidden lg:flex fixed top-0 right-0 h-screen z-40 p-4 flex-col"
        style={{
          width: `${panelWidth}px`,
          maxWidth: "95vw",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <div
          className="flex-1 min-h-0 rounded-2xl overflow-hidden backdrop-blur-2xl border border-white/30 shadow-2xl p-3 flex gap-3"
        >
          {statuses.map(({ status, tickets, onArchiveSome, onArchiveAll }) => (
            <div key={status} className="flex-1 min-w-0">
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
          ))}
        </div>
      </aside>
    </>
  );
}