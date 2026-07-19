import React from "react";
import { CRM } from "./crmTheme";

export function DetailField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5" style={{ color: CRM.sub }}>
        {label}
      </div>
      <div className="text-[13px]" style={{ color: CRM.ink }}>{value}</div>
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