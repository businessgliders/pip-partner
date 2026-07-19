import React from "react";
import { CRM, dotFor } from "./crmTheme";
import { displayName, getStatusLabel } from "@/components/board/boardConfig";
import { FileSignature } from "lucide-react";

// Left panel of the Contracts hub: contract-eligible leads for the active group.
export default function CrmContractLeadList({ leads, boardKey, selectedId, onSelect, contractCounts }) {
  if (!leads.length) {
    return (
      <div className="crm-card p-8 text-center">
        <FileSignature className="w-8 h-8 mx-auto mb-3" style={{ color: CRM.accentSoft }} />
        <p className="text-sm font-medium" style={{ color: CRM.ink }}>No eligible leads</p>
        <p className="text-xs mt-1" style={{ color: CRM.sub }}>
          Leads appear here once they reach a contract stage.
        </p>
      </div>
    );
  }

  return (
    <div className="crm-card overflow-hidden divide-y" style={{ borderColor: "rgba(182,118,81,0.08)" }}>
      {leads.map((t) => {
        const active = selectedId === t.id;
        const count = contractCounts?.[t.id] || 0;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
            style={{ background: active ? CRM.blush : "transparent" }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotFor(t.status) }} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate" style={{ color: CRM.ink }}>
                {displayName(t)}
              </span>
              <span className="block text-[11px]" style={{ color: CRM.sub }}>
                {getStatusLabel(boardKey, t.status)}
              </span>
            </span>
            {count > 0 && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: CRM.blush, color: CRM.brown }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}