import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListFilter, CalendarPlus, Check } from "lucide-react";
import { CRM } from "../crmTheme";

// Round filter button → "Filter by Link" menu listing Cal.com event types.
export default function BookingLinkFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const { data: eventTypes = [] } = useQuery({
    queryKey: ["cal-event-types"],
    queryFn: async () => (await base44.functions.invoke("getCalEventTypes", {}))?.data?.eventTypes || [],
    staleTime: 10 * 60 * 1000,
  });

  const item = (key, label, active) => (
    <button
      key={key}
      type="button"
      onClick={() => { onChange(key); setOpen(false); }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[16px] text-left hover:bg-black/5"
      style={{ color: CRM.ink, fontWeight: active ? 600 : 400 }}
    >
      <CalendarPlus className="w-5 h-5 shrink-0" strokeWidth={1.8} />
      <span className="flex-1 leading-tight">{label}</span>
      {active && <Check className="w-4 h-4 shrink-0" style={{ color: CRM.accent }} />}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter by link"
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 1px 6px rgba(45,35,32,0.10)", border: CRM.cardBorder }}
        >
          <ListFilter className="w-5 h-5" strokeWidth={2} />
          {value && <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: CRM.accent }} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="crm-root w-[280px] p-2 rounded-2xl border-0 z-[70]" style={{ background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.18)" }}>
        <div className="px-3 pt-1.5 pb-2 text-[12px]" style={{ color: CRM.sub }}>Filter by Link</div>
        {item("", "All links", !value)}
        {eventTypes.map((t) => item(t.id, t.title, value === t.id))}
      </PopoverContent>
    </Popover>
  );
}