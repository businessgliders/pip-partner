import React, { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { CRM } from "./crmTheme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "franchise", label: "Franchise" },
  { key: "hiring", label: "Hiring" },
];

function NotifRow({ label, items, defaultOpen, onOpenItem }) {
  const [open, setOpen] = useState(defaultOpen && items.length > 0);
  const count = items.length;
  return (
    <div style={{ borderBottom: "1px solid rgba(182,118,81,0.08)" }}>
      <button
        type="button"
        onClick={() => count > 0 && setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: CRM.ink }}>
          {label}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: count > 0 ? CRM.blush : "rgba(182,118,81,0.08)",
              color: count > 0 ? CRM.accent : CRM.sub,
            }}
          >
            {count}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: CRM.sub, opacity: count > 0 ? 1 : 0.3 }}
        />
      </button>
      {open && (
        <ul className="pb-2.5 space-y-0.5">
          {items.slice(0, 6).map((it, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={!it.ticket}
                onClick={() => it.ticket && onOpenItem(it.ticket)}
                className={`w-full text-left text-[12px] px-1.5 py-1 rounded-md truncate ${
                  it.ticket ? "hover:bg-[#fdf8f4] underline decoration-dotted underline-offset-2" : ""
                }`}
                style={{ color: it.ticket ? CRM.brown : CRM.sub }}
              >
                • {it.label}
              </button>
            </li>
          ))}
          {items.length > 6 && (
            <li className="text-[11px] pl-1 italic" style={{ color: CRM.sub }}>
              +{items.length - 6} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function CrmDashboardNotifications({ rows, onOpenItem }) {
  const [filter, setFilter] = useState("all");
  const filtered = rows.map((r) => ({
    ...r,
    items: filter === "all" ? r.items : r.items.filter((it) => it.group === filter),
  }));
  const firstWithItems = filtered.findIndex((r) => r.items.length > 0);

  return (
    <div className="crm-card p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: CRM.accent }} />
          <span className="text-[14px] font-semibold" style={{ color: CRM.ink }}>Notifications</span>
        </div>
        <div
          className="inline-flex items-center gap-0.5 p-0.5 rounded-full"
          style={{ border: "1px solid rgba(182,118,81,0.15)" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all"
              style={filter === f.key ? { background: CRM.accentSoft, color: "#5b3038" } : { color: CRM.sub }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.map((r, i) => (
        <NotifRow
          key={`${filter}-${r.label}`}
          label={r.label}
          items={r.items}
          defaultOpen={i === firstWithItems}
          onOpenItem={onOpenItem}
        />
      ))}
    </div>
  );
}