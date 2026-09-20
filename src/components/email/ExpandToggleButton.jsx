import React from "react";
import { ChevronDown } from "lucide-react";

// Explicit expand/collapse control for an email bubble. Replaces whole-bubble
// tap targets so the toggle behaves identically on inbound and outbound.
export default function ExpandToggleButton({ expanded, onToggle, tone = "light" }) {
  const isOnColor = tone === "onColor";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-semibold transition-colors ${
        isOnColor
          ? "bg-white/25 hover:bg-white/40"
          : "bg-black/5 hover:bg-black/10 text-gray-600"
      }`}
      style={isOnColor ? { color: "var(--tile-rose-fg)" } : undefined}
    >
      <ChevronDown className={`w-3 h-3 ${expanded ? "rotate-180" : ""}`} />
      {expanded ? "Collapse" : "Expand"}
    </button>
  );
}