import React, { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDays, Video, ExternalLink } from "lucide-react";
import { displayName } from "@/components/board/boardConfig";
import { CRM, dotFor } from "./crmTheme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "franchise", label: "Franchise" },
  { key: "hiring", label: "Hiring" },
];

// Calendar-schedule (agenda) view of upcoming Cal.com bookings on the dashboard.
export default function CrmUpcomingBookingsWidget({ bookings, ticketByEmail, onNavigate }) {
  const [src, setSrc] = useState("all");

  const days = useMemo(() => {
    const now = Date.now();
    const upcoming = (bookings || [])
      .filter((b) => b?.start && new Date(b.start).getTime() >= now)
      .map((b) => {
        const email = (b.emails || []).find((e) => ticketByEmail[(e || "").toLowerCase()]);
        const ticket = email ? ticketByEmail[email.toLowerCase()] : null;
        // The Cal event type is the source of truth (franchise vs hiring);
        // fall back to the matched lead's board, unmatched stay under Franchise.
        const group = b.source
          ? b.source
          : !ticket || ticket._boardKey === "franchise"
            ? "franchise"
            : "hiring";
        return { ...b, _ticket: ticket, _group: group };
      })
      .filter((b) => src === "all" || b._group === src)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 10);

    // Group into day sections.
    const groups = [];
    upcoming.forEach((b) => {
      const d = new Date(b.start);
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.date, d)) last.items.push(b);
      else groups.push({ date: d, items: [b] });
    });
    return groups;
  }, [bookings, ticketByEmail, src]);

  return (
    <div className="crm-card p-5">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fdf3d8" }}>
            <CalendarDays className="w-3.5 h-3.5" style={{ color: "#b8860b" }} />
          </span>
          <span className="text-[14px] font-semibold" style={{ color: CRM.ink }}>
            Upcoming meetings
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-0.5 p-0.5 rounded-full"
            style={{ border: "1px solid rgba(182,118,81,0.15)" }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSrc(f.key)}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all"
                style={src === f.key ? { background: CRM.accentSoft, color: "var(--tile-rose-fg)" } : { color: CRM.sub }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("bookings")}
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ background: CRM.blush, color: "var(--tile-pink-fg)" }}
          >
            View calendar
          </button>
        </div>
      </div>

      {days.length === 0 ? (
        <p className="text-[12px] py-3" style={{ color: CRM.sub }}>No upcoming meetings scheduled.</p>
      ) : (
        <div className="space-y-4">
          {days.map((g, gi) => (
            <div key={gi} className="flex gap-4">
              {/* Calendar-page date block */}
              <div
                className="w-12 shrink-0 rounded-lg overflow-hidden text-center shadow-sm self-start"
                style={{ border: "1px solid rgba(182,118,81,0.15)" }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-wider py-0.5"
                  style={{ background: CRM.accent, color: "white" }}
                >
                  {format(g.date, "MMM")}
                </div>
                <div className="text-[18px] font-bold leading-tight py-0.5 bg-white" style={{ color: CRM.ink }}>
                  {format(g.date, "d")}
                </div>
                <div className="text-[9px] font-semibold pb-0.5 bg-white" style={{ color: CRM.sub }}>
                  {format(g.date, "EEE")}
                </div>
              </div>
              {/* Schedule rows for the day */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {g.items.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onNavigate("bookings")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#fdf8f4] transition-colors"
                    style={{ border: "1px solid rgba(182,118,81,0.10)" }}
                  >
                    <span className="text-[12px] font-semibold w-16 shrink-0" style={{ color: CRM.brown }}>
                      {format(new Date(b.start), "h:mma").toLowerCase()}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: b._ticket ? dotFor(b._ticket.status) : CRM.accent }}
                    />
                    <span className="flex-1 min-w-0 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: CRM.ink }}>
                      <Video className="w-3 h-3 shrink-0" style={{ color: CRM.accent }} />
                      <span className="line-clamp-2 sm:line-clamp-1 break-words">
                        {b._ticket ? displayName(b._ticket) : b.title || (b.emails || [])[0] || "Meeting"}
                      </span>
                    </span>
                    <span className="ml-auto flex items-center gap-1.5 shrink-0">
                      {src === "all" && (
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
                      {(b.uid || b.meetingUrl) && (
                        <span
                          role="button"
                          tabIndex={0}
                          title="Open in Cal.com"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(b.uid ? `https://app.cal.com/booking/${b.uid}` : b.meetingUrl, "_blank", "noopener");
                          }}
                          className="p-1 rounded-md hover:bg-white transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" style={{ color: CRM.brown }} />
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}