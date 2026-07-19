import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, ArrowUpDown } from "lucide-react";
import { BOARD_TYPES, getStatusLabel, displayName } from "@/components/board/boardConfig";
import CrmLeadRow from "./CrmLeadRow";
import CrmEmailDrawer from "./CrmEmailDrawer";
import { CRM } from "./crmTheme";

// Column definitions per board (between Name and Inquiry date).
const COLUMNS = {
  franchise: [
    { key: "location", label: "Location", get: (t) => t.preferred_location || t.province || t.city },
    { key: "capital", label: "Capital", get: (t) => t.available_capital || t.investment_readiness },
  ],
  instructor: [
    { key: "studio", label: "Preferred Studio", get: (t) => t.preferred_studio },
    { key: "province", label: "Province", get: (t) => t.province },
  ],
  frontadmin: [
    { key: "studio", label: "Preferred Studio", get: (t) => t.preferred_studio },
    { key: "province", label: "Province", get: (t) => t.province },
  ],
};

export default function CrmLeads({ source, currentUser }) {
  const queryClient = useQueryClient();
  const board = BOARD_TYPES.find((b) => b.key === source) || BOARD_TYPES[0];
  const columns = COLUMNS[board.key] || [];
  // Name | cols (md+) | Inquiry date (sm+) | Status
  const gridTemplate = `minmax(0,1.4fr) ${columns.map(() => "minmax(0,1fr)").join(" ")} minmax(0,0.9fr) minmax(0,1fr)`;
  const gridTemplateMobile = "minmax(0,1.4fr) minmax(0,1fr)";

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "created", dir: "desc" });
  const [expandedId, setExpandedId] = useState(null);
  const [emailTicket, setEmailTicket] = useState(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["crm-leads", board.entity],
    queryFn: () => base44.entities[board.entity].list("-created_date", 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[board.entity].update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-leads", board.entity] }),
  });
  const handleUpdate = (id, data) => updateMutation.mutate({ id, data });

  const active = useMemo(() => tickets.filter((t) => !t.archived), [tickets]);

  const counts = useMemo(() => {
    const c = { all: active.length };
    board.statuses.forEach((s) => { c[s] = 0; });
    active.forEach((t) => { if (c[t.status] !== undefined) c[t.status] += 1; });
    return c;
  }, [active, board.statuses]);

  const visible = useMemo(() => {
    let list = tab === "all" ? active : active.filter((t) => t.status === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [displayName(t), t.email, t.preferred_location, t.province, t.city, t.preferred_studio]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      let cmp;
      if (sort.key === "name") {
        cmp = displayName(a).localeCompare(displayName(b));
      } else if (sort.key === "status") {
        cmp = getStatusLabel(board.key, a.status || "").localeCompare(getStatusLabel(board.key, b.status || ""));
      } else {
        cmp = new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime();
      }
      return sort.dir === "desc" ? -cmp : cmp;
    });
  }, [active, tab, search, sort]);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "created" ? "desc" : "asc" }));

  // Status filter tabs: hide zero-count statuses; for franchise, insert a
  // separator between step-1 and step-2 statuses.
  const tabItems = useMemo(() => {
    const nonEmpty = board.statuses.filter((s) => (counts[s] ?? 0) > 0);
    if (board.stepOne) {
      const one = board.stepOne.filter((s) => nonEmpty.includes(s));
      const two = (board.stepTwo || []).filter((s) => nonEmpty.includes(s));
      const rest = nonEmpty.filter((s) => !one.includes(s) && !two.includes(s));
      const items = ["all", ...one];
      if (two.length) items.push("__sep__", ...two);
      if (rest.length) items.push("__sep__", ...rest);
      return items;
    }
    return ["all", ...nonEmpty];
  }, [board, counts]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar flex-1 min-w-0">
          {tabItems.map((s, idx) => {
            if (s === "__sep__") {
              return (
                <span
                  key={`sep-${idx}`}
                  className="h-4 w-px shrink-0 self-center"
                  style={{ background: "rgba(182,118,81,0.3)" }}
                />
              );
            }
            const isActive = tab === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setTab(s); setExpandedId(null); }}
                className="flex items-center gap-1.5 pb-1.5 shrink-0 text-[13px] transition-colors"
                style={{
                  color: isActive ? CRM.ink : CRM.sub,
                  fontWeight: isActive ? 600 : 500,
                  borderBottom: isActive ? `2px solid ${CRM.accent}` : "2px solid transparent",
                }}
              >
                {s === "all" ? "All" : getStatusLabel(board.key, s)}
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(182,118,81,0.08)", color: CRM.sub }}
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative shrink-0 sm:w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: CRM.sub }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-9 pl-9 pr-3 rounded-full bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-pink-200"
            style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.ink }}
          />
        </div>
      </div>

      {/* Column headers */}
      <div
        className="hidden md:grid items-center gap-3 px-5 pb-2 text-[11px] font-medium"
        style={{ gridTemplateColumns: gridTemplate, color: CRM.sub }}
      >
        <button
          type="button"
          onClick={() => toggleSort("name")}
          className="flex items-center gap-1 text-left"
          style={{ color: sort.key === "name" ? CRM.ink : CRM.sub, fontWeight: sort.key === "name" ? 600 : 500 }}
        >
          Name <ArrowUpDown className="w-3 h-3" />
        </button>
        {columns.map((c) => <span key={c.key}>{c.label}</span>)}
        <button
          type="button"
          onClick={() => toggleSort("created")}
          className="flex items-center gap-1"
          style={{ color: sort.key === "created" ? CRM.ink : CRM.sub, fontWeight: sort.key === "created" ? 600 : 500 }}
        >
          Inquiry date <ArrowUpDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => toggleSort("status")}
          className="flex items-center justify-end gap-1 text-right pr-6"
          style={{ color: sort.key === "status" ? CRM.ink : CRM.sub, fontWeight: sort.key === "status" ? 600 : 500 }}
        >
          Status <ArrowUpDown className="w-3 h-3" />
        </button>
      </div>

      {/* Rows */}
      {isLoading ? (
        <div className="crm-card p-10 text-center text-sm" style={{ color: CRM.sub }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div className="crm-card p-10 text-center text-sm" style={{ color: CRM.sub }}>
          No {board.label.toLowerCase()} leads match.
        </div>
      ) : (
        <div className="space-y-2.5 pb-10">
          {visible.map((t) => (
            <CrmLeadRow
              key={t.id}
              ticket={t}
              board={board}
              columns={columns}
              gridTemplate={typeof window !== "undefined" && window.innerWidth < 640 ? gridTemplateMobile : gridTemplate}
              expanded={expandedId === t.id}
              onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onEmail={() => setEmailTicket(t)}
              onUpdate={handleUpdate}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {emailTicket && (
        <CrmEmailDrawer
          ticket={emailTicket}
          ticketType={board.entity}
          currentUser={currentUser}
          onClose={() => setEmailTicket(null)}
        />
      )}
    </div>
  );
}