import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import FddCountdownPill from "@/components/board/FddCountdownPill";
import { ChevronDown, Copy, Mail, MoreHorizontal, Archive, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName, getStatusLabel } from "@/components/board/boardConfig";
import { DetailField, detailFields } from "./crmLeadFields";
import CrmEmailPreview from "./CrmEmailPreview";
import CrmLeadActions from "./CrmLeadActions";
import { CRM, dotFor } from "./crmTheme";

export default function CrmLeadRow({
  ticket, board, columns, gridTemplate, expanded, onToggle, onEmail, onUpdate,
}) {
  const [notes, setNotes] = useState(ticket.notes || "");
  const [copied, setCopied] = useState(false);
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
                {/* Left: functions + emails + notes */}
                <div className="space-y-4">
                  {/* Lead functions — FDD, Cal.com, AI follow-up */}
                  <CrmLeadActions ticket={ticket} board={board} />

                  {/* Emails — preview of the thread, click to open the panel */}
                  <div>
                    <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-1.5" style={{ color: CRM.sub }}>
                      Emails
                    </div>
                    <CrmEmailPreview ticket={ticket} entity={board.entity} onOpen={onEmail} />
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
                      rows={4}
                      className="w-full rounded-xl p-3 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-200"
                      style={{ border: "1px solid rgba(182,118,81,0.18)", color: CRM.ink, background: "#fffdfb" }}
                    />
                  </div>
                </div>

                {/* Right: details */}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}