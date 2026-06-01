import React from "react";
import { BOARD_TYPES } from "./boardConfig";
import { Briefcase, Star, Dumbbell, Headset, LayoutGrid, Lock } from "lucide-react";

const ICONS = {
  franchise: Briefcase,
  influencer: Star,
  instructor: Dumbbell,
  frontadmin: Headset,
};

export default function ProgramDock({ activeTab, onTabChange, boards, allowedKeys }) {
  const list = boards && boards.length ? boards : BOARD_TYPES;
  if (list.length <= 1) return null;
  const allowed = allowedKeys ? new Set(allowedKeys) : null;

  return (
    <div className="fixed left-3 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-1 py-3 px-2 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/40 shadow-xl">
      <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-1">
        <LayoutGrid className="w-3 h-3" /> Filter
      </span>

      {list.map((t) => {
        const Icon = ICONS[t.key];
        const isActive = activeTab === t.key;
        const isAllowed = allowed ? allowed.has(t.key) : true;
        return (
          <button
            key={t.key}
            onClick={() => isAllowed && onTabChange(t.key)}
            disabled={!isAllowed}
            title={isAllowed ? t.label : `${t.label} — admin access only`}
            className={`group flex flex-col items-center gap-0.5 ${
              !isAllowed ? "cursor-not-allowed opacity-40" : ""
            }`}
          >
            <div
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-white shadow-lg scale-105"
                  : isAllowed
                  ? "bg-white/30 hover:bg-white/50"
                  : "bg-white/10"
              }`}
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? t.color : "white" }}
              />
              {!isAllowed && (
                <Lock className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-white/80 bg-black/40 rounded-full p-0.5" />
              )}
            </div>
            <span
              className={`text-[10px] font-medium leading-tight transition-colors ${
                isActive ? "text-white" : "text-white/60 group-hover:text-white/80"
              }`}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}