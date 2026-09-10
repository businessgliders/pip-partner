import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CRM } from "./crmTheme";

// Search control for the leads header. When `collapsible` is true (a status row
// crowded with many tabs) it renders as an icon-only button that expands into a
// full search field on click; otherwise the field is always visible.
export default function CrmLeadSearch({ value, onChange, collapsible }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const expanded = !collapsible || open || !!value;

  useEffect(() => {
    if (collapsible && open) inputRef.current?.focus();
  }, [collapsible, open]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Search leads"
        className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center transition-colors hover:bg-white"
        style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.sub }}
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative shrink-0 w-40 sm:w-56">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: CRM.sub }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => { if (collapsible && !value) setOpen(false); }}
        placeholder="Search"
        className="w-full h-9 pl-9 pr-8 rounded-full bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-pink-200"
        style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.ink }}
      />
      {!!value && (
        <button
          type="button"
          onClick={() => { onChange(""); if (collapsible) setOpen(false); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: CRM.sub }}
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}