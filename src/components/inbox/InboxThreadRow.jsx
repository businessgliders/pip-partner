import React from "react";
import { ExternalLink, CalendarDays, Archive, Reply, Bot } from "lucide-react";
import { format } from "date-fns";
import {
  displayName,
  initials,
  avatarGradient,
  relativeTime,
  previewLine,
  statusChip,
  statusLabel,
} from "./inboxConfig";
import FddCountdownPill from "@/components/board/FddCountdownPill";

export default function InboxThreadRow({ ticket, sourceKey, active, unread, onClick }) {
  const name = displayName(ticket);
  // Show submission date by default; switch to the most recent outbound email
  // date once we've actually emailed the applicant.
  const time = relativeTime(ticket._last_email_at || ticket.created_date);
  const preview = previewLine(sourceKey, ticket);
  const isHiring = sourceKey === "instructor" || sourceKey === "frontadmin";
  const isFranchise = sourceKey === "franchise";
  const calStart = ticket._cal_booking?.start;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className={`w-full text-left flex gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
        active
          ? "bg-[#d9c5b8] ring-1 ring-[#b67651]/40"
          : ticket.follow_up?.enabled
          ? "bg-amber-50/80 hover:bg-amber-50 ring-1 ring-amber-200"
          : "bg-white/70 hover:bg-white"
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
          <div className="flex items-center gap-1 shrink-0">
            {ticket.follow_up?.enabled && (
              <span
                title={`Auto Follow-up Active — Step ${ticket.follow_up?.step || 0}/${ticket.follow_up?.max_steps || 5}`}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700"
              >
                <Bot className="w-2.5 h-2.5" />
              </span>
            )}
            {ticket._has_reply && (
              <span
                title="Applicant replied"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700"
              >
                <Reply className="w-2.5 h-2.5" />
              </span>
            )}
            <span className="text-[11px] text-slate-500">{time}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {ticket.archived && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 inline-flex items-center gap-1">
              <Archive className="w-2.5 h-2.5" />
              Archived
            </span>
          )}
          {isHiring && ticket.resume_url ? (
            <a
              href={ticket.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 inline-flex items-center gap-1"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Resume
            </a>
          ) : !isFranchise ? (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusChip(
                ticket.status
              )}`}
            >
              {statusLabel(sourceKey, ticket.status)}
            </span>
          ) : null}

          {isFranchise && calStart && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
              <CalendarDays className="w-2.5 h-2.5" />
              {format(new Date(calStart), "MMM d · h:mma")}
            </span>
          )}

          {ticket.app_number && (
            <span className="text-[10px] text-slate-400">#{ticket.app_number}</span>
          )}

          {isFranchise && ticket.status === "fdd" && (
            <FddCountdownPill ticket={ticket} />
          )}
        </div>

        {preview && (
          <p className="text-xs text-slate-500 truncate mt-1">{preview}</p>
        )}
      </div>
    </div>
  );
}