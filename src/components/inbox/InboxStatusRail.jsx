import React from "react";
import { Archive, Inbox as InboxIcon } from "lucide-react";
import { statusLabel } from "./inboxConfig";

/**
 * Vertical status filter rail on the left of the thread list.
 * Each tab shows the count as the glyph and the status name below.
 *   - `active === null` means "All" is selected.
 */
export default function InboxStatusRail({
  sourceKey,
  statuses = [],
  active,
  onChange,
  counts = {},
  accent = "#b67651",
  archivedActive = false,
  onArchived,
  archivedCount = 0,
}) {
  return (
    <div className="hidden md:flex flex-col gap-1.5 px-1.5 py-3 w-16 shrink-0 bg-white/5 border border-white/10 rounded-2xl">
      <button
        type="button"
        onClick={() => onChange(null)}
        title="All"
        style={!archivedActive && active === null ? { background: accent, color: "#fff" } : undefined}
        className={`w-13 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium leading-none transition-all ${
          !archivedActive && active === null
            ? "shadow-md"
            : "text-white/65 hover:bg-white/10"
        }`}
      >
        <InboxIcon className="w-4 h-4" />
        <span>All</span>
      </button>

      {statuses.map((s) => {
        const isActive = !archivedActive && active === s;
        const c = counts[s] || 0;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
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