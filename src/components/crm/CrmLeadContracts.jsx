import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, ArrowUpRight } from "lucide-react";
import { CRM } from "./crmTheme";

const STATUS_STYLES = {
  draft: { bg: "#f1f5f9", fg: "#64748b" },
  sent: { bg: "#fef3c7", fg: "#b45309" },
  signed: { bg: "#d1fae5", fg: "#047857" },
};

// Contracts linked to a lead, shown as compact attachment chips with a Drive
// thumbnail. "More" jumps to the Contracts page.
export default function CrmLeadContracts({ ticket }) {
  const navigate = useNavigate();
  const { data: contracts = [] } = useQuery({
    queryKey: ["crm-lead-contracts", ticket.id],
    queryFn: () => base44.entities.Contract.filter({ ticket_id: ticket.id }),
  });

  if (!contracts.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] tracking-[0.15em] uppercase font-semibold" style={{ color: CRM.sub }}>
          Contracts
        </div>
        <button
          type="button"
          onClick={() => navigate("/ApplicationBoard?page=financials")}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold hover:opacity-70"
          style={{ color: CRM.brown }}
        >
          More <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-1.5">
        {contracts.map((c) => {
          const s = STATUS_STYLES[c.status] || STATUS_STYLES.draft;
          return (
            <a
              key={c.id}
              href={c.drive_file_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-[#faf1ea] transition-colors"
              style={{ border: "1px solid rgba(182,118,81,0.12)", background: "#fffdfb" }}
            >
              <span
                className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: CRM.blush }}
              >
                <FileText className="w-4 h-4" style={{ color: CRM.brown }} />
                {c.drive_file_id && (
                  <img
                    src={`https://drive.google.com/thumbnail?id=${c.drive_file_id}&sz=w80`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-medium truncate" style={{ color: CRM.ink }}>
                  {c.file_name || "Contract"}
                </span>
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0"
                style={{ background: s.bg, color: s.fg }}
              >
                {c.status || "draft"}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}