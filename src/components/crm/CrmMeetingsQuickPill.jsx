import React from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { CRM } from "./crmTheme";

// Mobile quick-access into the meetings view, with a badge for bookings
// still awaiting confirmation.
export default function CrmMeetingsQuickPill({ upcoming = 0, unconfirmed = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="lg:hidden w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
      style={{ background: "var(--crm-card-bg)", boxShadow: CRM.cardShadow, border: CRM.cardBorder }}
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
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: CRM.sub }} />
    </button>
  );
}