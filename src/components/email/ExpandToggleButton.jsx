import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Chevron-only collapse control shown inside an expanded email bubble, plus a
// non-interactive chevron hint for collapsed bubbles (the whole bubble is the
// tap target in that state).
export default function ExpandToggleButton({ expanded, onToggle, tone = "light" }) {
  const isOnColor = tone === "onColor";
  const color = isOnColor ? "rgba(255,255,255,0.85)" : undefined;

  if (!expanded) {
    return (
      <ChevronDown
        className="w-3 h-3 text-gray-400 shrink-0"
        style={color ? { color } : undefined}
        title="Tap to view full message"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title="Collapse"
      aria-label="Collapse message"
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
        isOnColor ? "bg-white/25 hover:bg-white/40" : "bg-black/5 hover:bg-black/10 text-gray-600"
      }`}
      style={color ? { color } : undefined}
    >
      <ChevronUp className="w-3.5 h-3.5" />
    </button>
  );
}