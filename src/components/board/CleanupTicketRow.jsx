import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

function daysSince(dateString) {
  if (!dateString) return 0;
  const iso = /Z|[+-]\d\d:?\d\d$/.test(dateString) ? dateString : dateString + "Z";
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function CleanupTicketRow({ ticket, selected, onToggle }) {
  const name = ticket.full_name || `${ticket.first_name || ""} ${ticket.last_name || ""}`.trim() || "—";
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/70 hover:bg-white/80 cursor-pointer">
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
        <div className="text-xs text-gray-500">{ticket.email || "—"} · {daysSince(ticket.created_date)} days old</div>
      </div>
    </label>
  );
}