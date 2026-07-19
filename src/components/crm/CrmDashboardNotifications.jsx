import React, { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { CRM } from "./crmTheme";

function NotifRow({ label, count, items }) {
  const [open, setOpen] = useState(false);
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
        <ul className="pb-2.5 space-y-1">
          {items.slice(0, 6).map((it, i) => (
            <li key={i} className="text-[12px] pl-1 truncate" style={{ color: CRM.sub }}>
              • {it}
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

export default function CrmDashboardNotifications({ rows }) {
  return (
    <div className="crm-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-4 h-4" style={{ color: CRM.accent }} />
        <span className="text-[14px] font-semibold" style={{ color: CRM.ink }}>Notifications</span>
      </div>
      {rows.map((r) => (
        <NotifRow key={r.label} label={r.label} count={r.count} items={r.items} />
      ))}
    </div>
  );
}