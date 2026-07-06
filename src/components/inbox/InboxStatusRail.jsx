import React from "react";
import { CalendarDays } from "lucide-react";
import { statusLabel, statusGroupsFor, UPCOMING_MEETINGS_KEY } from "./inboxConfig";

/**
 * Status filter rail. Two layouts:
 *  · vertical (md+): slim left-side column. Group labels ("Step 1", "Other")
 *    render as centered dividers between their status buttons.
 *  · horizontal (mobile, < md): scrollable row of grouped columns. The group
 *    label sits ABOVE each cluster of buttons (not inline), so the buttons
 *    themselves are all on the same baseline.
 * Clicking the active status toggles it off.
 */
export default function InboxStatusRail({
  sourceKey,
  active,
  onChange,
  counts = {},
  accent = "#b67651",
  orientation = "vertical",
}) {
  const groups = statusGroupsFor(sourceKey);
  const showEmptyStatusesOnDesktop = sourceKey === "instructor" || sourceKey === "frontadmin";
  const isHorizontal = orientation === "horizontal";

  // A single status button — shared between both layouts. Handles the
  // "upcoming meetings" pseudo-status specially (calendar icon + badge).
  const renderStatusButton = (s) => {
    const isActive = active === s;
    const c = counts[s] || 0;

    if (s === UPCOMING_MEETINGS_KEY) {
      return (
        <button
          key={s}
          type="button"
          onClick={() => onChange(isActive ? null : s)}
          title={`Upcoming meetings${c ? ` (${c})` : ""}`}
          style={isActive ? { background: accent, color: "#fff" } : undefined}
          className={`relative ${isHorizontal ? "shrink-0 min-w-[56px] px-2" : "w-full"} flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
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

    // Hide empty statuses when count is 0 and not selected. On
    // instructor/frontadmin we keep them visible on desktop (lg+).
    let hideClass;
    if (c === 0 && !isActive) {
      hideClass = showEmptyStatusesOnDesktop ? "hidden lg:flex" : "hidden";
    } else {
      hideClass = "flex";
    }

    return (
      <button
        key={s}
        type="button"
        onClick={() => onChange(isActive ? null : s)}
        title={statusLabel(sourceKey, s)}
        style={isActive ? { background: accent, color: "#fff" } : undefined}
        className={`relative ${isHorizontal ? "shrink-0 min-w-[56px] px-2" : "w-full"} ${hideClass} flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
          isActive ? "shadow-md" : "text-white/65 hover:bg-white/10"
        }`}
      >
        <span className="text-base font-bold leading-none">{c}</span>
        <span className="block w-full px-0.5 text-[9px] truncate capitalize text-center">
          {s === "declined" || s === "closed"
            ? "No Interest"
            : statusLabel(sourceKey, s).split(" ")[0]}
        </span>
      </button>
    );
  };

  // Horizontal (mobile): each group is its own column with the label ABOVE
  // its buttons. Groups sit side-by-side separated by a hairline divider.
  if (isHorizontal) {
    return (
      <div className="flex flex-row items-stretch gap-2 px-1.5 pt-1 pb-1.5 w-full overflow-x-auto hide-scrollbar bg-white/20 border border-white/30 rounded-2xl backdrop-blur">
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="shrink-0 w-px my-1.5 bg-white/15" />}
            <div className="flex flex-col shrink-0">
              <div className="flex flex-row items-stretch gap-1">
                {group.statuses.map((s) => renderStatusButton(s))}
              </div>
              {/* Group label sits BELOW its buttons, centered under the
                  cluster. Reserved on every group so heights stay uniform. */}
              <div className="h-3 flex items-center justify-center mt-0.5">
                {group.label && (
                  <span className="text-[8px] font-semibold uppercase tracking-wider leading-none text-white/55">
                    {group.label}
                  </span>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Vertical (md+): stack groups, each with a centered inline label divider.
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
          {group.statuses.map((s) => renderStatusButton(s))}
        </React.Fragment>
      ))}
    </div>
  );
}