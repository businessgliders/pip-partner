import React from "react";
import {
  displayName,
  initials,
  avatarGradient,
  relativeTime,
  previewLine,
  statusChip,
  statusLabel,
} from "./inboxConfig";

export default function InboxThreadRow({ ticket, sourceKey, active, unread, onClick }) {
  const name = displayName(ticket);
  const time = relativeTime(ticket.updated_date || ticket.created_date);
  const preview = previewLine(sourceKey, ticket);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex gap-3 px-3 py-3 rounded-xl transition-colors ${
        active
          ? "bg-white shadow-sm border border-slate-200"
          : "bg-white/70 hover:bg-white border border-transparent"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(
            name
          )} flex items-center justify-center text-white text-xs font-bold shadow`}
        >
          {initials(name)}
        </div>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center shadow">
            {unread}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              unread > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-800"
            }`}
          >
            {name}
          </span>
          <span className="text-[11px] text-slate-500 shrink-0">{time}</span>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusChip(
              ticket.status
            )}`}
          >
            {statusLabel(sourceKey, ticket.status)}
          </span>
          {ticket.app_number && (
            <span className="text-[10px] text-slate-400">#{ticket.app_number}</span>
          )}
        </div>

        {preview && (
          <p className="text-xs text-slate-500 truncate mt-1">{preview}</p>
        )}
      </div>
    </button>
  );
}