import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import EmailThreadPanel from "@/components/email/EmailThreadPanel";
import { displayName } from "@/components/board/boardConfig";
import { CRM } from "./crmTheme";

// Right-hand slide-in drawer hosting the full email thread + composer for a lead.
export default function CrmEmailDrawer({ ticket, ticketType, currentUser, onClose }) {
  if (!ticket || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 crm-root">
      <div className="absolute inset-0 bg-black/30 pip-fade-in" onClick={onClose} />
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-white shadow-2xl flex flex-col pip-slide-in-right"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(182,118,81,0.12)", background: CRM.blush }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: CRM.ink }}>
              {displayName(ticket)}
            </div>
            <div className="text-[11px] truncate" style={{ color: CRM.sub }}>
              {ticket.email}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/60">
            <X className="w-5 h-5" style={{ color: CRM.ink }} />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-3">
          <EmailThreadPanel ticket={ticket} ticketType={ticketType} currentUser={currentUser} />
        </div>
      </div>
    </div>,
    document.body
  );
}