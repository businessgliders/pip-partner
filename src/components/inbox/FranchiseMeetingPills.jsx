import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ExternalLink, CalendarClock, XCircle, Video } from "lucide-react";
import FddCountdownBadge from "@/components/admin/FddCountdownBadge";
import SubmitterCalBookingsPopover from "@/components/admin/SubmitterCalBookingsPopover";
import ResendBookingEmailsButton from "@/components/admin/ResendBookingEmailsButton";

/**
 * Renders the franchise meeting / FDD action pills cluster.
 *
 * `section` controls which group of pills to render:
 *   - "all" (default): everything in one row — used in the mobile conversation
 *     header where horizontal space is tight.
 *   - "fdd": just the FDD countdown badge.
 *   - "cal": Cal.com booking, join meeting, and submitter Cal bookings popover.
 *     The "Resend booking emails" button is intentionally hidden in this mode
 *     so the panel stays focused on the day-to-day actions; staff can still
 *     resend from the SubmissionDetailModal.
 *
 * Pass `ticket` (a FranchiseInquiry row, optionally with `_cal_booking`).
 * If the ticket isn't franchise-shaped this component renders nothing.
 */
export default function FranchiseMeetingPills({
  ticket,
  compact = false,
  section = "all",
  // When true, suppresses pills that the compact email header would already
  // be rendering (Cal booking date pill, Join meeting, FDD badge) so the
  // details panel only surfaces options that aren't duplicated above.
  dedupeAgainstHeader = false,
}) {
  if (!ticket) return null;

  const startIso = ticket?._cal_booking?.start || ticket?.scheduled_call_time;
  const uid = ticket?._cal_booking?.uid || ticket?._cal_booking?.bookingId;
  const calBookingUrl = uid ? `https://cal.com/booking/${uid}` : null;
  const rescheduleUrl = uid ? `https://cal.com/reschedule/${uid}` : null;
  const cancelUrl = uid ? `https://cal.com/booking/${uid}?cancel=true` : null;
  const meetingUrlRaw = ticket?._cal_booking?.meetingUrl || "";
  const meetingUrl = /^https?:\/\//i.test(meetingUrlRaw) ? meetingUrlRaw : null;

  const d = startIso ? new Date(startIso) : null;
  const label =
    d && !isNaN(d.getTime())
      ? d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Toronto",
        })
      : null;

  // Header (compact) renders: FDD badge, Cal date pill (when `label`), Join
  // meeting (when `meetingUrl`). When dedupeAgainstHeader is set we treat
  // these as already-visible and skip them here — leaving only the items
  // that wouldn't otherwise be reachable (e.g. the submitter Cal bookings
  // history popover, or the Cal pill when there's no booking date yet).
  const headerShowsFdd = dedupeAgainstHeader;
  const headerShowsCalPill = dedupeAgainstHeader && !!label;
  const headerShowsJoin = dedupeAgainstHeader && !!meetingUrl;

  const showFdd = (section === "all" || section === "fdd") && !headerShowsFdd;
  const showCal = section === "all" || section === "cal";
  // Resend booking emails is only shown in the full "all" rendering (legacy
  // mobile header). The detail-panel split intentionally suppresses it.
  const showResend = section === "all" && !compact;
  const showCalBookings = showCal && !compact && ticket.email;
  const showCalPill = showCal && !headerShowsCalPill;
  const showJoin = showCal && !headerShowsJoin;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showFdd && <FddCountdownBadge ticketId={ticket.id} ticket={ticket} />}

      {/* Cal.com booking pill — only when there's a known booking */}
      {showCalPill && label && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-200 transition whitespace-nowrap"
              title="Manage booking"
            >
              📅 <span className={compact ? "hidden sm:inline" : ""}>{label}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            {uid ? (
              <>
                <a
                  href={calBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  Open meeting in Cal.com
                </a>
                <a
                  href={rescheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-emerald-700" />
                  Reschedule on Cal.com
                </a>
                <a
                  href={cancelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  Cancel booking
                </a>
              </>
            ) : (
              <div className="px-2.5 py-2 text-xs text-slate-500">
                No Cal.com booking linked.{" "}
                <a
                  href="https://app.cal.com/bookings/upcoming"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Open Cal.com
                </a>
                .
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Join meeting */}
      {showJoin && meetingUrl && (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Join meeting"
          className="inline-flex items-center justify-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-700 font-medium hover:bg-blue-200 transition"
        >
          <Video className="w-3 h-3" />
          {!compact && <span>Join meeting</span>}
        </a>
      )}

      {/* Resend booking emails — legacy "all" mode only */}
      {showResend && (
        <ResendBookingEmailsButton
          inquiryId={ticket.id}
          scheduledTime={ticket.scheduled_call_time}
          recipientEmail={ticket.email}
        />
      )}

      {/* Cal.com bookings popover (submitter's history) */}
      {showCalBookings && (
        <SubmitterCalBookingsPopover email={ticket.email} />
      )}
    </div>
  );
}