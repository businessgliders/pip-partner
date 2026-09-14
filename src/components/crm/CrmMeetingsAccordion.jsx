import React, { useState } from "react";
import { CalendarDays, ChevronDown, ArrowRight } from "lucide-react";
import CrmUpcomingBookingsWidget from "./CrmUpcomingBookingsWidget";
import { CRM } from "./crmTheme";

// Mobile-only: meetings summary that expands into the upcoming meetings list.
// The arrow on the right opens the full meetings tab.
export default function CrmMeetingsAccordion({ upcoming = 0, unconfirmed = 0, bookings, ticketByEmail, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden rounded-2xl overflow-hidden" style={{ background: "var(--crm-card-bg)", boxShadow: CRM.cardShadow, border: CRM.cardBorder }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
        >
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: CRM.blush }}>
            <CalendarDays className="w-[18px] h-[18px]" style={{ color: "var(--tile-pink-fg)" }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold" style={{ color: CRM.ink }}>Meetings</span>
            <span className="block text-[11px]" style={{ color: CRM.sub }}>
              {upcoming} upcoming
              {unconfirmed > 0 ? ` · ${unconfirmed} awaiting confirmation` : ""}
            </span>
          </span>
          {unconfirmed > 0 && (
            <span
              className="min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold leading-[22px] text-center text-white shrink-0"
              style={{ background: CRM.accent }}
            >
              {unconfirmed}
            </span>
          )}
          <ChevronDown
            className="w-4 h-4 shrink-0 transition-transform"
            style={{ color: CRM.sub, transform: open ? "rotate(180deg)" : "none" }}
          />
        </button>
        <button
          type="button"
          aria-label="Open meetings"
          onClick={() => onNavigate("bookings")}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: CRM.blush, color: "var(--tile-pink-fg)" }}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="px-1 pb-1">
          <CrmUpcomingBookingsWidget
            bookings={bookings}
            ticketByEmail={ticketByEmail}
            onNavigate={onNavigate}
            embedded
          />
        </div>
      )}
    </div>
  );
}