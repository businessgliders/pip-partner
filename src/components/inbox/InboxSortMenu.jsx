import React from "react";
import { ArrowUpDown, CalendarClock, CalendarCheck2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Sort dropdown for the thread list. Currently supports:
 *   - submission: sort by ticket creation date (default)
 *   - appointment: sort by Cal.com booking date (franchise only)
 *
 * `showAppointment` toggles whether the appointment option is offered.
 */
export default function InboxSortMenu({ value = "submission", onChange, showAppointment = false }) {
  const options = [
    { key: "submission", label: "Submission date", icon: CalendarClock },
    ...(showAppointment
      ? [{ key: "appointment", label: "Appointment date", icon: CalendarCheck2 }]
      : []),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Sort"
          className="h-7 w-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Sort by
        </div>
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.key;
          return (
            <DropdownMenuItem
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className="cursor-pointer text-xs flex items-center gap-2"
            >
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span className="flex-1">{opt.label}</span>
              {active && <Check className="w-3.5 h-3.5 text-slate-700" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}