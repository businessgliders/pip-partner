import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, HelpCircle, Repeat, CircleCheck, XCircle } from "lucide-react";
import { STATUS_FILTERS } from "./bookingUtils";
import { CRM } from "../crmTheme";

const ICONS = { upcoming: CheckCircle2, unconfirmed: HelpCircle, recurring: Repeat, past: CircleCheck, cancelled: XCircle };

// "Upcoming ▾" pill → "Filter by Status" menu.
export default function BookingStatusFilter({ value, onChange, counts = {} }) {
  const [open, setOpen] = useState(false);
  const current = STATUS_FILTERS.find((s) => s.key === value) || STATUS_FILTERS[0];
  const pendingBadge = counts.unconfirmed || 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative h-10 px-4 rounded-full text-[15px] font-semibold"
          style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 1px 6px rgba(45,35,32,0.10)", border: CRM.cardBorder }}
        >
          {current.label}
          {pendingBadge > 0 && value !== "unconfirmed" && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-[18px] text-white"
              style={{ background: CRM.accent }}
            >
              {pendingBadge > 9 ? "9+" : pendingBadge}
            </span>
          )}
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
              <span className="flex-1">{label}</span>
              {counts[key] > 0 && (
                <span
                  className="min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-bold leading-[20px] text-center"
                  style={
                    key === "unconfirmed"
                      ? { background: CRM.accent, color: "#fff" }
                      : { background: "var(--crm-page-bg)", color: CRM.sub }
                  }
                >
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}