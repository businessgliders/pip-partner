import React, { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  scheduled: "bg-purple-100 text-purple-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
  pending: "bg-blue-100 text-blue-700",
  reviewed: "bg-amber-100 text-amber-700",
  invited: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
};

function StatusBadge({ status }) {
  if (!status) return null;
  const cls = STATUS_COLORS[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">{label}</span>
      <span className="text-sm text-slate-700 break-words">{String(value)}</span>
    </div>
  );
}

export default function SubmissionsTable({ rows, columns, detailFields, accentColor = "#0f172a", accentBg = "#f8fafc" }) {
  const [expanded, setExpanded] = useState(null);

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center text-slate-400 text-sm" style={{ borderColor: `${accentColor}40` }}>
        No submissions yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: `${accentColor}40`, boxShadow: `0 1px 3px ${accentColor}15` }}>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}60 100%)` }} />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: accentBg, borderBottom: `1px solid ${accentColor}30` }}>
            <tr>
              <th className="w-8"></th>
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOpen = expanded === row.id;
              return (
                <React.Fragment key={row.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                    className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-2">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                        {col.render ? col.render(row) : (row[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/50">
                      <td></td>
                      <td colSpan={columns.length} className="px-4 py-5">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          {detailFields.map((f) => (
                            <Field key={f.key} label={f.label} value={typeof f.get === "function" ? f.get(row) : row[f.key]} />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                          {row.email && (
                            <a
                              href={`mailto:${row.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                            >
                              <Mail className="w-3.5 h-3.5" /> Email
                            </a>
                          )}
                          {row.phone && (
                            <a
                              href={`tel:${row.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                          )}
                          {row.resume_url && (
                            <a
                              href={row.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Resume
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { StatusBadge, Field };

export function formatDate(d) {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; }
}

export function fullName(r) {
  return `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.full_name || "—";
}

export function locationLabel(r) {
  const parts = [r.preferred_location || r.location || r.city, r.province].filter(Boolean);
  return parts.length ? (
    <span className="inline-flex items-center gap-1 text-slate-600">
      <MapPin className="w-3 h-3" /> {parts.join(" · ")}
    </span>
  ) : "—";
}