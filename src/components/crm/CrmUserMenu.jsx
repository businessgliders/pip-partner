import React from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Moon, Sun, SunMoon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CRM } from "./crmTheme";
import useTheme from "@/hooks/useTheme";

const MODES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "auto", label: "Auto", icon: SunMoon },
];

export default function CrmUserMenu({ user, initials }) {
  const { mode, setMode } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ring-2 ring-white shadow-sm hover:brightness-95 transition-all"
          style={{ background: "#e9d5f5", color: "#7c5295" }}
          title={user?.email}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-72 p-3 rounded-2xl crm-root border-0" style={{ boxShadow: "0 8px 32px rgba(60,40,30,0.18)" }}>
        <div className="rounded-xl p-3.5 mb-2" style={{ background: "var(--crm-page-bg)" }}>
          <div className="text-[10px] tracking-[0.12em] uppercase font-semibold mb-1.5" style={{ color: CRM.sub }}>
            Signed in as
          </div>
          <div className="text-[13px] font-bold" style={{ color: CRM.ink }}>
            {user?.full_name || "User"}
          </div>
          <div className="text-[12px] mt-0.5 break-all" style={{ color: CRM.sub }}>
            {user?.email}
          </div>
        </div>

        {/* Theme switch */}
        <div className="rounded-xl p-1 mb-1 grid grid-cols-3 gap-1" style={{ background: "var(--crm-page-bg)" }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${active ? "shadow-sm" : "opacity-60 hover:opacity-100"}`}
                style={{ background: active ? "var(--crm-card-bg)" : "transparent", color: CRM.ink }}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>
        <p className="px-1 pb-2 text-[10px]" style={{ color: CRM.sub }}>
          Auto turns dark mode on after sunset.
        </p>

        <button
          type="button"
          onClick={() => base44.auth.logout("/login")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#fdf8f4] transition-colors"
          style={{ color: CRM.ink }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}