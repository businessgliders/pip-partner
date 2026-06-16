import React from "react";
import { Handshake, GraduationCap, ClipboardList } from "lucide-react";
import { SOURCE_META } from "./inboxConfig";

const ICONS = {
  franchise: Handshake,
  instructor: GraduationCap,
  frontadmin: ClipboardList,
};

const TABS = ["franchise", "instructor", "frontadmin"];

export default function InboxSourceTabs({ active, onChange, counts = {} }) {
  const accent = SOURCE_META[active]?.accent || "#b67651";
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      {TABS.map((key) => {
        const Icon = ICONS[key];
        const meta = SOURCE_META[key];
        const isActive = active === key;
        const unread = counts[key] || 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition-all ${
              isActive
                ? "text-white shadow-md"
                : "text-white/70 bg-white/10 hover:bg-white/20 border border-white/15"
            }`}
            style={isActive ? { background: meta.accent } : undefined}
          >
            <Icon className="w-4 h-4" />
            <span>{meta.label}</span>
            {unread > 0 && (
              <span
                className={`ml-1 inline-flex items-center justify-center text-[11px] font-bold rounded-full px-1.5 h-5 min-w-[20px] ${
                  isActive ? "bg-white/30 text-white" : "bg-white text-slate-800"
                }`}
              >
                {unread}
              </span>
            )}
          </button>
        );
      })}
      <div className="flex-1" />
      <div
        className="hidden md:block text-xs text-white/60 px-3 py-1.5 rounded-full border border-white/15 bg-white/10"
        style={{ borderColor: accent + "55" }}
      >
        Inbox View
      </div>
    </div>
  );
}