import React, { useState } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { CRM } from "./crmTheme";

// Attributed notes thread: each note records who wrote it and when.
export default function CrmLeadNotes({ ticket, currentUser, onUpdate }) {
  const [draft, setDraft] = useState("");
  const notes = Array.isArray(ticket.internal_notes) ? ticket.internal_notes : [];

  const addNote = () => {
    const comment = draft.trim();
    if (!comment) return;
    onUpdate(ticket.id, {
      internal_notes: [
        ...notes,
        {
          user_email: currentUser?.email || "",
          user_name: currentUser?.full_name || currentUser?.email || "Staff",
          comment,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    setDraft("");
  };

  return (
    <div>
      <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-1.5" style={{ color: CRM.sub }}>
        Notes
      </div>
      <div className="space-y-1.5">
        {ticket.notes && (
          <div className="rounded-xl p-2.5" style={{ border: "1px solid rgba(182,118,81,0.12)", background: "#fffdfb" }}>
            <div className="text-[10px] font-semibold mb-0.5" style={{ color: CRM.sub }}>Earlier note</div>
            <p className="text-[12px] whitespace-pre-wrap" style={{ color: CRM.ink }}>{ticket.notes}</p>
          </div>
        )}
        {notes.map((n, i) => (
          <div key={i} className="rounded-xl p-2.5" style={{ border: "1px solid rgba(182,118,81,0.12)", background: "#fffdfb" }}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[11px] font-semibold truncate" style={{ color: CRM.brown }}>
                {n.user_name || n.user_email || "Staff"}
              </span>
              {n.timestamp && (
                <span className="text-[10px] shrink-0" style={{ color: CRM.sub }}>
                  {format(new Date(n.timestamp), "MMM d, h:mma").toLowerCase()}
                </span>
              )}
            </div>
            <p className="text-[12px] whitespace-pre-wrap" style={{ color: CRM.ink }}>{n.comment}</p>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="flex-1 rounded-xl p-3 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-200"
            style={{ border: "1px solid rgba(182,118,81,0.18)", color: CRM.ink, background: "#fffdfb" }}
          />
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim()}
            title="Add note"
            className="w-9 h-9 rounded-full inline-flex items-center justify-center disabled:opacity-40 shrink-0"
            style={{ background: CRM.accentSoft, color: "#5b3038" }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}