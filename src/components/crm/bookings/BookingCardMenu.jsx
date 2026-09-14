import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarClock, UserPlus, XCircle, Check, Ban } from "lucide-react";
import { isCancelled, isPast, isPending } from "./bookingUtils";
import { CRM } from "../crmTheme";

// "…" menu on a booking card: Confirm / Decline (pending only) · Reschedule / Add Guests / Cancel Event.
export default function BookingCardMenu({ booking, onAction, children }) {
  const [open, setOpen] = useState(false);
  const locked = isCancelled(booking) || isPast(booking);
  const pending = isPending(booking) && !isCancelled(booking);
  const pick = (a) => (e) => { e.stopPropagation(); setOpen(false); onAction(a); };

  const item = (Icon, label, action, color) => (
    <button
      type="button"
      onClick={pick(action)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-left hover:bg-black/5"
      style={{ color: color || CRM.ink }}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
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
        className="crm-root w-[250px] p-2 rounded-2xl border-0 z-[70]"
        style={{ background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.18)" }}
      >
        {pending && item(Check, "Confirm Booking", "confirm", "#2e9e5b")}
        {pending && item(Ban, "Decline Booking", "decline", "#e5484d")}
        {!locked && item(CalendarClock, "Reschedule Booking", "reschedule")}
        {!locked && item(UserPlus, "Add Guests", "guests")}
        {!isCancelled(booking) && item(XCircle, "Cancel Event", "cancel", "#e5484d")}
        {isCancelled(booking) && (
          <div className="px-3 py-2.5 text-[13px]" style={{ color: CRM.sub }}>This booking was cancelled.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}