import React, { useState } from "react";
import { Home, CalendarDays, Users, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CRM } from "./crmTheme";

const LEAD_TYPES = [
  { key: "franchise", label: "Franchise" },
  { key: "instructor", label: "Instructor" },
  { key: "frontadmin", label: "Front Desk" },
];

// iOS-style bottom tab bar for the Application Hub on mobile/tablet.
// "Leads" opens a small menu to pick which board to open.
export default function CrmMobileTabBar({ page, onNavigate, meetingsBadge = 0 }) {
  const [leadsOpen, setLeadsOpen] = useState(false);

  const tabStyle = (active) => ({
    background: active ? "var(--crm-blush)" : "transparent",
    color: active ? CRM.ink : CRM.sub,
  });

  const Tab = ({ active, Icon, label, badge, onClick, asTrigger }) => {
    const btn = (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className="relative flex-1 flex flex-col items-center justify-center gap-1 h-[52px] rounded-[20px] transition-colors"
        style={tabStyle(active)}
      >
        <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
        <span className="text-[10px] font-medium leading-none">{label}</span>
        {badge > 0 && (
          <span
            className="absolute top-1.5 right-1/2 translate-x-[16px] min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold leading-[17px] text-center text-white"
            style={{ background: CRM.accent }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
    );
    return asTrigger ? <PopoverTrigger asChild>{btn}</PopoverTrigger> : btn;
  };

  return (
    <div
      className="lg:hidden fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}
    >
      <nav
        className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-[26px] pip-tabbar-rise"
        style={{
          background: "var(--crm-card-bg)",
          boxShadow: "0 8px 30px rgba(45,35,32,0.16), 0 1px 3px rgba(45,35,32,0.08)",
          border: CRM.cardBorder,
          width: "min(92vw, 420px)",
        }}
      >
        <Tab active={page === "dashboard"} Icon={Home} label="Home" onClick={() => onNavigate("dashboard")} />
        <Tab
          active={page === "bookings"}
          Icon={CalendarDays}
          label="Meetings"
          badge={meetingsBadge}
          onClick={() => onNavigate("bookings")}
        />
        <Popover open={leadsOpen} onOpenChange={setLeadsOpen}>
          <Tab active={page === "leads"} Icon={Users} label="Leads" asTrigger onClick={() => {}} />
          <PopoverContent
            side="top"
            sideOffset={10}
            className="crm-root w-[220px] p-2 rounded-2xl border-0 z-[70]"
            style={{ background: "var(--crm-card-bg)", boxShadow: "0 12px 40px rgba(45,35,32,0.20)" }}
          >
            <div className="px-3 pt-1 pb-2 text-[11px]" style={{ color: CRM.sub }}>Open leads board</div>
            {LEAD_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setLeadsOpen(false); onNavigate("leads", t.key); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] text-left hover:bg-black/5"
                style={{ color: CRM.ink }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: CRM.accent }} />
                {t.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <Tab active={page === "settings"} Icon={Settings} label="Settings" onClick={() => onNavigate("settings")} />
      </nav>
    </div>
  );
}