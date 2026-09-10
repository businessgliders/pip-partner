import React from "react";
import { BadgeCheck } from "lucide-react";
import { CRM } from "./crmTheme";

// Dashboard tile: total hired (hired + onboarding) across the two hiring
// boards, with per-board links that open that board's Step 2 view.
export default function CrmHiredTile({ instructor, frontadmin, onSelect }) {
  const total = instructor + frontadmin;
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-left"
      style={{ background: "var(--tile-pink-bg)", boxShadow: CRM.cardShadow }}
    >
      <BadgeCheck className="absolute -right-2 -bottom-3 w-20 h-20 pointer-events-none" style={{ color: "var(--tile-pink-fg)", opacity: 0.12 }} />
      <div className="text-[10px] tracking-[0.12em] uppercase font-semibold flex items-center gap-1.5" style={{ color: "var(--tile-pink-fg)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: CRM.accent }} />
        Hired
      </div>
      <div className="text-3xl font-bold mt-1.5" style={{ color: CRM.ink }}>{total}</div>
      <div className="flex flex-wrap gap-1.5 mt-2 relative">
        {[
          { key: "instructor", label: "Instructors", n: instructor },
          { key: "frontadmin", label: "Front Desk", n: frontadmin },
        ].map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => onSelect(b.key)}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-semibold bg-white/70 hover:bg-white transition"
            style={{ color: "var(--tile-pink-fg)" }}
          >
            {b.label} <span style={{ color: CRM.ink }}>{b.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}