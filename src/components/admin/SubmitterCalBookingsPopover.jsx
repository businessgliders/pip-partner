import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExternalLink, CalendarClock, Video, Loader2 } from "lucide-react";

const CAL_LOGO = "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/56863071a_images-1.png";

function formatWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso || "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });
}

export default function SubmitterCalBookingsPopover({ email, compact = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.functions.invoke("getCalBookingsByEmail", { email });
      const list = resp?.data?.bookings || [];
      setBookings(list);
    } catch (e) {
      setError(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) fetchBookings();
  };

  const now = Date.now();
  const upcoming = (bookings || []).filter((b) => new Date(b.start).getTime() >= now);
  const past = (bookings || []).filter((b) => new Date(b.start).getTime() < now);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Check Cal.com bookings for this submitter"
          className={
            compact
              ? "inline-flex items-center justify-center h-6 w-6 rounded-full border border-slate-200 hover:bg-slate-50"
              : "inline-flex items-center gap-1.5 lg:px-2.5 px-2 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs text-slate-700"
          }
        >
          <img src={CAL_LOGO} alt="Cal.com" className="w-4 h-4 rounded-sm" />
          {!compact && <span className="hidden lg:inline">Cal.com bookings</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="px-2 pt-1 pb-2 border-b border-slate-100">
          <p className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
            Cal.com bookings
          </p>
          <p className="text-xs text-slate-600 truncate" title={email}>{email}</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 px-2 py-4 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Cal.com...
          </div>
        )}

        {!loading && error && (
          <div className="px-2 py-3 text-xs text-red-600">{error}</div>
        )}

        {!loading && !error && bookings && bookings.length === 0 && (
          <div className="px-2 py-4 text-xs text-slate-500">
            No bookings found for this email on Cal.com.
          </div>
        )}

        {!loading && !error && bookings && bookings.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {upcoming.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] tracking-wider uppercase text-emerald-700 font-semibold">
                  Upcoming
                </p>
                {upcoming.map((b) => (
                  <BookingRow key={b.uid || b.bookingId} b={b} />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] tracking-wider uppercase text-slate-500 font-semibold">
                  Past
                </p>
                {past.map((b) => (
                  <BookingRow key={b.uid || b.bookingId} b={b} past />
                ))}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function BookingRow({ b, past = false }) {
  const meetingUrl = /^https?:\/\//i.test(b.meetingUrl || "") ? b.meetingUrl : null;
  const calUrl = b.uid ? `https://cal.com/booking/${b.uid}` : null;
  const cancelled = String(b.status || "").toLowerCase() === "cancelled";

  return (
    <div className={`px-2 py-2 rounded-md hover:bg-slate-50 ${past ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-800 truncate">
            {b.title || "Cal.com booking"}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <CalendarClock className="w-3 h-3" /> {formatWhen(b.start)}
          </p>
          {cancelled && (
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              Cancelled
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {meetingUrl && (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Join meeting"
              className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-200 text-blue-700"
            >
              <Video className="w-3.5 h-3.5" />
            </a>
          )}
          {calUrl && (
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Cal.com"
              className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-200 text-slate-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}