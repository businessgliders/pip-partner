import React from "react";
import { Archive } from "lucide-react";
import { statusLabel, statusGroupsFor } from "./inboxConfig";

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
    <div className="flex flex-col gap-1 px-1 md:px-1.5 py-3 w-14 md:w-16 shrink-0 bg-white/20 border border-white/30 rounded-2xl backdrop-blur">
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {group.label && (
            <div
              className={`${gi === 0 ? "" : "mt-2 pt-2 border-t border-white/15"} mb-1 flex items-center justify-center`}
            >
              <span
                style={{ background: accent, color: "#fff" }}
                className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider leading-none shadow-sm"
              >
                {group.label}
              </span>
            </div>
          )}
          {group.statuses.map((s) => {
            const isActive = !archivedActive && active === s;
            const c = counts[s] || 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange(isActive ? null : s)}
                title={statusLabel(sourceKey, s)}
                style={isActive ? { background: accent, color: "#fff" } : undefined}
                className={`relative w-13 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
                  isActive ? "shadow-md" : "text-white/65 hover:bg-white/10"
                }`}
              >
                <span className="text-base font-bold leading-none">{c}</span>
                <span className="text-[9px] truncate max-w-[3.2rem] capitalize">
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
          className={`mt-auto w-13 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
            archivedActive ? "shadow-md" : "text-white/65 hover:bg-white/10"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>{archivedCount > 0 ? archivedCount : "Archived"}</span>
        </button>
      )}
    </div>
  );
}