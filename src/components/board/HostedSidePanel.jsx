import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MasterKanbanColumn } from "@/components/master-kanban";
import TicketCard from "./TicketCard";
import { getStatusMeta } from "./boardConfig";

/**
 * HostedSidePanel — single-status, right-edge collapsible panel.
 *
 * Matches the PIP Events Request Board "Hosted" pattern: a vertical handle
 * tab on the right edge, expanding into one back-office swimlane column.
 *
 * Multiple instances stack vertically via the `verticalAlign` prop
 * ("top" | "middle" | "bottom") so callers can show e.g. "Declined" + "Ghosted"
 * side panels without overlapping handles.
 *
 * Reuses MasterKanbanColumn so drag/drop, card styling, and counts behave
 * identically to the main grid.
 */
const ALIGN_STYLES = {
  top: { top: "12vh", bottom: "auto", translate: "translateY(0)" },
  middle: { top: "50%", bottom: "auto", translate: "translateY(-50%)" },
  bottom: { top: "auto", bottom: "12vh", translate: "translateY(0)" },
};

const HANDLE_GRADIENTS = {
  closed: "linear-gradient(135deg, #a855f7, #9333ea)",
  declined: "linear-gradient(135deg, #ef4444, #b91c1c)",
  ghosted: "linear-gradient(135deg, #64748b, #475569)",
  approved: "linear-gradient(135deg, #10b981, #059669)",
};

const PANEL_GRADIENTS = {
  closed: "from-violet-400/25 to-purple-300/15 border-violet-300/40",
  declined: "from-rose-400/25 to-red-300/15 border-rose-300/40",
  ghosted: "from-slate-400/25 to-slate-300/15 border-slate-300/40",
  approved: "from-emerald-400/25 to-emerald-300/15 border-emerald-300/40",
};

const HEADER_TINTS = {
  closed: "bg-violet-500/50 border-violet-300/50",
  declined: "bg-rose-500/50 border-rose-300/50",
  ghosted: "bg-slate-500/50 border-slate-300/50",
  approved: "bg-emerald-500/50 border-emerald-300/50",
};

