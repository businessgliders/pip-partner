import React, { useState } from "react";
import { Briefcase, Star, Dumbbell, Headset, Lock } from "lucide-react";

const ICONS = {
  franchise: Briefcase,
  influencer: Star,
  instructor: Dumbbell,
  frontadmin: Headset,
};

/**
 * iOS-style bottom tab bar for switching between board sources. Mobile + tablet
 * only — `lg:hidden` should be added to the wrapping div / className when used.
 * Spans full width and respects the iOS safe area inset.
 *
 * Optional `extraSlot` is rendered as an additional tab on the far right
 * (e.g. notification bell on mobile/tablet, where the bell has been moved
 * out of the top header to save vertical space).
 */
export default function MobileSourceTabBar({
  activeTab,
  onTabChange,
  boards,
  allowedKeys,
  className = "",
  extraSlot = null,
}) {
  // Bumps every time a tab is tapped so the iOS spring-tap animation replays.
  const [tapKey, setTapKey] = useState(0);
  if (!boards || boards.length <= 1) return null;
  const allowed = allowedKeys ? new Set(allowedKeys) : null;
  const totalColumns = boards.length + (extraSlot ? 1 : 0);

  return (
    <nav
      className={`shrink-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_24px_rgba(0,0,0,0.08)] pip-tabbar-rise ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
        // Respect the iOS home-indicator safe area. `max(...)` keeps a
        // minimum 4px bottom inset on devices/browsers that report 0 (Android,
        // older iOS, desktop dev) so labels never touch the screen edge.
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2px)",
        // Also pad the horizontal edges in landscape — iOS reports left/right
        // safe-area insets when the device is rotated and the notch / Dynamic
        // Island intrudes into the side margins.
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        // Compact tab-bar content area — the safe-area inset visually extends
        // the bar over the home indicator without adding to the hit area.
        minHeight: "calc(40px + env(safe-area-inset-bottom, 0px))",
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
            onClick={() => {
              if (!isAllowed) return;
              setTapKey((k) => k + 1);
              onTabChange(t.key);
            }}
            disabled={!isAllowed}
            title={isAllowed ? t.label : `${t.label} — admin access only`}
            style={isActive ? { color: t.color } : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              isActive
                ? "font-semibold"
                : isAllowed
                  ? "text-slate-500 active:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
            }`}
          >
            <div
              key={isActive ? `active-${tapKey}` : "idle"}
              className={`relative ${isActive ? "pip-tap-scale" : ""}`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              {!isAllowed && (
                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1.5 opacity-60" />
              )}
            </div>
            <span className="text-[10px] font-medium leading-tight">{t.label}</span>
          </button>
        );
      })}
      {extraSlot && (
        <div className="flex items-center justify-center py-1">
          {extraSlot}
        </div>
      )}
    </nav>
  );
}