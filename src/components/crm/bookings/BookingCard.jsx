import React from "react";
import { Video, MoreHorizontal, Check } from "lucide-react";
import BookingCardMenu from "./BookingCardMenu";
import { fmtDayShort, fmtRange, joinUrl, joinLabel, attendeeNames, isCancelled, isPending } from "./bookingUtils";
import { CRM } from "../crmTheme";

// One Cal.com-style booking row.
export default function BookingCard({ booking, onOpen, onAction }) {
  const url = joinUrl(booking);
  const names = attendeeNames(booking);
  const cancelled = isCancelled(booking);
  const pending = isPending(booking) && !cancelled;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="relative px-4 py-3.5 cursor-pointer active:opacity-80 transition-opacity"
      style={{ background: "var(--crm-card-bg)", borderBottom: "1px solid rgba(182,118,81,0.10)", opacity: cancelled ? 0.7 : 1 }}
    >
      <div className="flex items-baseline gap-2 text-[12px]" style={{ color: CRM.sub }}>
        <span className="font-semibold" style={{ color: CRM.ink }}>{fmtDayShort(booking.start)}</span>
        <span>{fmtRange(booking)}</span>
        {cancelled && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#e5484d" }}>Cancelled</span>}
        {pending && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide" style={{ color: CRM.accent }}>Unconfirmed</span>}
      </div>
      <h3 className="mt-1.5 text-[14px] font-semibold leading-snug pr-12" style={{ color: CRM.ink, textDecoration: cancelled ? "line-through" : "none" }}>
        {booking.title || "Meeting"}
      </h3>
      <p className="mt-0.5 text-[12px]" style={{ color: CRM.sub }}>
        {names.length ? `You and ${names.join(", ")}` : "You"}
      </p>
      {url && !cancelled && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium hover:underline"
          style={{ color: "#1a73e8" }}
        >
          <Video className="w-3.5 h-3.5" /> {joinLabel(url)}
        </a>
      )}

      {pending && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAction("confirm"); }}
          className="mt-2.5 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-semibold text-white"
          style={{ background: "#2e9e5b" }}
        >
          <Check className="w-3.5 h-3.5" /> Confirm
        </button>
      )}

      <BookingCardMenu booking={booking} onAction={onAction}>
        <button
          type="button"
          aria-label="Booking actions"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-4 bottom-3.5 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 2px 10px rgba(45,35,32,0.14)", border: CRM.cardBorder }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </BookingCardMenu>
    </div>
  );
}