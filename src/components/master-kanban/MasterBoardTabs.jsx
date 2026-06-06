import React from "react";
import { cn } from "@/lib/utils";

/**
 * MasterBoardTabs — generic board-type switcher.
 *
 * Extracted from pip-partner's ApplicationBoard pattern where one page hosts
 * 4 kanbans (Franchise / Instructor / Front Desk / Influencer) and the user
 * swaps between them via tabs.
 *
 * Per-user access:
 *   - Pass `allowedKeys` to restrict which tabs are visible to the current
 *     user. The parent decides the rule (admin sees all, others see only the
 *     boards they own). This component just filters.
 *
 * Props:
 *   - boards: [{ key, label, color, bg }]
 *   - activeKey
 *   - onChange(key)
 *   - allowedKeys?: string[]  // optional whitelist
 */
export default function MasterBoardTabs({
  boards = [],
  activeKey,
  onChange,
  allowedKeys,
  className,
}) {
  const visible = allowedKeys
    ? boards.filter((b) => allowedKeys.includes(b.key))
    : boards;

  if (visible.length <= 1) return null;

  return (
    <div className={cn("flex gap-1 p-1 bg-slate-100 rounded-xl w-fit", className)}>
      {visible.map((b) => {
        const active = b.key === activeKey;
        return (
          <button
            key={b.key}
            type="button"
            onClick={() => onChange?.(b.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              active
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            )}
            style={active && b.color ? { color: b.color } : undefined}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}