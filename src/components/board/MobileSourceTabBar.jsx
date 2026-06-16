import React from "react";
import { Briefcase, Star, Dumbbell, Headset, Lock } from "lucide-react";

const ICONS = {
  franchise: Briefcase,
  influencer: Star,
  instructor: Dumbbell,
  frontadmin: Headset,
};

/**
 * iOS-style bottom tab bar for switching between board sources. Mobile only
 * — `md:hidden` should be added to the wrapping div / className when used.
 * Spans full width and respects the iOS safe area inset.
 */
export default function MobileSourceTabBar({
  activeTab,
  onTabChange,
  boards,
  allowedKeys,
  className = "",
}) {
  if (!boards || boards.length <= 1) return null;
  const allowed = allowedKeys ? new Set(allowedKeys) : null;

  return (
    <nav
      className={`shrink-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_24px_rgba(0,0,0,0.08)] ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${boards.length}, minmax(0, 1fr))`,
        paddingBottom: "env(safe-area-inset-bottom)",
        // iOS HIG: tab bar content area is 49pt tall on iPhone; safe-area
        // inset (home indicator) extends the bar visually but not its hit
        // area, so labels/icons sit above the indicator.
        minHeight: "calc(49px + env(safe-area-inset-bottom, 0px))",
      }}
    >
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
            className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive
                ? "font-semibold"
                : isAllowed
                  ? "text-slate-500 active:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
            }`}
          >
            <div className="relative">
              {Icon && <Icon className="w-5 h-5" />}
              {!isAllowed && (
                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1.5 opacity-60" />
              )}
            </div>
            <span className="text-[10px] font-medium leading-tight">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}