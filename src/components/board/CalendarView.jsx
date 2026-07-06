import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, startOfDay
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Video } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Default status → hex map. Covers every status across all boards (franchise,
// instructor, influencer, frontadmin). Falls back to slate for unknowns.
const STATUS_HEX = {
  new: "#9ca3af",
  pending: "#9ca3af",
  scheduled: "#f97316",
  discussion: "#a855f7",
  contacted: "#a855f7",
  reviewed: "#3b82f6",
  qualified: "#ec4899",
  site_selection: "#0ea5e9",
  lease: "#0ea5e9",
  build_out: "#14b8a6",
  training: "#10b981",
  approved: "#10b981",
  invited: "#10b981",
  closed: "#64748b",
  ghosted: "#737373",
  declined: "#f43f5e",
};
const colorFor = (status) => STATUS_HEX[String(status || "").toLowerCase()] || "#94a3b8";

export default function CalendarView({ tickets = [], onTicketClick, accentColor = "#f1889b" }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // "submissions" plots by created_date; "meetings" plots by Cal.com booking start.
  const [mode, setMode] = useState("meetings");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = startOfDay(new Date());

  // In "meetings" mode we need the full booking history (upcoming + past), not
  // just the upcoming map that the board's shared query provides. Fetch it
  // separately here so the calendar can plot every meeting on its real date.
  const { data: bookingsList = [] } = useQuery({
    queryKey: ["cal-bookings-all"],
    queryFn: async () => {
      const resp = await base44.functions.invoke("getCalBookings", { range: "all" });
      return resp?.data?.bookingsList || [];
    },
    enabled: mode === "meetings",
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Index tickets by lowercased email so we can pair a booking to its ticket.
  const ticketByEmail = useMemo(() => {
    const map = {};
    (tickets || []).forEach((t) => {
      const key = (t.email || "").toLowerCase().trim();
      if (key && !map[key]) map[key] = t;
    });
    return map;
  }, [tickets]);

  // Group entries by YYYY-MM-DD.
  //  - Submissions mode: one entry per ticket at its created_date.
  //  - Meetings mode: one entry per Cal booking at its start (may include past),
  //    paired with the matching ticket by attendee email when available.
  const ticketsByDay = useMemo(() => {
    const map = {};
    if (mode === "meetings") {
      (bookingsList || []).forEach((b) => {
        if (!b?.start) return;
        const email = (b.emails || []).find((e) => ticketByEmail[e]);
        const ticket = email ? ticketByEmail[email] : null;
        const key = format(new Date(b.start), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push({
          id: `${b.bookingId || b.uid || key}_${email || "unknown"}`,
          _booking: b,
          _display_name: ticket?._display_name || email || b.title || "Meeting",
          email: email || (b.emails || [])[0] || "",
          status: ticket?.status,
          _ticket: ticket,
        });
      });
    } else {
      (tickets || []).forEach((t) => {
        if (!t.created_date) return;
        const key = format(new Date(t.created_date), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
    }
    return map;
  }, [tickets, mode, bookingsList, ticketByEmail]);

  // Build a deduped status legend from what's actually visible this month.
  const visibleStatuses = useMemo(() => {
    const seen = new Set();
    days.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      (ticketsByDay[key] || []).forEach((t) => seen.add(t.status));
    });
    return Array.from(seen).filter(Boolean);
  }, [days, ticketsByDay]);

  return (
    <div className="flex-1 lg:min-h-0 mt-2 overflow-auto pb-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.65)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Month nav */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(247,177,189,0.3)", background: "rgba(251,224,226,0.2)" }}
        >
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-pink-100/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: "#b67651" }} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs rounded-full px-3 py-1 font-medium"
              style={{ color: accentColor, border: `1px solid ${accentColor}`, background: "rgba(251,224,226,0.4)" }}
            >
              Today
            </button>
            <h3 className="text-sm font-bold w-36 text-center" style={{ color: "#7a4a3a" }}>
              {format(currentMonth, "MMMM yyyy")}
            </h3>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-pink-100/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" style={{ color: "#b67651" }} />
          </button>
        </div>

        {/* Mode toggle: Submissions vs Cal Meetings */}
        <div
          className="flex items-center justify-center gap-1 px-5 py-2"
          style={{ borderBottom: "1px solid rgba(247,177,189,0.2)", background: "rgba(251,224,226,0.1)" }}
        >
          <div
            className="inline-flex items-center gap-1 p-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(247,177,189,0.3)" }}
          >
            <button
              onClick={() => setMode("submissions")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={
                mode === "submissions"
                  ? { background: accentColor, color: "white" }
                  : { color: "#7a4a3a" }
              }
            >
              <Calendar className="w-3 h-3" />
              Submissions
            </button>
            <button
              onClick={() => setMode("meetings")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={
                mode === "meetings"
                  ? { background: accentColor, color: "white" }
                  : { color: "#7a4a3a" }
              }
            >
              <Video className="w-3 h-3" />
              Cal Meetings
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: "1px solid rgba(247,177,189,0.25)" }}>
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold py-2 uppercase tracking-widest"
              style={{ color: "#c48a96" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTickets = ticketsByDay[key] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isPast = startOfDay(day) < today;

            return (
              <div
                key={idx}
                className="min-h-[64px] sm:min-h-[110px] p-1 sm:p-2 transition-colors"
                style={{
                  borderRight: "1px solid rgba(247,177,189,0.2)",
                  borderBottom: "1px solid rgba(247,177,189,0.2)",
                  opacity: isCurrentMonth ? 1 : 0.35,
                  background: isToday
                    ? "rgba(241,136,155,0.06)"
                    : isPast
                    ? "rgba(245,240,242,0.3)"
                    : "transparent",
                }}
              >
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] sm:text-xs font-bold mb-1"
                  style={
                    isToday
                      ? { background: accentColor, color: "white" }
                      : { color: isCurrentMonth ? "#6b4e4e" : "#d4b8bb" }
                  }
                >
                  {format(day, "d")}
                </div>

                {/* Mobile: dots-only grid (max 8 with +N overflow). */}
                <div className="sm:hidden flex flex-wrap gap-1 pl-0.5">
                  {dayTickets.slice(0, 8).map((t) => {
                    const color = colorFor(t.status);
                    const meetingTime =
                      mode === "meetings" && t._booking?.start
                        ? format(new Date(t._booking.start), "h:mma").toLowerCase()
                        : null;
                    return (
                      <button
                        key={t.id}
                        onClick={() => t._ticket ? onTicketClick?.(t._ticket) : onTicketClick?.(t)}
                        title={`${t._display_name || t.email || "Application"}${meetingTime ? ` · ${meetingTime}` : ""}`}
                        className="w-2 h-2 rounded-full transition-opacity hover:opacity-70"
                        style={{ background: color }}
                        aria-label={t._display_name || t.email || "Application"}
                      />
                    );
                  })}
                  {dayTickets.length > 8 && (
                    <span
                      className="text-[9px] font-semibold leading-none"
                      style={{ color: "#c48a96" }}
                    >
                      +{dayTickets.length - 8}
                    </span>
                  )}
                </div>

                {/* Tablet + desktop: labelled rows with time. */}
                <div className="hidden sm:block space-y-0.5">
                  {dayTickets.slice(0, 3).map((t) => {
                    const color = colorFor(t.status);
                    const meetingTime =
                      mode === "meetings" && t._booking?.start
                        ? format(new Date(t._booking.start), "h:mma").toLowerCase()
                        : null;
                    return (
                      <button
                        key={t.id}
                        onClick={() => t._ticket ? onTicketClick?.(t._ticket) : onTicketClick?.(t)}
                        title={`${t._display_name || t.email || "Application"} · ${t.status || ""}${meetingTime ? ` · ${meetingTime}` : ""}`}
                        className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left transition-opacity hover:opacity-80"
                        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        {meetingTime && (
                          <span
                            className="font-semibold flex-shrink-0"
                            style={{ color, fontSize: "9px" }}
                          >
                            {meetingTime}
                          </span>
                        )}
                        <span
                          className="text-xs truncate font-medium"
                          style={{ color: "#6b4e4e", fontSize: "10px" }}
                        >
                          {t._display_name || t.email || "Application"}
                        </span>
                      </button>
                    );
                  })}
                  {dayTickets.length > 3 && (
                    <p className="text-xs pl-1" style={{ color: "#c48a96", fontSize: "10px" }}>
                      +{dayTickets.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend — only statuses actually visible this month */}
        {visibleStatuses.length > 0 && (
          <div
            className="px-5 py-3 flex flex-wrap gap-3 justify-end"
            style={{ borderTop: "1px solid rgba(247,177,189,0.15)", background: "rgba(251,224,226,0.05)" }}
          >
            {visibleStatuses.map((status) => (
              <div
                key={status}
                className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: colorFor(status) }}
                />
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: "#7a5555" }}
                >
                  {String(status).replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}