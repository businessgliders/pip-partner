import React from "react";
import { format } from "date-fns";
import { Video, ExternalLink } from "lucide-react";
import { displayName } from "@/components/board/boardConfig";
import { CRM, dotFor } from "./crmTheme";

// One upcoming meeting. Title owns its own full-width line so long names are
// never clipped on narrow screens; time/badges sit on a secondary line.
export default function UpcomingMeetingRow({ booking, showGroup, onOpen }) {
  const b = booking;
  const name = b._ticket ? displayName(b._ticket) : b.title || (b.emails || [])[0] || "Meeting";
  const pending = String(b.status || "").toLowerCase() === "pending";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-[#fdf8f4] transition-colors"
      style={{ border: "1px solid rgba(182,118,81,0.10)" }}
    >
      <div className="flex items-start gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: b._ticket ? dotFor(b._ticket.status) : CRM.accent }}
        />
        <span className="flex-1 min-w-0 text-[13px] font-semibold leading-snug break-words" style={{ color: CRM.ink }}>
          {name}
        </span>
        {(b.uid || b.meetingUrl) && (
          <span
            role="button"
            tabIndex={0}
            title="Open in Cal.com"
            onClick={(e) => {
              e.stopPropagation();
              window.open(b.uid ? `https://app.cal.com/booking/${b.uid}` : b.meetingUrl, "_blank", "noopener");
            }}
            className="p-1 -m-1 rounded-md shrink-0 hover:bg-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" style={{ color: CRM.brown }} />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-1.5 pl-4">
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: CRM.brown }}>
          <Video className="w-3 h-3" style={{ color: CRM.accent }} />
          {format(new Date(b.start), "h:mma").toLowerCase()}
        </span>
        {showGroup && (
          <span
            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
            style={
              b._group === "franchise"
                ? { background: CRM.blush, color: "var(--tile-pink-fg)" }
                : { background: "var(--crm-page-bg)", color: CRM.sub }
            }
          >
            {b._group === "franchise" ? "Franchise" : "Hiring"}
          </span>
        )}
        {pending && (
          <span
            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
            style={{ background: "#2e9e5b", color: "#fff" }}
          >
            Needs confirmation
          </span>
        )}
      </div>
    </button>
  );
}