import React from "react";
import { Archive, CalendarDays } from "lucide-react";
import { statusLabel, statusGroupsFor, UPCOMING_MEETINGS_KEY } from "./inboxConfig";

/**
 * Vertical status filter rail on the left of the thread list.
 * Statuses are rendered in groups (e.g. "Step 1" / "Step 2" / "Other") based
 * on the per-source config in inboxConfig.INBOX_STATUS_GROUPS. Clicking the
 * already-active status toggles it off (returns to "show all").
 */
export default function InboxStatusRail({
  sourceKey,
  active,
  onChange,
  counts = {},
  accent = "#b67651",
  archivedActive = false,
  onArchived,
  archivedCount = 0,
}) {
  const groups = statusGroupsFor(sourceKey);

  return (
    <div className="flex flex-col gap-1 px-0.5 md:px-1.5 py-3 w-12 md:w-16 shrink-0 bg-white/20 border border-white/30 rounded-2xl backdrop-blur">
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {group.label && (
            <div
              className={`${gi === 0 ? "" : "mt-2 pt-2 border-t border-white/15"} mb-1 flex items-center justify-center`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none text-white/70">
                {group.label}
              </span>
            </div>
          )}
          {group.statuses.map((s) => {
            const isActive = !archivedActive && active === s;
            const c = counts[s] || 0;

            // Special-case the "upcoming meetings" pseudo-status: render as a
            // calendar icon with a notification-style badge for the count.
            if (s === UPCOMING_MEETINGS_KEY) {
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(isActive ? null : s)}
                  title={`Upcoming meetings${c ? ` (${c})` : ""}`}
                  style={isActive ? { background: accent, color: "#fff" } : undefined}
                  className={`relative w-full flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
                    isActive ? "shadow-md" : "text-white/65 hover:bg-white/10"
                  }`}
                >
                  <span className="relative inline-flex">
                    <CalendarDays className="w-5 h-5" />
                    {c > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow ring-2 ring-white/30">
                        {c > 99 ? "99+" : c}
                      </span>
                    )}
                  </span>
                  <span className="block w-full px-0.5 text-[9px] truncate text-center">
                    Upcoming
                  </span>
                </button>
              );
            }

            // Hide empty statuses on mobile/tablet (< md). Keep them on desktop
            // so the rail layout stays stable for power users.
            const hideWhenEmpty = c === 0 && !isActive ? "hidden md:flex" : "flex";
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange(isActive ? null : s)}
                title={statusLabel(sourceKey, s)}
                style={isActive ? { background: accent, color: "#fff" } : undefined}
                className={`relative w-full ${hideWhenEmpty} flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
                  isActive ? "shadow-md" : "text-white/65 hover:bg-white/10"
                }`}
              >
                <span className="text-base font-bold leading-none">{c}</span>
                <span className="block w-full px-0.5 text-[9px] truncate capitalize text-center">
                  {statusLabel(sourceKey, s).split(" ")[0]}
                </span>
              </button>
            );
          })}
        </React.Fragment>
      ))}

      {onArchived && (
        <button
          type="button"
          onClick={onArchived}
          title="Archived"
          style={archivedActive ? { background: accent, color: "#fff" } : undefined}
          className={`mt-auto w-full flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
            archivedActive ? "shadow-md" : "text-white/65 hover:bg-white/10"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span className="block w-full px-0.5 truncate text-center">{archivedCount > 0 ? archivedCount : "Archived"}</span>
        </button>
      )}
    </div>
  );
}