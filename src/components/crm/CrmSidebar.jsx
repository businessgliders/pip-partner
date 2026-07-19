import React from "react";
import {
  LayoutGrid, Users, CalendarDays, FileText, Truck,
  LayoutTemplate, LineChart, Settings, ChevronDown, ChevronRight,
} from "lucide-react";
import { CRM } from "./crmTheme";

const LEAD_SUBS = [
  { key: "franchise", label: "Franchising" },
  { key: "instructor", label: "Instructor" },
  { key: "frontadmin", label: "Front Desk" },
];

function NavItem({ icon: Icon, label, active, onClick, chevron, open, placeholder }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-full text-[13px] transition-all ${
        active ? "bg-white font-semibold shadow-sm" : "hover:bg-white/50 font-medium"
      } ${placeholder ? "opacity-60" : ""}`}
      style={{ color: CRM.ink }}
    >
      <Icon className="w-4 h-4 shrink-0" style={{ color: active ? CRM.accent : "#a3766f" }} />
      <span className="flex-1 text-left truncate">{label}</span>
      {chevron && (open
        ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        : <ChevronRight className="w-3.5 h-3.5 opacity-50" />)}
    </button>
  );
}

export default function CrmSidebar({ page, source, onNavigate }) {
  const leadsOpen = page === "leads";
  return (
    <div
      className="h-full w-56 flex flex-col py-6 px-3 overflow-y-auto hide-scrollbar"
      style={{ background: CRM.sidebarBg }}
    >
      {/* Wordmark */}
      <button
        type="button"
        onClick={() => onNavigate("dashboard")}
        className="px-3 mb-8 text-left"
      >
        <div className="text-lg font-bold leading-tight tracking-tight" style={{ color: CRM.ink }}>
          Pilates in Pink<span className="text-[10px] align-super">™</span>
        </div>
        <div className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: CRM.brown }}>
          HQ
        </div>
      </button>

      <nav className="space-y-1">
        <NavItem icon={LayoutGrid} label="Dashboard" active={page === "dashboard"} onClick={() => onNavigate("dashboard")} />
        <NavItem
          icon={Users}
          label="Leads"
          active={leadsOpen}
          chevron
          open={leadsOpen}
          onClick={() => onNavigate("leads", source || "franchise")}
        />
        {leadsOpen && (
          <div className="pl-6 space-y-1 py-0.5">
            {LEAD_SUBS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onNavigate("leads", s.key)}
                className={`w-full text-left px-3.5 py-1.5 rounded-full text-[12px] transition-all ${
                  source === s.key ? "bg-white font-semibold shadow-sm" : "hover:bg-white/50 font-medium"
                }`}
                style={{ color: CRM.ink }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <NavItem icon={CalendarDays} label="Bookings" active={page === "bookings"} onClick={() => onNavigate("bookings")} />
        <NavItem icon={FileText} label="Projects" active={page === "projects"} placeholder onClick={() => onNavigate("projects")} />
      </nav>

      <div className="my-5 border-t" style={{ borderColor: "rgba(182,118,81,0.15)" }} />

      <nav className="space-y-1">
        <NavItem icon={Truck} label="Delivery" active={page === "delivery"} placeholder onClick={() => onNavigate("delivery")} />
        <NavItem icon={LayoutTemplate} label="Templates" active={page === "templates"} onClick={() => onNavigate("templates")} />
        <NavItem icon={LineChart} label="Financials" active={page === "financials"} placeholder onClick={() => onNavigate("financials")} />
        <NavItem icon={Settings} label="Settings" active={page === "settings"} onClick={() => onNavigate("settings")} />
      </nav>

      {/* Decorative watermark */}
      <div className="mt-auto pt-10 select-none pointer-events-none">
        <div
          className="text-[110px] leading-none font-bold opacity-[0.07] -ml-4"
          style={{ color: CRM.brown }}
        >
          p
        </div>
      </div>
    </div>
  );
}