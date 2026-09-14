import React from "react";
import { CalendarDays, Link2, Clock, MoreHorizontal } from "lucide-react";
import { CRM } from "../crmTheme";

const TABS = [
  { key: "bookings", label: "Bookings", Icon: CalendarDays, active: true },
  { key: "links", label: "Links", Icon: Link2 },
  { key: "availability", label: "Availability", Icon: Clock },
  { key: "more", label: "More", Icon: MoreHorizontal },
];

// Replica of Cal.com's iOS bottom tab bar. Only "Bookings" is live; the
// other tabs are decorative.
export default function CalTabBar() {
  return (
    <div
      className="fixed left-0 right-0 lg:left-auto lg:right-8 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <nav
        className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-[26px] pip-tabbar-rise"
        style={{
          background: "var(--crm-card-bg)",
          boxShadow: "0 8px 30px rgba(45,35,32,0.14), 0 1px 3px rgba(45,35,32,0.08)",
          border: CRM.cardBorder,
          width: "min(92vw, 420px)",
        }}
      >
        {TABS.map(({ key, label, Icon, active }) => (
          <button
            key={key}
            type="button"
            disabled={!active}
            aria-current={active ? "page" : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-[52px] rounded-[20px] transition-colors"
            style={{
              background: active ? "var(--crm-blush)" : "transparent",
              color: active ? CRM.ink : CRM.sub,
              cursor: active ? "default" : "not-allowed",
            }}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}