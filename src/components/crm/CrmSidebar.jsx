import React from "react";
import {
  LayoutGrid, Users, CalendarDays, FileText, Truck,
  LayoutTemplate, FileSignature, Settings, ChevronDown, ChevronRight,
} from "lucide-react";
import { CRM } from "./crmTheme";
import useReplyNotifications from "@/hooks/useReplyNotifications";

const LEAD_SUBS = [
  { key: "franchise", label: "Franchising" },
  { key: "instructor", label: "Instructor" },
  { key: "frontadmin", label: "Front Desk" },
];

function Badge({ count }) {
  if (!count) return null;
  return (
    <span
      className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
      style={{ background: "#f1889b" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItem({ icon: Icon, label, active, onClick, chevron, open, placeholder, badge }) {
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
      <Badge count={badge} />
      {chevron && (open
        ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        : <ChevronRight className="w-3.5 h-3.5 opacity-50" />)}
    </button>
  );
}

export default function CrmSidebar({ page, source, onNavigate }) {
  const leadsOpen = true; // Leads sub-list is always expanded
  const { unreadBySource } = useReplyNotifications();
  const leadsTotal = LEAD_SUBS.reduce((sum, s) => sum + (unreadBySource[s.key] || 0), 0);
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
        <div className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png"
            alt="PiP Partner"
            className="w-8 h-8 object-contain shrink-0"
          />
          <div>
            <div className="text-lg font-bold leading-tight tracking-tight" style={{ color: CRM.ink }}>
              PiP Partner
            </div>
            <div className="text-[9px] tracking-[0.2em] uppercase font-semibold" style={{ color: CRM.brown }}>
              Application Hub
            </div>
          </div>
        </div>
      </button>

      <nav className="space-y-1">
        <NavItem icon={LayoutGrid} label="Dashboard" active={page === "dashboard"} onClick={() => onNavigate("dashboard")} />
        <NavItem icon={CalendarDays} label="Meetings" active={page === "bookings"} onClick={() => onNavigate("bookings")} />
        <NavItem
          icon={Users}
          label="Leads"
          active={leadsOpen}
          chevron
          open={leadsOpen}
          onClick={() => onNavigate("leads", source || "franchise")}
          badge={leadsTotal}
        />
        {leadsOpen && (
          <div className="pl-6 space-y-1 py-0.5">
            {LEAD_SUBS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onNavigate("leads", s.key)}
                className={`w-full flex items-center justify-between gap-2 text-left px-3.5 py-1.5 rounded-full text-[12px] transition-all ${
                  source === s.key ? "bg-white font-semibold shadow-sm" : "hover:bg-white/50 font-medium"
                }`}
                style={{ color: CRM.ink }}
              >
                <span className="truncate">{s.label}</span>
                <Badge count={unreadBySource[s.key] || 0} />
              </button>
            ))}
          </div>
        )}
        <NavItem icon={FileText} label="Tasks" active={page === "projects"} onClick={() => onNavigate("projects")} />
      </nav>

      <div className="my-5 border-t" style={{ borderColor: "rgba(182,118,81,0.15)" }} />

      <nav className="space-y-1">
        <NavItem icon={FileSignature} label="Contracts" active={page === "financials"} onClick={() => onNavigate("financials")} />
        <NavItem icon={LayoutTemplate} label="Templates" active={page === "templates"} onClick={() => onNavigate("templates")} />
        <NavItem icon={Truck} label="Build Out" active={page === "delivery"} placeholder onClick={() => onNavigate("delivery")} />
        <NavItem icon={Settings} label="Settings" active={page === "settings"} onClick={() => onNavigate("settings")} />
      </nav>

      {/* Decorative watermark */}
      <div className="mt-auto pt-10 select-none pointer-events-none">
        <img
          src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png"
          alt=""
          className="w-44 -ml-8 -mb-8 opacity-[0.14]"
        />
      </div>
    </div>
  );
}