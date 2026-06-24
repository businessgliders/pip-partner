import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, ChevronUp, ArrowUpDown, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  discovery: "bg-amber-100 text-amber-700",
  no_show: "bg-rose-100 text-rose-700",
  nda: "bg-cyan-100 text-cyan-700",
  fdd: "bg-violet-100 text-violet-700",
  signed: "bg-fuchsia-100 text-fuchsia-700",
  scheduled: "bg-purple-100 text-purple-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
  ghosted: "bg-violet-100 text-violet-700",
  pending: "bg-blue-100 text-blue-700",
  reviewed: "bg-amber-100 text-amber-700",
  invited: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
};

// Centralized status → display label. Renames "declined" → "Not Interested"
// across all boards (franchise/instructor/frontadmin/influencer) without
// changing the underlying status key.
const STATUS_LABELS = {
  new: "New",
  discovery: "Discovery",
  no_show: "No Show",
  nda: "NDA",
  fdd: "FDD",
  signed: "Signed",
  site_selection: "Site Selection",
  lease: "Lease",
  build_out: "Build-Out",
  training: "Training",
  closed: "Not Interested",
  ghosted: "Ghosted",
  scheduled: "Discovery",
  discussion: "Discovery",
  qualified: "FDD",
  contacted: "Discovery",
  pending: "Pending",
  reviewed: "Reviewed",
  invited: "Invited",
  approved: "Approved",
  declined: "Not Interested",
};

function StatusBadge({ status }) {
  if (!status) return null;
  const cls = STATUS_COLORS[status] || "bg-slate-100 text-slate-600";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {label}
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

function getSortValue(col, row) {
  if (typeof col.sortValue === "function") return col.sortValue(row);
  return row[col.key];
}

function compareValues(a, b) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;   // empties always sort last
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  // Try date comparison
  const ad = Date.parse(a);
  const bd = Date.parse(b);
  if (!isNaN(ad) && !isNaN(bd) && typeof a === "string" && typeof b === "string") {
    return ad - bd;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export default function SubmissionsTable({ rows, columns, detailFields, accentColor = "#0f172a", accentBg = "#f8fafc", onRowClick, storageKey }) {
  const [expanded, setExpanded] = useState(null);
  const sortStorageKey = storageKey ? `submissions-table-sort:${storageKey}` : null;

  const [sort, setSort] = useState(() => {
    if (!sortStorageKey || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(sortStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (!sortStorageKey || typeof window === "undefined") return;
    try {
      if (sort) window.localStorage.setItem(sortStorageKey, JSON.stringify(sort));
      else window.localStorage.removeItem(sortStorageKey);
    } catch { /* ignore */ }
  }, [sort, sortStorageKey]);

  const handleHeaderClick = (col) => {
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null; // third click clears
    });
  };

  const sortedRows = useMemo(() => {
    if (!sort || !rows) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const out = [...rows].sort((a, b) => compareValues(getSortValue(col, a), getSortValue(col, b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, sort, columns]);

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
              {columns.map((col) => {
                const isActive = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase cursor-pointer select-none hover:bg-black/5 transition-colors"
                    style={{ color: accentColor }}
                    title={isActive ? (sort.dir === "asc" ? "Sorted A→Z (click for Z→A)" : "Sorted Z→A (click to clear)") : "Click to sort A→Z"}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isActive ? (
                        sort.dir === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isOpen = expanded === row.id;
              return (
                <React.Fragment key={row.id}>
                  <tr
                    onClick={() => {
                      if (onRowClick) onRowClick(row);
                      else setExpanded(isOpen ? null : row.id);
                    }}
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