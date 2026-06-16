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
 *   ┌ FDD timer ┐ ┌ 📅 Date ▾ ┐ ┌ Join meeting ┐ ┌ Resend ┐ ┌ Cal.com bookings ┐
 *
 * Used in:
 *   - Inbox details panel (full width labels, `compact` = false)
 *   - Inbox conversation header on mobile/tablet (icon-only, `compact` = true)
 *
 * Pass `ticket` (a FranchiseInquiry row, optionally with `_cal_booking`).
 * If the ticket isn't franchise-shaped this component renders nothing.
 */
export default function FranchiseMeetingPills({ ticket, compact = false }) {
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* FDD timer */}
      <FddCountdownBadge ticketId={ticket.id} ticket={ticket} />

      {/* Cal.com booking pill — only when there's a known booking */}
      {label && (
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
      {meetingUrl && (
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

      {/* Resend booking emails — non-compact only (keeps mobile header clean) */}
      {!compact && (
        <ResendBookingEmailsButton
          inquiryId={ticket.id}
          scheduledTime={ticket.scheduled_call_time}
          recipientEmail={ticket.email}
        />
      )}

      {/* Cal.com bookings popover — non-compact only */}
      {!compact && ticket.email && (
        <SubmitterCalBookingsPopover email={ticket.email} />
      )}
    </div>
  );
}