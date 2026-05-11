import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Building2, Sparkles, Briefcase, ClipboardList, Search, Download, RefreshCw } from "lucide-react";
import SubmissionsTable, { StatusBadge, formatDate, fullName, locationLabel } from "../components/admin/SubmissionsTable";
import SubmissionDetailModal from "../components/admin/SubmissionDetailModal";
import BackToHome from "../components/BackToHome";

const TABS = [
  { key: "franchise",  label: "Franchise",  icon: Building2,     entity: "FranchiseInquiry",      color: "#b67651", bg: "#fbe0e2", soft: "#f6eee7" },
  { key: "influencer", label: "Influencer", icon: Sparkles,      entity: "InfluencerApplication", color: "#f1889b", bg: "#fce8ee", soft: "#fbe0e2" },
  { key: "instructor", label: "Instructor", icon: Briefcase,     entity: "InstructorApplication", color: "#c4896b", bg: "#f6eee7", soft: "#faf3ec" },
  { key: "frontadmin", label: "Front Desk", icon: ClipboardList, entity: "FrontAdminApplication", color: "#d4a088", bg: "#faf3ec", soft: "#f6eee7" },
];

const COLUMN_CONFIG = {
  franchise: {
    columns: [
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

function downloadCsv(rows, name) {
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("franchise");
  const [data, setData] = useState({ franchise: [], influencer: [], instructor: [], frontadmin: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const [fr, inf, ins, fa] = await Promise.all([
      base44.entities.FranchiseInquiry.list("-created_date", 500),
      base44.entities.InfluencerApplication.list("-created_date", 500),
      base44.entities.InstructorApplication.list("-created_date", 500),
      base44.entities.FrontAdminApplication.list("-created_date", 500),
    ]);
    setData({ franchise: fr, influencer: inf, instructor: ins, frontadmin: fa });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const counts = useMemo(() => ({
    franchise: data.franchise.length,
    influencer: data.influencer.length,
    instructor: data.instructor.length,
    frontadmin: data.frontadmin.length,
  }), [data]);

  const totalAll = counts.franchise + counts.influencer + counts.instructor + counts.frontadmin;

  const filteredRows = useMemo(() => {
    const rows = data[activeTab] || [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }, [data, activeTab, search]);

  const config = COLUMN_CONFIG[activeTab];
  const activeMeta = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-screen bg-slate-50">
      <BackToHome to="/AdminDashboard" label="Admin" />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-[11px] tracking-[0.25em] text-slate-500 font-semibold mb-2">ADMIN DASHBOARD</p>
          <h1 className="text-3xl font-light text-slate-900">All Submissions</h1>
          <p className="text-slate-500 text-sm mt-1">{totalAll} total submissions across all programs</p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="text-left p-4 rounded-xl border transition-all"
                style={{
                  background: isActive ? `linear-gradient(135deg, #ffffff 0%, ${t.bg} 100%)` : "rgba(255,255,255,0.6)",
                  borderColor: isActive ? t.color : "#e2e8f0",
                  borderWidth: isActive ? 2 : 1,
                  boxShadow: isActive ? `0 4px 12px ${t.color}25` : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: `${t.color}25` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: isActive ? t.color : "#475569" }}>{t.label}</span>
                </div>
                <div className="text-2xl font-light" style={{ color: isActive ? t.color : "#0f172a" }}>{counts[t.key]}</div>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={`Search ${activeMeta?.label.toLowerCase()} submissions...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => downloadCsv(filteredRows, activeTab)}
            disabled={!filteredRows.length}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: activeMeta?.color || "#0f172a" }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <SubmissionsTable
            rows={filteredRows}
            columns={config.columns}
            detailFields={config.detail}
            accentColor={activeMeta?.color}
            accentBg={activeMeta?.bg}
            onRowClick={(row) => setSelectedRow(row)}
          />
        )}
      </div>

      <SubmissionDetailModal
        open={!!selectedRow}
        onOpenChange={(v) => { if (!v) setSelectedRow(null); }}
        row={selectedRow}
        tabKey={activeTab}
        detailFields={config.detail}
        accentColor={activeMeta?.color}
      />
    </div>
  );
}