import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, HelpCircle, Repeat, CircleCheck, XCircle } from "lucide-react";
import { STATUS_FILTERS } from "./bookingUtils";
import { CRM } from "../crmTheme";

const ICONS = { upcoming: CheckCircle2, unconfirmed: HelpCircle, recurring: Repeat, past: CircleCheck, cancelled: XCircle };

// "Upcoming ▾" pill → "Filter by Status" menu.
export default function BookingStatusFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = STATUS_FILTERS.find((s) => s.key === value) || STATUS_FILTERS[0];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-10 px-4 rounded-full text-[15px] font-semibold"
          style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 1px 6px rgba(45,35,32,0.10)", border: CRM.cardBorder }}
        >
          {current.label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="crm-root w-[260px] p-2 rounded-2xl border-0 z-[70]" style={{ background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.18)" }}>
        <div className="px-3 pt-1.5 pb-2 text-[12px]" style={{ color: CRM.sub }}>Filter by Status</div>
        {STATUS_FILTERS.map(({ key, label }) => {
          const Icon = ICONS[key];
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { onChange(key); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[16px] text-left hover:bg-black/5"
              style={{ color: CRM.ink, fontWeight: active ? 600 : 400 }}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} fill={active ? "currentColor" : "none"} style={active ? { color: CRM.ink } : {}} />
              <span className={active ? "" : ""}>{label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}