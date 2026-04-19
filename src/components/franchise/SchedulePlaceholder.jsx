import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

// Placeholder scheduler — Calendly-style picker to be built next
const DAYS = [
  { label: "Mon", date: "Apr 22" },
  { label: "Tue", date: "Apr 23" },
  { label: "Wed", date: "Apr 24" },
  { label: "Thu", date: "Apr 25" },
  { label: "Fri", date: "Apr 26" },
];
const TIMES = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

export default function SchedulePlaceholder({ onConfirm, isSubmitting }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const canConfirm = selectedDay && selectedTime;

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

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#b67651]" />
            <Label>Select a day</Label>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {DAYS.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDay(d.date)}
                className="p-3 rounded-xl border transition-all text-center"
                style={{
                  borderColor: selectedDay === d.date ? "#f1889b" : "rgba(247,177,189,0.4)",
                  background: selectedDay === d.date ? "#fbe0e2" : "rgba(255,255,255,0.5)",
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
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {TIMES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                disabled={!selectedDay}
                className="p-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: selectedTime === t ? "#f1889b" : "rgba(247,177,189,0.4)",
                  background: selectedTime === t ? "#fbe0e2" : "rgba(255,255,255,0.5)",
                  color: "#b67651",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => onConfirm(`${selectedDay} at ${selectedTime}`)}
          disabled={!canConfirm || isSubmitting}
          className="w-full h-14 rounded-xl text-white font-medium text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
        >
          {isSubmitting ? "Confirming..." : "Finish & Confirm Call"}
        </Button>
      </div>
    </motion.div>
  );
}

function Label({ children }) {
  return <span className="text-[#b67651] font-medium text-sm">{children}</span>;
}