import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarClock, UserPlus, XCircle } from "lucide-react";
import { isCancelled, isPast } from "./bookingUtils";
import { CRM } from "../crmTheme";

// "…" menu on a booking card: Reschedule / Add Guests / Cancel Event.
export default function BookingCardMenu({ booking, onAction, children }) {
  const [open, setOpen] = useState(false);
  const locked = isCancelled(booking) || isPast(booking);
  const pick = (a) => (e) => { e.stopPropagation(); setOpen(false); onAction(a); };

  const item = (Icon, label, action, danger = false) => (
    <button
      type="button"
      onClick={pick(action)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[16px] text-left hover:bg-black/5"
      style={{ color: danger ? "#e5484d" : CRM.ink }}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
      {label}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
        className="crm-root w-[270px] p-2 rounded-2xl border-0 z-[70]"
        style={{ background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.18)" }}
      >
        {!locked && item(CalendarClock, "Reschedule Booking", "reschedule")}
        {!locked && item(UserPlus, "Add Guests", "guests")}
        {!isCancelled(booking) && item(XCircle, "Cancel Event", "cancel", true)}
        {isCancelled(booking) && (
          <div className="px-3 py-2.5 text-[14px]" style={{ color: CRM.sub }}>This booking was cancelled.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}