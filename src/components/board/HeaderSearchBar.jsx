import React, { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

/**
 * Expandable glass-style search bar that opens below the header on click.
 * Visual language matches the header (white/15 glass + white/40 border).
 *
 * Props:
 *   open       — whether the bar is expanded
 *   onToggle   — toggle handler (used by the trigger button rendered inline)
 *   onClose    — close handler (X button, Esc key)
 *   value      — current query
 *   onChange   — query change handler
 *   compact    — when true, the trigger button is icon-only with no label
 */
export default function HeaderSearchBar({ open, onClose, value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Focus shortly after open so the slide-in animation doesn't fight it.
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mt-2 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-xl shadow-lg px-3 py-2 flex items-center gap-2">
      <Search className="w-4 h-4 text-white/70 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search applications, names, emails…"
        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/60"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          className="text-white/60 hover:text-white text-[11px] px-1.5"
        >
          Clear
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="h-7 w-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15"
        title="Close search"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}