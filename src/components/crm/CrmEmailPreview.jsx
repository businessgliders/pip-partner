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
      style={{ border: "1px solid rgba(182,118,81,0.15)", background: "var(--crm-page-bg)" }}
    >
      <div className="p-3 space-y-1.5 max-h-36 overflow-hidden">
        {previewMsgs.length === 0 ? (
          <div className="text-[12px]" style={{ color: CRM.sub }}>
            Welcome email sent — open to view the full thread and reply.
          </div>
        ) : (
          [...previewMsgs].reverse().map((m) => {
            const inbound = m.direction === "inbound";
            return (
              <div key={m.id} className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[78%] px-2.5 py-1.5 shadow-sm ${
                    inbound
                      ? "rounded-2xl rounded-bl-md"
                      : "rounded-2xl rounded-br-md"
                  }`}
                  style={
                    inbound
                      ? { background: "var(--crm-card-bg)", border: "1px solid rgba(182,118,81,0.15)" }
                      : { background: CRM.accentSoft }
                  }
                >
                  <span
                    className="block text-[10px] leading-snug line-clamp-2"
                    style={{ color: inbound ? "var(--crm-ink)" : "var(--tile-rose-fg)" }}
                  >
                    {m.snippet || (m.body_text || "").slice(0, 140) || m.subject || "(no content)"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Gradient wash fading the preview out */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, var(--crm-page-bg) 85%)" }}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[2px]">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold shadow-sm"
          style={{ background: CRM.accentSoft, color: "var(--tile-rose-fg)" }}
        >
          <Mail className="w-3.5 h-3.5" /> Open email panel
        </span>
      </div>
    </button>
  );
}