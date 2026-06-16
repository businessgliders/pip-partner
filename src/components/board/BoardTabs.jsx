import React from "react";
import { Briefcase, Star, Dumbbell, Headset, Lock } from "lucide-react";

const ICONS = {
  franchise: Briefcase,
  influencer: Star,
  instructor: Dumbbell,
  frontadmin: Headset,
};

/**
 * Horizontal pill tabs for switching between board sources. Replaces the
 * vertical ProgramDock + the legacy mobile pill row. Visual style mirrors the
 * pip-hub `InboxTopBar` tabs: rounded-full pills, icon + label, accent color
 * on the active tab.
 */
export default function BoardTabs({ activeTab, onTabChange, boards, allowedKeys }) {
  if (!boards || boards.length <= 1) return null;
  const allowed = allowedKeys ? new Set(allowedKeys) : null;

  return (
    <div className="flex gap-1.5 md:gap-2 -mx-2 px-2 mt-3 mb-1 overflow-x-auto hide-scrollbar">
      {boards.map((t) => {
        const Icon = ICONS[t.key];
        const isActive = activeTab === t.key;
        const isAllowed = allowed ? allowed.has(t.key) : true;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => isAllowed && onTabChange(t.key)}
            disabled={!isAllowed}
            title={isAllowed ? t.label : `${t.label} — admin access only`}
            style={isActive ? { color: t.color } : undefined}
            className={`relative flex flex-1 lg:flex-initial items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all border ${
              isActive
                ? "bg-white/90 shadow-sm border-white"
                : isAllowed
                  ? "text-white/75 bg-white/10 border-white/20 hover:text-white hover:bg-white/20"
                  : "text-white/40 bg-white/5 border-white/10 cursor-not-allowed"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />}
            <span className="hidden md:inline">{t.label}</span>
            {!isAllowed && <Lock className="w-3 h-3 ml-1 opacity-60" />}
          </button>
        );
      })}
    </div>
  );
}