import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Clock, Loader2, CheckCircle2 } from "lucide-react";

const TZ = "America/Toronto";

function formatDayLabel(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ }),
    iso: dateStr,
  };
}

function formatTimeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

export default function BookCallPopover({ ticket, onBooked }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke("getCalAvailability", { timeZone: TZ });
        if (cancelled) return;
        setSlotsByDay(res?.data?.slots || {});
      } catch (e) {
        if (!cancelled) setError("Couldn't load availability.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const days = useMemo(() => {
    return Object.keys(slotsByDay)
      .filter((d) => Array.isArray(slotsByDay[d]) && slotsByDay[d].length > 0)
      .sort()
      .slice(0, 5)
      .map(formatDayLabel);
  }, [slotsByDay]);

  const times = useMemo(() => {
    if (!selectedDay) return [];
    return (slotsByDay[selectedDay] || []).slice(0, 10);
  }, [selectedDay, slotsByDay]);

  const handleConfirm = async () => {
    if (!selectedDay || !selectedSlot) return;
    setBooking(true);
    try {
      const day = days.find((d) => d.iso === selectedDay);
      const friendly = `${day?.label}, ${day?.date} at ${formatTimeLabel(selectedSlot.start)}`;
      const name =
        ticket?.full_name ||
        `${ticket?.first_name || ""} ${ticket?.last_name || ""}`.trim() ||
        ticket?.email;

      const res = await base44.functions.invoke("bookCalEvent", {
        start: selectedSlot.start,
        timeZone: TZ,
        name,
        email: ticket?.email,
        phone: ticket?.phone || "",
        notes: `Booked by staff from admin board (ticket ${ticket?.id || ""})`,
        inquiryId: ticket?.id,
      });

      const booking = res?.data?.booking || {};
      // Try to surface a public meeting/booking link
      const meetingUrl =
        booking?.meetingUrl ||
        booking?.location ||
        booking?.references?.[0]?.meetingUrl ||
        (booking?.uid ? `https://app.cal.com/booking/${booking.uid}` : "");

      onBooked?.({ friendly, start: selectedSlot.start, meetingUrl });
      setOpen(false);
      setSelectedDay(null);
      setSelectedSlot(null);
    } catch (e) {
      console.error(e);
      alert("Couldn't book that slot — it may have just been taken. Please pick another time.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-pink-700 border-pink-200 hover:bg-pink-50"
        >
          <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
          Book Discovery Call
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold text-slate-900">Book Discovery Call</h4>
          <p className="text-xs text-slate-500 mt-0.5">Live Cal.com availability · 30 min</p>
        </div>

        <div className="p-4 max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-pink-500 animate-spin mb-2" />
              <p className="text-xs text-slate-500">Loading availability...</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : days.length === 0 ? (
            <p className="text-sm text-slate-500">No availability in the next two weeks.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700">Select a day</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {days.map((d) => (
                    <button
                      key={d.iso}
                      onClick={() => { setSelectedDay(d.iso); setSelectedSlot(null); }}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedDay === d.iso
                          ? "border-pink-400 bg-pink-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-medium">{d.label}</div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">{d.date}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700">Select a time</span>
                </div>
                {selectedDay ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {times.map((slot) => {
                      const label = formatTimeLabel(slot.start);
                      const isSelected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? "border-pink-400 bg-pink-50 text-pink-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Pick a day to see times.</p>
                )}
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!selectedDay || !selectedSlot || booking}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                size="sm"
              >
                {booking ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Booking...</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Book & Insert Into Email</>
                )}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}