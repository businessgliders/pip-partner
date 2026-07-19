import React, { useState } from "react";
import { CRM } from "./crmTheme";

const CUTOFF = 160;

export function DetailField({ label, value }) {
  const [open, setOpen] = useState(false);
  if (!value) return null;
  const text = String(value);
  const long = text.length > CUTOFF;
  return (
    <div className="min-w-0">
      <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5" style={{ color: CRM.sub }}>
        {label}
      </div>
      <div className="text-[13px] break-words" style={{ color: CRM.ink }}>
        {long && !open ? `${text.slice(0, CUTOFF).trimEnd()}…` : text}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[11px] font-semibold underline mt-0.5"
          style={{ color: CRM.brown }}
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// Extra detail fields shown in expanded panels, per board type.
export function detailFields(t, boardKey) {
  if (boardKey === "franchise") {
    return [
      ["Phone", [t.phone_country, t.phone].filter(Boolean).join(" ")],
      ["Available Capital", t.available_capital || t.investment_readiness],
      ["Operation Style", t.operation_style],
      ["Ready to Sign NDA", t.ready_to_sign_nda],
      ["Why Pilates in Pink", t.why_pilates_in_pink],
      ["Business Experience", t.business_experience],
      ["Discovery Call", t.scheduled_call_time],
    ];
  }
  return [
    ["Preferred Studio", t.preferred_studio],
    ["Postal Code", t.postal_code],
    ["Province", t.province],
    ["Qualifications", Array.isArray(t.qualifications) ? t.qualifications.join(", ") : null],
    ["Message", t.message],
  ];
}