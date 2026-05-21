import React from "react";
import { StatusBadge, formatDate, fullName, locationLabel } from "../admin/SubmissionsTable";
import { formatAppNumber } from "@/lib/appNumberDisplay";

// Shared column config used by both the legacy AdminDashboard and the new
// Table view inside ApplicationBoard. Keyed by board.key.
export const TABLE_COLUMN_CONFIG = {
  franchise: {
    columns: [
      { key: "app_number", label: "Ticket #", render: (r) => <span className="font-medium text-slate-600">#{formatAppNumber(r.app_number, "franchise")}</span> },
      { key: "name",     label: "Name",     render: (r) => <span className="font-medium text-slate-800">{fullName(r)}</span> },
      { key: "email",    label: "Email" },
      { key: "location", label: "Location", render: (r) => locationLabel(r) },
      { key: "capital",  label: "Capital",  render: (r) => r.available_capital || "—" },
      { key: "scheduled_call_time", label: "Call Booked", render: (r) => r.scheduled_call_time || <span className="text-slate-400">—</span> },
      { key: "status",   label: "Status",   render: (r) => <StatusBadge status={r.status} /> },
      { key: "created_date", label: "Submitted", render: (r) => <span className="text-slate-500 text-xs">{formatDate(r.created_date)}</span> },
    ],
    detail: [
      { key: "phone", label: "Phone", get: (r) => [r.phone_country, r.phone].filter(Boolean).join(" ") },
      { key: "operation_style", label: "Operation Style" },
      { key: "ready_to_sign_nda", label: "Ready to Sign NDA" },
      { key: "why_pilates_in_pink", label: "Why Pilates in Pink" },
      { key: "business_experience", label: "Business Experience" },
      { key: "preferred_location", label: "Preferred Location" },
    ],
  },
  influencer: {
    columns: [
      { key: "full_name",       label: "Name",       render: (r) => <span className="font-medium text-slate-800">{r.full_name || "—"}</span> },
      { key: "email",           label: "Email" },
      { key: "instagram_handle", label: "Instagram" },
      { key: "follower_count",  label: "Followers" },
      { key: "content_style",   label: "Niche" },
      { key: "status",          label: "Status",     render: (r) => <StatusBadge status={r.status} /> },
      { key: "created_date",    label: "Submitted",  render: (r) => <span className="text-slate-500 text-xs">{formatDate(r.created_date)}</span> },
    ],
    detail: [
      { key: "tiktok_handle", label: "TikTok" },
      { key: "location", label: "Location" },
      { key: "why_partner", label: "Why Partner" },
    ],
  },
  instructor: {
    columns: [
      { key: "name",         label: "Name",      render: (r) => <span className="font-medium text-slate-800">{fullName(r)}</span> },
      { key: "email",        label: "Email" },
      { key: "preferred_studio", label: "Studio" },
      { key: "province",     label: "Province" },
      { key: "status",       label: "Status",    render: (r) => <StatusBadge status={r.status} /> },
      { key: "created_date", label: "Submitted", render: (r) => <span className="text-slate-500 text-xs">{formatDate(r.created_date)}</span> },
    ],
    detail: [
      { key: "postal_code", label: "Postal Code" },
      { key: "qualifications", label: "Qualifications", get: (r) => (r.qualifications || []).join(", ") },
      { key: "message", label: "Message" },
    ],
  },
  frontadmin: {
    columns: [
      { key: "name",         label: "Name",      render: (r) => <span className="font-medium text-slate-800">{fullName(r)}</span> },
      { key: "email",        label: "Email" },
      { key: "preferred_studio", label: "Studio" },
      { key: "province",     label: "Province" },
      { key: "status",       label: "Status",    render: (r) => <StatusBadge status={r.status} /> },
      { key: "created_date", label: "Submitted", render: (r) => <span className="text-slate-500 text-xs">{formatDate(r.created_date)}</span> },
    ],
    detail: [
      { key: "postal_code", label: "Postal Code" },
      { key: "message", label: "Message" },
    ],
  },
};

export function downloadCsv(rows, name) {
  if (!rows.length) return;
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}