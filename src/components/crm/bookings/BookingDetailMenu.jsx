import React from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, CalendarClock, UserPlus, XCircle } from "lucide-react";
import { isCancelled, isPast } from "./bookingUtils";
import { CRM } from "../crmTheme";

// "…" menu in the meeting detail header: Copy Meeting Link · Edit Event › · Danger Zone ›
export default function BookingDetailMenu({ booking, joinUrl, onAction, onCopied }) {
  const locked = isCancelled(booking) || isPast(booking);
  const itemCls = "text-[16px] px-3 py-2.5 rounded-xl gap-3";
  const contentStyle = { background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.18)", color: CRM.ink };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="More" className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 1px 6px rgba(45,35,32,0.10)", border: CRM.cardBorder }}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="crm-root w-[260px] p-2 rounded-2xl border-0 z-[70]" style={contentStyle}>
        <DropdownMenuItem
          disabled={!joinUrl}
          onClick={() => { navigator.clipboard?.writeText(joinUrl); onCopied?.(); }}
          className={itemCls}
        >
          <Copy className="w-5 h-5" strokeWidth={1.8} /> Copy Meeting Link
        </DropdownMenuItem>
        {!locked && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={itemCls}>Edit Event</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="crm-root p-2 rounded-2xl border-0 z-[70]" style={contentStyle}>
              <DropdownMenuItem onClick={() => onAction("reschedule")} className={itemCls}><CalendarClock className="w-5 h-5" strokeWidth={1.8} /> Reschedule Booking</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("guests")} className={itemCls}><UserPlus className="w-5 h-5" strokeWidth={1.8} /> Add Guests</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {!isCancelled(booking) && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={itemCls}>Danger Zone</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="crm-root p-2 rounded-2xl border-0 z-[70]" style={contentStyle}>
              <DropdownMenuItem onClick={() => onAction("cancel")} className={itemCls} style={{ color: "#e5484d" }}><XCircle className="w-5 h-5" strokeWidth={1.8} /> Cancel Event</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}