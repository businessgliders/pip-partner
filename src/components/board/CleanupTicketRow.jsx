import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function CleanupTicketRow({ ticket, checked, onChange }) {
  const name = ticket._display_name || "Unknown";
  const num = ticket.app_number ? `#${ticket.app_number}` : `#${(ticket.id || "").slice(-4).toUpperCase()}`;
  const created = ticket.created_date ? new Date(ticket.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return (
    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-white/50 hover:bg-white/90 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          <span className="text-gray-500 mr-1">{num}</span>{name}
        </div>
        <div className="text-xs text-gray-500">Created {created} · {ticket.status}</div>
      </div>
    </label>
  );
}