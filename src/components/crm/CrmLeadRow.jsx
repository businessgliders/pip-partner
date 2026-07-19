import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import FddCountdownPill from "@/components/board/FddCountdownPill";
import { ChevronDown, Copy, Mail, MoreHorizontal, Archive, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName, getStatusLabel } from "@/components/board/boardConfig";
import { CRM, dotFor } from "./crmTheme";

function DetailField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5" style={{ color: CRM.sub }}>
        {label}
      </div>
      <div className="text-[13px]" style={{ color: CRM.ink }}>{value}</div>
    </div>
  );
}

// Extra detail fields shown in the expanded panel, per board type.
function detailFields(t, boardKey) {
  if (boardKey === "franchise") {
    return [
      ["Phone", [t.phone_country, t.phone].filter(Boolean).join(" ")],
      ["Available Capital", t.available_capital || t.investment_readiness],
      ["Operation Style", t.operation_style],
      ["Ready to Sign NDA", t.ready_to_sign_nda],
      ["Why Pilates in Pink", t.why_pilates_in_pink],
      ["Business Experience", t.business_experience],
      ["Discovery Call", t.scheduled_call_time],
    ];
  }
  return [
    ["Preferred Studio", t.preferred_studio],
    ["Postal Code", t.postal_code],
    ["Province", t.province],
    ["Qualifications", Array.isArray(t.qualifications) ? t.qualifications.join(", ") : null],
    ["Message", t.message],
  ];
}

export default function CrmLeadRow({
  ticket, board, columns, gridTemplate, expanded, onToggle, onEmail, onUpdate,
}) {
  const [notes, setNotes] = useState(ticket.notes || "");
  const [copied, setCopied] = useState(false);
  // Recent messages for the inline email preview (only fetched when expanded).
  const { data: previewMsgs = [] } = useQuery({
    queryKey: ["crm-lead-preview", ticket.id],
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { ticket_id: ticket.id, ticket_type: board.entity },
        "-created_date",
        4
      ),
    enabled: expanded,
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const name = displayName(ticket);
  const inquiryDate = ticket.created_date ? format(new Date(ticket.created_date), "MMM d, yyyy") : "—";

  const copyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(ticket.email || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const saveNotes = () => {
    if (notes !== (ticket.notes || "")) onUpdate(ticket.id, { notes });
  };

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-shadow"
      style={{
        boxShadow: expanded ? "0 6px 24px rgba(182,118,81,0.16)" : CRM.cardShadow,
        border: CRM.cardBorder,
      }}
    >
      {/* Collapsed row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full grid items-center gap-3 px-5 py-4 text-left hover:bg-[#fdf8f4] transition-colors"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-semibold truncate" style={{ color: CRM.ink }}>{name}</span>
          {board.key === "franchise" && (ticket.status === "fdd" || ticket.fdd_countdown_started_at) && (
            <FddCountdownPill ticket={ticket} />
          )}
        </span>
        {columns.map((c) => (
          <span key={c.key} className="hidden md:block text-[13px] truncate" style={{ color: "#5c4a3f" }}>
            {c.get(ticket) || "—"}
          </span>
        ))}
        <span className="hidden sm:block text-[13px]" style={{ color: "#5c4a3f" }}>{inquiryDate}</span>
        <span className="flex items-center justify-end gap-1.5">
          {/* Status pill + dropdown */}
          <DropdownMenu open={statusOpen} onOpenChange={setStatusOpen}>
            <DropdownMenuTrigger asChild>
              <span
                role="button"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium hover:bg-[#faf1ea] transition-colors"
                style={{ color: CRM.ink, border: "1px solid rgba(182,118,81,0.15)" }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotFor(ticket.status) }} />
                <span className="max-w-[90px] truncate">{getStatusLabel(board.key, ticket.status)}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="crm-root">
              {board.statuses.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s !== ticket.status) onUpdate(ticket.id, { status: s });
                  }}
                  className="text-[12px] gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: dotFor(s) }} />
                  {getStatusLabel(board.key, s)}
                  {s === ticket.status && <Check className="w-3 h-3 ml-auto opacity-60" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            style={{ color: CRM.sub }}
          />
        </span>
      </button>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1" style={{ borderTop: "1px solid rgba(182,118,81,0.08)" }}>
              {/* Email + actions row */}
              <div className="flex items-center justify-between pt-3 mb-4">
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70"
                  style={{ color: CRM.brown }}
                >
                  {ticket.email}
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#faf1ea]"
                      style={{ border: "1px solid rgba(182,118,81,0.15)" }}
                    >
                      <MoreHorizontal className="w-4 h-4" style={{ color: CRM.sub }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="crm-root">
                    <DropdownMenuItem
                      className="text-[12px] gap-2"
                      onClick={() => onUpdate(ticket.id, { archived: true })}
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
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

              {/* Email thread preview — click to open the full email panel */}
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(182,118,81,0.08)" }}>
                <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-1.5" style={{ color: CRM.sub }}>
                  Emails
                </div>
                <button
                  type="button"
                  onClick={onEmail}
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
                        <div key={m.id} className="flex items-start gap-2">
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
                          <span className="min-w-0">
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}