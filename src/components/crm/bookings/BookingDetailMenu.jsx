import React from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, CalendarClock, UserPlus, XCircle, Check, Ban } from "lucide-react";
import { isCancelled, isPast, isPending } from "./bookingUtils";
import { CRM } from "../crmTheme";

// "…" menu in the meeting detail header. Flat list (no submenus) so it always
// fits inside a narrow mobile viewport.
export default function BookingDetailMenu({ booking, joinUrl, onAction, onCopied }) {
  const locked = isCancelled(booking) || isPast(booking);
  const pending = isPending(booking) && !isCancelled(booking);
  const itemCls = "text-[13px] px-2.5 py-2 rounded-lg gap-2.5";
  const contentStyle = { background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.18)", color: CRM.ink };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="More" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 1px 6px rgba(45,35,32,0.10)", border: CRM.cardBorder }}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} collisionPadding={12} className="crm-root w-[210px] p-1.5 rounded-2xl border-0 z-[70]" style={contentStyle}>
        {pending && (
          <DropdownMenuItem onClick={() => onAction("confirm")} className={itemCls} style={{ color: "#2e9e5b" }}>
            <Check className="w-4 h-4" strokeWidth={1.8} /> Confirm Booking
          </DropdownMenuItem>
        )}
        {pending && (
          <DropdownMenuItem onClick={() => onAction("decline")} className={itemCls} style={{ color: "#e5484d" }}>
            <Ban className="w-4 h-4" strokeWidth={1.8} /> Decline Booking
          </DropdownMenuItem>
        )}
        {pending && <DropdownMenuSeparator />}
        <DropdownMenuItem
          disabled={!joinUrl}
          onClick={() => { navigator.clipboard?.writeText(joinUrl); onCopied?.(); }}
          className={itemCls}
        >
          <Copy className="w-4 h-4" strokeWidth={1.8} /> Copy Meeting Link
        </DropdownMenuItem>
        {!locked && (
          <DropdownMenuItem onClick={() => onAction("reschedule")} className={itemCls}>
            <CalendarClock className="w-4 h-4" strokeWidth={1.8} /> Reschedule Booking
          </DropdownMenuItem>
        )}
        {!locked && (
          <DropdownMenuItem onClick={() => onAction("guests")} className={itemCls}>
            <UserPlus className="w-4 h-4" strokeWidth={1.8} /> Add Guests
          </DropdownMenuItem>
        )}
        {!isCancelled(booking) && (
          <DropdownMenuItem onClick={() => onAction("cancel")} className={itemCls} style={{ color: "#e5484d" }}>
            <XCircle className="w-4 h-4" strokeWidth={1.8} /> Cancel Event
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}