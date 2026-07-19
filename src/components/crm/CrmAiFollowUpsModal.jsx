import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Bot } from "lucide-react";
import { format } from "date-fns";
import { displayName, getStatusLabel } from "@/components/board/boardConfig";
import { CRM } from "./crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const TABS = [
  { key: "all", label: "All" },
  { key: "franchise", label: "Franchising" },
  { key: "instructor", label: "Instructor" },
  { key: "frontadmin", label: "Front Desk" },
];

// Modal listing every lead with an active AI follow-up, filterable by lead type.
export default function CrmAiFollowUpsModal({ leads, onOpenLead, onClose }) {
  const [tab, setTab] = useState("all");
  useLockBodyScroll();
  const visible = tab === "all" ? leads : leads.filter((t) => t._boardKey === tab);
  const countFor = (key) => (key === "all" ? leads.length : leads.filter((t) => t._boardKey === key).length);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 crm-root pip-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col pip-pop-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(182,118,81,0.12)", background: "#fdf8f4" }}>
          <span className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: CRM.ink }}>
            <Bot className="w-5 h-5" style={{ color: CRM.accent }} />
            Active AI follow-ups
          </span>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white">
            <X className="w-5 h-5" style={{ color: CRM.ink }} />
          </button>
        </div>

        {/* Lead-type tabs */}
        <div className="flex items-center gap-1 px-4 py-2.5 shrink-0 overflow-x-auto hide-scrollbar" style={{ borderBottom: "1px solid rgba(182,118,81,0.08)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
              style={tab === t.key ? { background: CRM.accentSoft, color: "#5b3038" } : { color: CRM.sub }}
            >
              {t.label} <span className="font-bold ml-0.5">{countFor(t.key)}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="p-8 text-center text-[13px]" style={{ color: CRM.sub }}>
              No active AI follow-ups here.
            </p>
          ) : (
            visible.map((t) => {
              const fu = t.follow_up || {};
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenLead(t)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#fdf8f4] transition-colors"
                  style={{ borderBottom: "1px solid rgba(182,118,81,0.08)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: CRM.ink }}>
                      {displayName(t)}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: CRM.sub }}>
                      {getStatusLabel(t._boardKey, t.status)} · {t.email}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-semibold" style={{ color: CRM.brown }}>
                      Step {fu.step || 0}/{fu.max_steps || 5}
                    </div>
                    {fu.next_send_at && (
                      <div className="text-[10px]" style={{ color: CRM.sub }}>
                        Next {format(new Date(fu.next_send_at), "MMM d, h:mma").toLowerCase()}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}