import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TZ = "America/Toronto";

function formatDayLabel(dateStr) {
  // dateStr = "YYYY-MM-DD"
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

export default function SchedulePlaceholder({ onConfirm, isSubmitting, inquiryId }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke("getCalAvailability", { timeZone: TZ, inquiryId });
        if (cancelled) return;
        const slots = res?.data?.slots || {};
        setSlotsByDay(slots);
      } catch (e) {
        if (!cancelled) setError("Couldn't load availability. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [inquiryId]);

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

  const canConfirm = selectedDay && selectedSlot;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const day = days.find((d) => d.iso === selectedDay);
    const friendly = `${day?.label}, ${day?.date} at ${formatTimeLabel(selectedSlot.start)}`;
    onConfirm({ start: selectedSlot.start, friendly, timeZone: TZ });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbe0e2]/60 mb-4">
          <CheckCircle2 className="w-4 h-4 text-[#b67651]" />
          <span className="text-xs font-medium tracking-[0.15em] text-[#b67651]">
            APPLICATION RECEIVED
          </span>
        </div>
        <h3 className="text-2xl md:text-3xl font-light text-[#b67651] mb-2">
          Let's book your discovery call
        </h3>
        <p className="text-[#b67651]/70 text-sm">
          30 minutes · Virtual · With our Franchise Team
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#b67651] animate-spin mb-3" />
          <p className="text-[#b67651]/70 text-sm">Loading availability...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-[#b67651] mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-8 text-[#b67651]/70">
          No availability in the next two weeks. Please email us at <a href="mailto:franchise@pilatesinpinkstudio.com" className="underline">franchise@pilatesinpinkstudio.com</a>.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#b67651]" />
              <Label>Select a day</Label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {days.map((d) => (
                <button
                  key={d.iso}
                  onClick={() => { setSelectedDay(d.iso); setSelectedSlot(null); }}
                  className="p-3 rounded-xl border transition-all text-center"
                  style={{
                    borderColor: selectedDay === d.iso ? "#f1889b" : "rgba(247,177,189,0.4)",
                    background: selectedDay === d.iso ? "#fbe0e2" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <div className="text-xs text-[#b67651]/70 font-medium">{d.label}</div>
                  <div className="text-sm font-medium text-[#b67651] mt-0.5">{d.date}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#b67651]" />
              <Label>Select a time</Label>
            </div>
            {selectedDay ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {times.map((slot) => {
                  const label = formatTimeLabel(slot.start);
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className="p-3 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        borderColor: isSelected ? "#f1889b" : "rgba(247,177,189,0.4)",
                        background: isSelected ? "#fbe0e2" : "rgba(255,255,255,0.5)",
                        color: "#b67651",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#b67651]/60 italic">Pick a day to see available times.</p>
            )}
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="w-full h-14 rounded-xl text-white font-medium text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
          >
            {isSubmitting ? "Confirming..." : "Finish & Confirm Call"}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function Label({ children }) {
  return <span className="text-[#b67651] font-medium text-sm">{children}</span>;
}