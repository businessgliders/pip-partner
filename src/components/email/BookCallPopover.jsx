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

const CAL_EVENT_LINKS = {
  franchise: "https://cal.com/pilatesinpink/franchise",
  hiring: "https://cal.com/pilatesinpink/hiring",
};

// Franchise sub-types — kept in sync with the backend whitelist in
// getCalAvailability / bookCalEvent. Defaults to Discovery on open.
const FRANCHISE_EVENT_TYPES = [
  { id: "5595622", label: "[Part 1] Discovery" },
  { id: "6052661", label: "[Part 2] Prospectus" },
];

export default function BookCallPopover({ onSelect, onAddLink, isMobileFullscreen, boardKey = 'hiring' }) {
   const [open, setOpen] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [slotsByDay, setSlotsByDay] = useState({});
   const [selectedDay, setSelectedDay] = useState(null);
   const [selectedSlot, setSelectedSlot] = useState(null);
   // Franchise-only: which Cal.com event type the staff is booking (defaults
   // to the first one — Discovery — but is switchable inside the popover).
   const [franchiseEventTypeId, setFranchiseEventTypeId] = useState(
     FRANCHISE_EVENT_TYPES[0].id
   );

   useEffect(() => {
     if (!open) return;
     let cancelled = false;
     (async () => {
       setLoading(true);
       setError(null);
       // Reset slot selection whenever a new fetch starts so a stale selection
       // from a previous event-type can't accidentally be confirmed.
       setSelectedDay(null);
       setSelectedSlot(null);
       try {
         const payload = { timeZone: TZ, boardKey };
         if (boardKey === 'franchise') payload.eventTypeId = franchiseEventTypeId;
         const res = await base44.functions.invoke("getCalAvailability", payload);
         if (cancelled) return;
         setSlotsByDay(res?.data?.slots || {});
       } catch (e) {
         console.error("getCalAvailability failed", e?.response?.data || e);
         if (!cancelled) setError(
           e?.response?.data?.error || e?.message || "Couldn't load availability."
         );
       } finally {
         if (!cancelled) setLoading(false);
       }
     })();
     return () => { cancelled = true; };
   }, [open, boardKey, franchiseEventTypeId]);

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

  const handleConfirm = () => {
    if (!selectedDay || !selectedSlot) return;
    const day = days.find((d) => d.iso === selectedDay);
    const friendly = `${day?.label}, ${day?.date} at ${formatTimeLabel(selectedSlot.start)}`;
    onSelect?.({
      start: selectedSlot.start,
      timeZone: TZ,
      friendly,
      // Only relevant for franchise — hiring ignores this server-side.
      eventTypeId: boardKey === 'franchise' ? franchiseEventTypeId : undefined,
    });
    setOpen(false);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
         <Button
           size="sm"
           variant="outline"
           className={`text-slate-700 border-slate-200 hover:bg-slate-50 ${isMobileFullscreen ? "p-1.5" : ""}`}
           title="Book a meeting"
         >
           <CalendarDays className={`w-3.5 h-3.5 ${isMobileFullscreen ? "" : "mr-1.5"}`} />
           <span className={isMobileFullscreen ? "hidden" : ""}>Meeting</span>
         </Button>
       </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Meeting</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pick a slot — it will be reserved only when you send the email.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const url = CAL_EVENT_LINKS[boardKey] || CAL_EVENT_LINKS.hiring;
                onAddLink?.({ url, label: "Book a meeting using this link" });
                setOpen(false);
              }}
              title="Insert Cal.com event-type link into the email"
              className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-[11px] text-slate-700"
            >
              <img
                src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/56863071a_images-1.png"
                alt="Cal.com"
                className="w-4 h-4 rounded-sm"
              />
              Add Link
            </button>
          </div>

          {boardKey === 'franchise' && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
              {FRANCHISE_EVENT_TYPES.map((t) => {
                const active = franchiseEventTypeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFranchiseEventTypeId(t.id)}
                    className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-md transition-colors ${
                      active
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
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
                disabled={!selectedDay || !selectedSlot}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                size="sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Add to Email
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}