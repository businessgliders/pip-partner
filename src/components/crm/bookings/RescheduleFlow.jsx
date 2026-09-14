import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { FRANCHISE_EVENT_TYPE_IDS } from "./bookingUtils";
import { CRM } from "../crmTheme";

const TZ = "America/Toronto";

// Slot picker + confirm for rescheduling an existing booking.
export default function RescheduleFlow({ booking, onConfirm, pending, error }) {
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const boardKey = booking.source === "franchise" ? "franchise" : "hiring";

  const { data: avail = {}, isLoading } = useQuery({
    queryKey: ["cal-availability", boardKey, booking.eventTypeId || "default"],
    queryFn: async () => {
      const payload = { boardKey, timeZone: TZ, startDate: new Date().toLocaleDateString("en-CA", { timeZone: TZ }) };
      if (boardKey === "franchise" && FRANCHISE_EVENT_TYPE_IDS.includes(String(booking.eventTypeId))) payload.eventTypeId = booking.eventTypeId;
      return (await base44.functions.invoke("getCalAvailability", payload))?.data?.slots || {};
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const days = Object.keys(avail).filter((d) => (avail[d] || []).length > 0).sort();
  const slots = day ? avail[day] || [] : [];
  const chip = (active) => ({
    background: active ? CRM.ink : "var(--crm-card-bg)",
    color: active ? "var(--crm-page-bg)" : CRM.ink,
    border: active ? `1px solid ${CRM.ink}` : "1px solid rgba(182,118,81,0.18)",
  });

  if (isLoading) return <div className="flex items-center gap-2 py-6 text-[14px]" style={{ color: CRM.sub }}><Loader2 className="w-4 h-4 animate-spin" /> Loading availability…</div>;
  if (!days.length) return <p className="py-6 text-[14px]" style={{ color: CRM.sub }}>No available slots in the next 30 days.</p>;

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: CRM.sub }}>Select a day</p>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {days.map((d) => (
          <button key={d} type="button" onClick={() => { setDay(d); setSlot(null); }} className="shrink-0 w-[72px] py-2 rounded-2xl text-center" style={chip(day === d)}>
            <div className="text-[11px] opacity-80">{format(new Date(`${d}T12:00:00`), "EEE")}</div>
            <div className="text-[14px] font-semibold">{format(new Date(`${d}T12:00:00`), "MMM d")}</div>
          </button>
        ))}
      </div>
      <p className="text-[12px] font-semibold uppercase tracking-wide mt-4 mb-2" style={{ color: CRM.sub }}>Select a time</p>
      {!day ? (
        <p className="text-[14px] italic" style={{ color: CRM.sub }}>Pick a day to see times.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {slots.map((s) => {
            const iso = s?.start || s;
            return (
              <button key={iso} type="button" onClick={() => setSlot(iso)} className="py-2 rounded-xl text-[14px] font-medium" style={chip(slot === iso)}>
                {format(new Date(iso), "h:mm a")}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-3 text-[13px]" style={{ color: "#e5484d" }}>{error}</p>}
      <button
        type="button"
        disabled={!slot || pending}
        onClick={() => onConfirm(slot)}
        className="mt-4 w-full h-12 rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: CRM.ink, color: "var(--crm-page-bg)" }}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />} Confirm reschedule
      </button>
    </div>
  );
}