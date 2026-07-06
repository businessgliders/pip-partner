import React from "react";
import { Info, MoreHorizontal } from "lucide-react";
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
 * ThreadHeaderBar — a single, consistent header used above the email thread
 * across every viewport (mobile / tablet / desktop). The primary row shows
 * only the essentials (name + ticket #, status dropdown, a "Details" button,
 * and the follow-up bot pill when active). All other actions (Cal.com bookings,
 * meeting pills, FDD timer, follow-up start controls) live inside a "More"
 * popover so the header never spills into a giant multi-line block.
 *
 * Props:
 *   ticket          — the selected submission
 *   ticketType      — entity name for follow-up mutations
 *   sourceKey       — inbox source (franchise/instructor/frontadmin/influencer)
 *   onOpenDetails   — called when the user taps the "Details" button
 *                     (rendered on < xl only; xl+ shows the side panel)
 *   showDetailsBtn  — whether to show the Details button (false on xl+)
 */
export default function ThreadHeaderBar({
  ticket,
  ticketType,
  sourceKey,
  onOpenDetails,
  showDetailsBtn = true,
}) {
  const followUpActive = !!ticket.follow_up?.enabled;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Name + ticket number — always visible, truncated */}
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

      {/* Status dropdown — primary action, always visible */}
      <div className="shrink-0">
        <InboxStatusDropdown ticket={ticket} sourceKey={sourceKey} />
      </div>

      {/* Follow-up bot pill — only when a sequence is running. Icon-only so it
          slots into the primary row without stealing space. Click opens the
          full manage popover (start-now / reschedule / stop / history). */}
      {followUpActive && (
        <div className="shrink-0">
          <FollowUpControl ticket={ticket} ticketType={ticketType} iconOnly />
        </div>
      )}

      {/* "More" — everything secondary lives here, consistent across viewports. */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="More options"
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2 space-y-2">
          {/* Cal.com bookings — history popover for this email */}
          {ticket.email && (
            <div>
              <div className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-1 px-1">
                Bookings
              </div>
              <SubmitterCalBookingsPopover email={ticket.email} compact />
            </div>
          )}

          {/* Franchise-only — upcoming meeting pills + FDD timer */}
          {sourceKey === "franchise" && (
            <div>
              <div className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-1 px-1">
                Meetings
              </div>
              <div className="flex flex-wrap gap-1">
                <FranchiseMeetingPills ticket={ticket} compact />
              </div>
            </div>
          )}

          {/* Follow-up — start controls when not active; when active the icon
              lives in the primary row so we skip it here to avoid duplication. */}
          {!followUpActive && (
            <div>
              <div className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-1 px-1">
                Auto Follow-up
              </div>
              <FollowUpControl ticket={ticket} ticketType={ticketType} />
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Details drawer trigger — < xl only. xl+ uses the persistent side
          panel; keeping this button off there avoids a redundant control. */}
      {showDetailsBtn && (
        <button
          type="button"
          onClick={onOpenDetails}
          title="Show details"
          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}