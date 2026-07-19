import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { X, Copy, Check } from "lucide-react";
import { displayName, getStatusLabel } from "@/components/board/boardConfig";
import { DetailField, detailFields } from "./crmLeadFields";
import CrmEmailPreview from "./CrmEmailPreview";
import CrmEmailDrawer from "./CrmEmailDrawer";
import { CRM, dotFor } from "./crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

// Right-hand slide-in drawer showing a lead's full details vertically —
// the same content as an expanded lead row (details, notes, email preview).
export default function CrmLeadDetailDrawer({ ticket, board, currentUser, onClose }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(ticket?.notes || "");
  const [copied, setCopied] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  useLockBodyScroll();

  if (!ticket || !board || typeof document === "undefined") return null;

  const copyEmail = () => {
    navigator.clipboard?.writeText(ticket.email || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const saveNotes = async () => {
    if (notes === (ticket.notes || "")) return;
    await base44.entities[board.entity].update(ticket.id, { notes });
    queryClient.invalidateQueries({ queryKey: ["crm-leads", board.entity] });
    queryClient.invalidateQueries({ queryKey: ["crm-bookings-tickets"] });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 crm-root">
      <div className="absolute inset-0 bg-black/30 pip-fade-in" onClick={onClose} />
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-2xl flex flex-col pip-slide-in-right"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(182,118,81,0.12)", background: CRM.blush }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate" style={{ color: CRM.ink }}>
                {displayName(ticket)}
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-white/70"
                style={{ color: CRM.ink }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotFor(ticket.status) }} />
                {getStatusLabel(board.key, ticket.status)}
              </span>
            </div>
            <div className="text-[11px] truncate" style={{ color: CRM.sub }}>
              {board.label} lead · {ticket.created_date ? format(new Date(ticket.created_date), "MMM d, yyyy") : ""}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/60 shrink-0">
            <X className="w-5 h-5" style={{ color: CRM.ink }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
          {/* Email address */}
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70"
            style={{ color: CRM.brown }}
          >
            {ticket.email}
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
          </button>

          {/* Details */}
          <div className="space-y-3">
            {detailFields(ticket, board.key).map(([label, value]) => (
              <DetailField key={label} label={label} value={value} />
            ))}
            {ticket.resume_url && (
              <div>
                <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5" style={{ color: CRM.sub }}>
                  Resume
                </div>
                <a
                  href={ticket.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] underline"
                  style={{ color: CRM.brown }}
                >
                  View resume
                </a>
              </div>
            )}
          </div>

          {/* Emails */}
          <div>
            <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-1.5" style={{ color: CRM.sub }}>
              Emails
            </div>
            <CrmEmailPreview ticket={ticket} entity={board.entity} onOpen={() => setEmailOpen(true)} />
          </div>

          {/* Notes */}
          <div>
            <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-1.5" style={{ color: CRM.sub }}>
              Notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Type here…"
              rows={5}
              className="w-full rounded-xl p-3 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-200"
              style={{ border: "1px solid rgba(182,118,81,0.18)", color: CRM.ink, background: "#fffdfb" }}
            />
          </div>
        </div>
      </div>

      {emailOpen && (
        <CrmEmailDrawer
          ticket={ticket}
          ticketType={board.entity}
          currentUser={currentUser}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}