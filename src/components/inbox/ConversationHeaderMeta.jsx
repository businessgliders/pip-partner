import React from "react";
import { MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ExternalLink,
  CalendarClock,
  XCircle,
} from "lucide-react";
import FddCountdownPill from "@/components/board/FddCountdownPill";

/**
 * Compact, read-only meta row shown under the client name in the inbox
 * conversation panel. Mirrors the franchise board card layout:
 *
 *   Row A:  #1234  ·  📅 Mon, Jun 16 9:00 AM  ·  FDD: 12d 4h
 *   Row B:  📍 Toronto · ON · M5V 2T6
 *
 * Non-franchise sources only render Row A (ticket #) + Row B (location for
 * instructor/frontadmin/influencer).
 */
export default function ConversationHeaderMeta({ ticket, sourceKey }) {
  if (!ticket) return null;

  // Cal.com booking pill (franchise only)
  const startIso = ticket?._cal_booking?.start || ticket?.scheduled_call_time;
  const uid = ticket?._cal_booking?.uid || ticket?._cal_booking?.bookingId;
  const d = startIso ? new Date(startIso) : null;
  const calLabel =
    d && !isNaN(d.getTime())
      ? d.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Toronto",
        })
      : null;

  // Location (per board)
  let location = null;
  if (sourceKey === "franchise") {
    location = [
      ticket.preferred_location,
      ticket.province,
      ticket.preferred_postal_code,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (sourceKey === "instructor" || sourceKey === "frontadmin") {
    location = [ticket.preferred_studio, ticket.province, ticket.postal_code]
      .filter(Boolean)
      .join(" · ");
  } else if (sourceKey === "influencer") {
    location = ticket.location || null;
  }

  return (
    <div className="flex flex-col gap-1 mt-0.5">
      {/* Row A: ticket # → 📅 cal.com → FDD */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ticket.app_number && (
          <span className="text-[10px] text-slate-500 shrink-0 font-medium">
            #{ticket.app_number}
          </span>
        )}

        {sourceKey === "franchise" && calLabel && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-200 transition whitespace-nowrap"
                title="Manage booking"
              >
                📅 <span>{calLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-1">
              {uid ? (
                <>
                  <a
                    href={`https://cal.com/booking/${uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    Open meeting in Cal.com
                  </a>
                  <a
                    href={`https://cal.com/reschedule/${uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-emerald-700" />
                    Reschedule on Cal.com
                  </a>
                  <a
                    href={`https://cal.com/booking/${uid}?cancel=true`}
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
                  No Cal.com booking linked.
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {sourceKey === "franchise" && (
          <FddCountdownPill ticket={ticket} />
        )}
      </div>

      {/* Row B: location */}
      {location && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}
    </div>
  );
}