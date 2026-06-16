import React from "react";
import { Mail, Phone, X, Hash, User as UserIcon, ExternalLink } from "lucide-react";
import {
  displayName,
  initials,
  avatarGradient,
  statusChip,
  statusLabel,
} from "./inboxConfig";

function Field({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </div>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{value}</div>
    </div>
  );
}

export default function InboxContactPanel({
  ticket,
  sourceKey,
  detailFields = [],
  accent = "#b67651",
  onClose,
}) {
  if (!ticket) return null;
  const name = displayName(ticket);
  const phone = [ticket.phone_country, ticket.phone].filter(Boolean).join(" ");

  return (
    <div className="h-full flex flex-col bg-white/95 rounded-2xl border border-white/40 backdrop-blur shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Details
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center text-center mb-4">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient(
              name
            )} flex items-center justify-center text-white text-lg font-bold shadow-lg`}
          >
            {initials(name)}
          </div>
          <h3 className="text-base font-semibold text-slate-900 mt-3">{name}</h3>
          {ticket.email && (
            <a
              href={`mailto:${ticket.email}`}
              className="text-xs text-slate-600 hover:underline flex items-center gap-1 mt-1"
            >
              <Mail className="w-3 h-3" /> {ticket.email}
            </a>
          )}
          {phone && (
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {phone}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          <span
            className={`text-[11px] font-medium px-2 py-1 rounded-full ${statusChip(
              ticket.status
            )}`}
          >
            {statusLabel(sourceKey, ticket.status)}
          </span>
          {ticket.app_number && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {ticket.app_number}
            </span>
          )}
          {ticket.assigned_to && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {ticket.assigned_to.split("@")[0]}
            </span>
          )}
        </div>

        <div>
          {detailFields.map((f) => {
            const v = typeof f.get === "function" ? f.get(ticket) : ticket[f.key];
            return <Field key={f.key} label={f.label} value={v} />;
          })}
        </div>

        {ticket.resume_url && (
          <a
            href={ticket.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
            style={{ color: accent }}
          >
            <ExternalLink className="w-3 h-3" />
            View Resume
          </a>
        )}
      </div>
    </div>
  );
}