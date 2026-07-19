import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail } from "lucide-react";
import { CRM } from "./crmTheme";

// Compact preview of the most recent emails on a ticket. Clicking it opens
// the full email panel (via onOpen).
export default function CrmEmailPreview({ ticket, entity, onOpen }) {
  const { data: previewMsgs = [] } = useQuery({
    queryKey: ["crm-lead-preview", ticket.id],
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { ticket_id: ticket.id, ticket_type: entity },
        "-created_date",
        4
      ),
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full text-left rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(182,118,81,0.15)", background: "#fffdfb" }}
    >
      <div className="p-3 space-y-2 max-h-32 overflow-hidden">
        {previewMsgs.length === 0 ? (
          <div className="text-[12px]" style={{ color: CRM.sub }}>
            Welcome email sent — open to view the full thread and reply.
          </div>
        ) : (
          previewMsgs.map((m) => (
            <div key={m.id} className="flex items-start gap-2 min-w-0">
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                style={
                  m.direction === "inbound"
                    ? { background: CRM.blush, color: "#a34a5c" }
                    : { background: "rgba(182,118,81,0.10)", color: CRM.brown }
                }
              >
                {m.direction === "inbound" ? "Them" : "You"}
              </span>
              <span className="flex-1 min-w-0 overflow-hidden">
                <span className="block text-[12px] font-medium truncate" style={{ color: CRM.ink }}>
                  {m.subject || "(no subject)"}
                </span>
                <span className="block text-[11px] truncate" style={{ color: CRM.sub }}>
                  {m.snippet || (m.body_text || "").slice(0, 120)}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
      {/* Gradient wash fading the preview out */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(255,253,251,0), #fffdfb 85%)" }}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[2px]">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold shadow-sm"
          style={{ background: CRM.accentSoft, color: "#5b3038" }}
        >
          <Mail className="w-3.5 h-3.5" /> Open email panel
        </span>
      </div>
    </button>
  );
}