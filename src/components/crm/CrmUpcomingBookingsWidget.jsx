import React from "react";
import { format } from "date-fns";
import { CalendarDays, Video } from "lucide-react";
import { CRM } from "./crmTheme";

// Calendar-style tiles for upcoming Cal.com bookings on the dashboard.
export default function CrmUpcomingBookingsWidget({ bookings, onNavigate }) {
  const now = Date.now();
  const upcoming = (bookings || [])
    .filter((b) => b?.start && new Date(b.start).getTime() >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 6);

  return (
    <div className="crm-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fdf3d8" }}>
            <CalendarDays className="w-3.5 h-3.5" style={{ color: "#b8860b" }} />
          </span>
          <span className="text-[14px] font-semibold" style={{ color: CRM.ink }}>
            Upcoming bookings
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("bookings")}
          className="text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ background: CRM.blush, color: "#a34a5c" }}
        >
          View calendar
        </button>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-[12px] py-3" style={{ color: CRM.sub }}>No upcoming meetings scheduled.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {upcoming.map((b, i) => {
            const d = new Date(b.start);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate("bookings")}
                className="flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[#fdf8f4] transition-colors"
                style={{ border: "1px solid rgba(182,118,81,0.12)" }}
              >
                {/* Calendar-page date block */}
                <span
                  className="w-11 shrink-0 rounded-lg overflow-hidden text-center shadow-sm"
                  style={{ border: "1px solid rgba(182,118,81,0.15)" }}
                >
                  <span
                    className="block text-[9px] font-bold uppercase tracking-wider py-0.5"
                    style={{ background: CRM.accent, color: "white" }}
                  >
                    {format(d, "MMM")}
                  </span>
                  <span className="block text-[17px] font-bold leading-tight py-0.5 bg-white" style={{ color: CRM.ink }}>
                    {format(d, "d")}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[12px] font-semibold truncate" style={{ color: CRM.ink }}>
                    <Video className="w-3 h-3 shrink-0" style={{ color: CRM.accent }} />
                    <span className="truncate">{b.title || (b.emails || [])[0] || "Meeting"}</span>
                  </span>
                  <span className="block text-[11px]" style={{ color: CRM.sub }}>
                    {format(d, "EEE")} · {format(d, "h:mma").toLowerCase()}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}