export default function HostedSidePanel({
  status,
  tickets,
  boardKey,
  verticalAlign = "middle",
  highlightedTicketId,
  unreadCountByTicket,
  onTicketClick,
  onStatusChange,
  onArchiveChange,
  onArchiveSome,
  onArchiveAll,
  statusOptions,
  isLoading,
}) {
  const [open, setOpen] = useState(false);
  const meta = getStatusMeta(boardKey, status);
  const label = meta?.label || status;
  const count = tickets?.length || 0;

  const align = ALIGN_STYLES[verticalAlign] || ALIGN_STYLES.middle;
  const handleGradient = HANDLE_GRADIENTS[status] || HANDLE_GRADIENTS.closed;
  const panelGradient = PANEL_GRADIENTS[status] || PANEL_GRADIENTS.closed;
  const headerTint = HEADER_TINTS[status] || HEADER_TINTS.closed;

  const renderCardContent = (ticket) => (
    <TicketCard
      ticket={ticket}
      onStatusChange={onStatusChange}
      onArchiveChange={onArchiveChange}
      isDragging={false}
      isHighlighted={ticket.id === highlightedTicketId}
      viewMode="status"
      statusOptions={statusOptions}
      boardKey={boardKey}
      unreadCount={unreadCountByTicket?.[ticket.id] || 0}
    />
  );

  return (
    <>
      {/* Backdrop when open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
          aria-hidden="true"
        />
      )}

      {/* Vertical handle — always visible on lg+ */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden lg:flex fixed z-40 items-center justify-center rounded-l-2xl border border-r-0 border-white/40 shadow-lg hover:brightness-110 transition-all"
        style={{
          right: open ? 320 : 0,
          top: align.top,
          bottom: align.bottom,
          transform: align.translate,
          width: 32,
          height: 120,
          background: handleGradient,
          transition: "right 300ms ease-in-out, filter 200ms",
        }}
        aria-label={`${open ? "Close" : "Open"} ${label} panel`}
      >
        <div
          className="flex items-center gap-1.5 text-white"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          {open ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">
            {label} · {count}
          </span>
        </div>
      </button>

      {/* Mobile floating pill — bottom-right stack */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="lg:hidden fixed z-40 flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/40 shadow-lg text-white hover:brightness-110 transition-all"
        style={{
          right: 16,
          bottom: verticalAlign === "top" ? 132 : verticalAlign === "middle" ? 74 : 16,
          background: handleGradient,
        }}
        aria-label={`${open ? "Close" : "Open"} ${label} panel`}
      >
        {open ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        <span className="text-[10px] tracking-[0.15em] font-semibold uppercase">
          {label} · {count}
        </span>
      </button>

      {/* Desktop panel */}
      <aside
        className={`hidden lg:flex board-height-wrap fixed top-0 right-0 h-screen z-40 p-4 flex-col rounded-l-2xl`}
        style={{
          width: 320,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <div
          className={`flex-1 min-h-0 rounded-2xl overflow-hidden backdrop-blur-2xl border bg-gradient-to-b ${panelGradient} shadow-2xl flex`}
        >
          <div className="flex-1 min-w-0 h-full p-2">
            <MasterKanbanColumn
              status={label}
              tickets={tickets}
              isLoading={isLoading}
              highlightedTicketId={highlightedTicketId}
              unreadByTicket={unreadCountByTicket}
              onTicketClick={onTicketClick}
              renderCardContent={renderCardContent}
              colorClasses="from-white/10 to-white/5 border-white/20"
              headerClasses={headerTint}
              description={meta?.description}
              emptyLabel="No applications"
              onArchiveSome={onArchiveSome}
              onArchiveAll={onArchiveAll}
              shellClasses="flex-1 min-w-0 h-full flex flex-col rounded-2xl border bg-gradient-to-b backdrop-blur-sm transition-opacity"
              listClasses="flex-1 overflow-y-auto kanban-scroll p-2 md:p-3 space-y-2 md:space-y-3 transition-colors"
              titleClasses="text-white font-semibold capitalize text-sm truncate"
              countBadgeClasses="text-[11px] px-2 py-0.5 rounded-full bg-white/30 border border-white/40 text-white font-medium"
              descriptionClasses="text-white/70 text-[10px] leading-tight mt-0.5 truncate"
              emptyClasses="text-center text-white/60 text-sm py-8"
              bareCard
            />
          </div>
        </div>
      </aside>

      {/* Mobile panel — bottom-right floating card */}
      <aside
        className="lg:hidden board-height-wrap fixed bottom-16 right-4 z-40 flex flex-col"
        style={{
          width: "min(85vw, 340px)",
          maxHeight: "65vh",
          transform: open ? "translateY(0) scale(1)" : "translateY(8px) scale(0.96)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 250ms ease-out, opacity 250ms ease-out",
          transformOrigin: "bottom right",
        }}
      >
        <div
          className={`flex-1 min-h-0 rounded-2xl overflow-hidden backdrop-blur-2xl border bg-gradient-to-b ${panelGradient} shadow-2xl p-2 flex`}
        >
          <div className="flex-1 min-w-0">
            <MasterKanbanColumn
              status={label}
              tickets={tickets}
              isLoading={isLoading}
              highlightedTicketId={highlightedTicketId}
              unreadByTicket={unreadCountByTicket}
              onTicketClick={onTicketClick}
              renderCardContent={renderCardContent}
              colorClasses="from-white/10 to-white/5 border-white/20"
              headerClasses={headerTint}
              description={meta?.description}
              emptyLabel="No applications"
              onArchiveSome={onArchiveSome}
              onArchiveAll={onArchiveAll}
              shellClasses="flex-1 min-w-0 h-full flex flex-col rounded-2xl border bg-gradient-to-b backdrop-blur-sm transition-opacity"
              listClasses="flex-1 overflow-y-auto kanban-scroll p-2 md:p-3 space-y-2 md:space-y-3 transition-colors"
              titleClasses="text-white font-semibold capitalize text-xs truncate"
              countBadgeClasses="text-[10px] px-2 py-0.5 rounded-full bg-white/30 border border-white/40 text-white font-medium"
              descriptionClasses="text-white/70 text-[10px] leading-tight mt-0.5 truncate hidden"
              emptyClasses="text-center text-white/60 text-sm py-8"
              bareCard
            />
          </div>
        </div>
      </aside>
    </>
  );
}