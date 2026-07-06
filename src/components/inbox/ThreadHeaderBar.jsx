import React from "react";
import { Info, MoreHorizontal, PanelRightClose, PanelRightOpen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InboxStatusDropdown from "./InboxStatusDropdown";
import FranchiseMeetingPills from "./FranchiseMeetingPills";
import SubmitterCalBookingsPopover from "@/components/admin/SubmitterCalBookingsPopover";
import FollowUpControl from "@/components/admin/FollowUpControl";
import { displayName } from "./inboxConfig";

/**
 * ThreadHeaderBar — two-row header shown above the email thread on every
 * viewport. Row 1 anchors the ticket identity (name, ticket #, status) with
 * secondary controls (details / panel toggle) right-aligned. Row 2 is a
 * horizontal pill strip of the most useful contextual actions — Cal.com
 * booking, join meeting, FDD countdown, follow-up bot, submitter bookings
 * history — overflowing anything that doesn't fit into a "More" popover.
 *
 * Props:
 *   ticket             — the selected submission
 *   ticketType         — entity name for follow-up mutations
 *   sourceKey          — inbox source (franchise/instructor/frontadmin/influencer)
 *   onOpenDetails      — called when the user taps the details button
 *                        (< xl only; xl+ shows a persistent side panel)
 *   showDetailsBtn     — whether to show the details button (Info)
 *   detailsCollapsed   — xl+ collapse state of the details side panel
 *   onToggleDetailsPanel — xl+ toggle (PanelRightClose/Open)
 */
export default function ThreadHeaderBar({
  ticket,
  ticketType,
  sourceKey,
  onOpenDetails,
  showDetailsBtn = true,
  detailsCollapsed = false,
  onToggleDetailsPanel,
}) {
  const followUpActive = !!ticket.follow_up?.enabled;

  // Row 2 pills — all rendered inline. The container is horizontally
  // scrollable on narrow screens so nothing gets cut off. A "More" popover
  // duplicates the follow-up start controls when a sequence isn't active,
  // and gives a consistent overflow home for future action pills.
  return (
    <div className="flex flex-col gap-1.5 min-w-0 w-full">
      {/* ── Row 1: identity ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-800 truncate">
            {displayName(ticket)}
          </span>
          {ticket.app_number && (
            <span className="text-[10px] text-gray-500 shrink-0">
              #{ticket.app_number}
            </span>
          )}
        </div>

        {/* Status dropdown — primary identity control */}
        <div className="shrink-0">
          <InboxStatusDropdown ticket={ticket} sourceKey={sourceKey} />
        </div>

        {/* Details toggle — right-aligned. On < xl this opens the drawer;
            on xl+ it collapses/expands the persistent details side panel. */}
        {onToggleDetailsPanel && (
          <button
            type="button"
            onClick={onToggleDetailsPanel}
            title={detailsCollapsed ? "Show details panel" : "Hide details panel"}
            className="hidden xl:inline-flex shrink-0 items-center justify-center h-7 w-7 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {detailsCollapsed ? (
              <PanelRightOpen className="w-3.5 h-3.5" />
            ) : (
              <PanelRightClose className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        {showDetailsBtn && (
          <button
            type="button"
            onClick={onOpenDetails}
            title="Show details"
            className="xl:hidden shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Row 2: contextual action pills ──────────────────────────────── */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto hide-scrollbar">
        {/* Franchise: Cal booking pill, Join meeting, FDD countdown */}
        {sourceKey === "franchise" && (
          <FranchiseMeetingPills ticket={ticket} compact />
        )}

        {/* Submitter's Cal.com bookings history — icon-only on every source */}
        {ticket.email && (
          <div className="shrink-0">
            <SubmitterCalBookingsPopover email={ticket.email} compact />
          </div>
        )}

        {/* Follow-up bot — active pill inline; when inactive, hidden here and
            surfaced in the More menu below to avoid cluttering the strip. */}
        {followUpActive && (
          <div className="shrink-0">
            <FollowUpControl ticket={ticket} ticketType={ticketType} iconOnly />
          </div>
        )}

        {/* "More" — overflow home. Right now hosts the follow-up start
            controls (only when no sequence is running) but designed to
            absorb any future secondary pill without breaking the row. */}
        {!followUpActive && (
          <div className="shrink-0 ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="More options"
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2 space-y-2">
                <div>
                  <div className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-1 px-1">
                    Auto Follow-up
                  </div>
                  <FollowUpControl ticket={ticket} ticketType={ticketType} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}