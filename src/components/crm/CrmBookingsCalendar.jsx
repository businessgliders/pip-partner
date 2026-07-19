import React, { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { displayName } from "@/components/board/boardConfig";
import { CRM } from "./crmTheme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BORDER = "1px solid rgba(182,118,81,0.10)";

// Colors keyed by lead type (not status). Unmatched bookings fall under Franchise.
const TYPE_COLORS = {
  franchise: "#e0637a",
  instructor: "#d97a4a",
  frontadmin: "#5e8b7e",
};
const TYPE_LEGEND = [
  { key: "franchise", label: "Franchise" },
  { key: "instructor", label: "Instructor" },
  { key: "frontadmin", label: "Front Desk" },
];
const typeColor = (b) => TYPE_COLORS[b._ticket?._boardKey] || TYPE_COLORS.franchise;

// Month-grid calendar of Cal.com bookings in the CRM design language.
export default function CrmBookingsCalendar({ bookings, ticketByEmail, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(currentMonth)),
  });
  const today = startOfDay(new Date());

  const byDay = useMemo(() => {
    const map = {};
    (bookings || []).forEach((b) => {
      if (!b?.start) return;
      const email = (b.emails || []).find((e) => ticketByEmail[e]) || (b.emails || [])[0] || "";
      const ticket = ticketByEmail[(email || "").toLowerCase()] || null;
      const key = format(new Date(b.start), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push({ ...b, _email: email, _ticket: ticket });
    });
    Object.values(map).forEach((list) => list.sort((a, b) => new Date(a.start) - new Date(b.start)));
    return map;
  }, [bookings, ticketByEmail]);

  return (
    <div className="crm-card overflow-hidden pb-0">
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: BORDER, background: "var(--crm-page-bg)" }}>
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-white"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: CRM.brown }} />
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="text-[11px] rounded-full px-3 py-1 font-semibold"
            style={{ background: CRM.accentSoft, color: "var(--tile-rose-fg)" }}
          >
            Today
          </button>
          <h3 className="text-[14px] font-semibold w-36 text-center" style={{ color: CRM.ink }}>
            {format(currentMonth, "MMMM yyyy")}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-white"
        >
          <ChevronRight className="w-4 h-4" style={{ color: CRM.brown }} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7" style={{ borderBottom: BORDER }}>
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold py-2 uppercase tracking-widest" style={{ color: CRM.sub }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = format(day, "yyyy-MM-dd");
          const dayBookings = byDay[key] || [];
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={idx}
              className="min-h-[64px] sm:min-h-[104px] p-1 sm:p-1.5"
              style={{
                borderRight: BORDER,
                borderBottom: BORDER,
                opacity: inMonth ? 1 : 0.35,
                background: isToday ? "rgba(241,136,155,0.05)" : "transparent",
              }}
            >
              <div
                className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-semibold mb-1"
                style={isToday ? { background: CRM.accent, color: "white" } : { color: inMonth ? CRM.ink : CRM.sub }}
              >
                {format(day, "d")}
              </div>

              {/* Mobile: dots */}
              <div className="sm:hidden flex flex-wrap gap-1 pl-0.5">
                {dayBookings.slice(0, 8).map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => b._ticket && onSelect(b._ticket)}
                    className="w-2 h-2 rounded-full"
                    style={{ background: typeColor(b) }}
                    aria-label={b._ticket ? displayName(b._ticket) : b.title || "Meeting"}
                  />
                ))}
              </div>

              {/* Tablet+: labelled chips */}
              <div className="hidden sm:block space-y-0.5">
                {dayBookings.slice(0, 3).map((b, i) => {
                  const color = typeColor(b);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => b._ticket && onSelect(b._ticket)}
                      title={`${b._ticket ? displayName(b._ticket) : b.title || "Meeting"} · ${format(new Date(b.start), "h:mma").toLowerCase()}`}
                      className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-left hover:opacity-80"
                      style={{ background: `${color}14`, border: `1px solid ${color}33` }}
                    >
                      <span className="font-semibold shrink-0" style={{ color, fontSize: "9px" }}>
                        {format(new Date(b.start), "h:mma").toLowerCase()}
                      </span>
                      <span className="truncate font-medium" style={{ color: CRM.ink, fontSize: "10px" }}>
                        {b._ticket ? displayName(b._ticket) : b.title || b._email || "Meeting"}
                      </span>
                    </button>
                  );
                })}
                {dayBookings.length > 3 && (
                  <p className="pl-1" style={{ color: CRM.sub, fontSize: "10px" }}>
                    +{dayBookings.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend — lead types */}
      <div className="px-5 py-3 flex flex-wrap gap-3 justify-end" style={{ background: "var(--crm-page-bg)" }}>
        {TYPE_LEGEND.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[key] }} />
            <span className="text-[11px] font-medium" style={{ color: CRM.sub }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}