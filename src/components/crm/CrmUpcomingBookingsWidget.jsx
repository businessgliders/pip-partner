import React, { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDays } from "lucide-react";
import UpcomingMeetingRow from "./UpcomingMeetingRow";
import { CRM } from "./crmTheme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "franchise", label: "Franchise" },
  { key: "hiring", label: "Hiring" },
];

// Calendar-schedule (agenda) view of upcoming Cal.com bookings on the dashboard.
export default function CrmUpcomingBookingsWidget({ bookings, ticketByEmail, onNavigate, embedded = false }) {
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
    <div className={embedded ? "p-4 pt-1" : "crm-card p-5"}>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className={embedded ? "hidden" : "flex items-center gap-2"}>
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
          {!embedded && (
            <button
              type="button"
              onClick={() => onNavigate("bookings")}
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: CRM.blush, color: "var(--tile-pink-fg)" }}
            >
              View calendar
            </button>
          )}
        </div>
      </div>

      {days.length === 0 ? (
        <p className="text-[12px] py-3" style={{ color: CRM.sub }}>No upcoming meetings scheduled.</p>
      ) : (
        <div className="space-y-4">
          {days.map((g, gi) => (
            <div key={gi}>
              {/* Compact day marker — the title rows below get the full width */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: CRM.accent, color: "#fff" }}
                >
                  {format(g.date, "MMM d")}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: CRM.sub }}>
                  {format(g.date, "EEEE")}
                </span>
                <span className="flex-1 h-px" style={{ background: "rgba(182,118,81,0.12)" }} />
              </div>
              <div className="space-y-1.5">
                {g.items.map((b, i) => (
                  <UpcomingMeetingRow
                    key={i}
                    booking={b}
                    showGroup={src === "all"}
                    onOpen={() => onNavigate("bookings")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}