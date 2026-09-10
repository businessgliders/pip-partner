import React from "react";
import { Search, X } from "lucide-react";
import { CRM } from "./crmTheme";

// Search control for the leads header — lives on the step-switcher row, so it
// stays a full field (icon + input) at every screen size.
export default function CrmLeadSearch({ value, onChange }) {
  return (
    <div className="relative w-full max-w-[220px] sm:max-w-[240px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: CRM.sub }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="w-full h-9 pl-9 pr-8 rounded-full bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-pink-200"
        style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.ink }}
      />
      {!!value && (
        <button
          type="button"
          onClick={() => onChange("")}
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