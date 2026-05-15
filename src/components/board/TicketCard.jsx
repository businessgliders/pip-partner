import React from "react";
import { MoreVertical, FileText, Instagram, Music2, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAppNumber } from "@/lib/appNumberDisplay";

const priorityBorderColors = {
  Low: "border-green-500",
  Medium: "border-yellow-500",
  High: "border-orange-500",
  Urgent: "border-red-500",
};

const categoryEmoji = {
  franchise: "🏪",
  influencer: "✨",
  instructor: "💪",
  frontadmin: "📋",
};

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const palette = ["#f1889b", "#b67651", "#d4a088", "#c4896b", "#a0c4a8", "#8aa3c2", "#c28aa3", "#c2a08a"];
  return palette[h % palette.length];
}

function toSentenceCase(str = "") {
  return str
    .toLowerCase()
    .replace(/(^|[\s\-/,])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
}

function initialsFor(name = "", email = "") {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  let iso = dateString;
  if (typeof iso === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso)) iso = `${iso}Z`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const tz = "America/New_York";
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today, ${timeStr}`;
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Yesterday, ${timeStr}`;
  const diffDays = Math.floor((now.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / 86400000);
  if (diffDays > 0 && diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz }) + `, ${timeStr}`;
}

export default function TicketCard({
  ticket,
  onStatusChange,
  onClick,
  isDragging,
  isHighlighted,
  viewMode,
  statusOptions = [],
  boardKey,
  unreadCount = 0,
}) {
  const priority = ticket.priority || "Medium";
  const borderCls = priorityBorderColors[priority] || priorityBorderColors.Medium;
  const emoji = categoryEmoji[boardKey] || "📌";
  const name = ticket._display_name || "Unknown";
  const num = ticket.app_number ? `#${formatAppNumber(ticket.app_number, boardKey)}` : `#${(ticket.id || "").slice(-4).toUpperCase()}`;
  const time = formatRelativeTime(ticket.created_date);
  const bubbleColor = hashColor(ticket.email || ticket.id || "");
  const initials = initialsFor(name, ticket.email);
  const category = ticket._category || "";

  const scheduledTimeLabel = (() => {
    const startIso = ticket._cal_booking?.start || ticket.scheduled_call_time;
    if (!startIso) return "";
    const d = new Date(startIso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Toronto",
    });
  })();

  const baseCls = `relative overflow-hidden backdrop-blur-md bg-white/70 border-2 ${borderCls} rounded-xl p-2 md:p-4 group`;
  const stateCls = isDragging
    ? "shadow-2xl bg-white/95 cursor-grabbing ring-4 ring-white/60"
    : isHighlighted
      ? "shadow-2xl bg-white/85 ring-4 ring-yellow-400/50 animate-shake cursor-grab transition-all"
      : "hover:bg-white/80 shadow-lg hover:shadow-xl cursor-grab transition-all";

  return (
    <div className={`${baseCls} ${stateCls}`} onClick={onClick}>
      {unreadCount > 0 && (
        <div
          title={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
          className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold shadow-md animate-pulse-soft"
        >
          <Mail className="w-3 h-3" />
          <span>{unreadCount > 9 ? "9+" : unreadCount}</span>
        </div>
      )}
      {viewMode === "category" && (
        <div className="pointer-events-none absolute top-1 right-2 text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-900/10">
          {ticket.status}
        </div>
      )}

      {/* Mobile compact */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="text-sm">{emoji}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">
                <span className="text-gray-500 mr-1">{num}</span>{name}
              </div>
              {category && <div className="text-[10px] text-gray-600 mt-0.5">{category}</div>}
              {scheduledTimeLabel && (
                <div className="text-[10px] text-emerald-700 mt-0.5 font-medium truncate">📅 {scheduledTimeLabel}</div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-900 p-0.5"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {statusOptions.filter((s) => s !== ticket.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange?.(ticket, s)}>Move to {s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-[10px] text-gray-500 mt-1 text-right">{time}</div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-lg">{emoji}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                <span className="font-bold text-gray-500 mr-1">{num}</span>{name}
              </div>
              {scheduledTimeLabel && (
                <span className="inline-block mt-1 mr-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium max-w-full truncate">
                  📅 {scheduledTimeLabel}
                </span>
              )}
              {boardKey === "franchise" ? (
                (ticket.preferred_location || ticket.province || ticket.preferred_postal_code) && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-gray-700 max-w-full truncate">
                    📍 {[toSentenceCase(ticket.preferred_location || ""), ticket.province, ticket.preferred_postal_code].filter(Boolean).join(" · ")}
                  </span>
                )
              ) : (boardKey === "instructor" || boardKey === "frontadmin") ? (
                (ticket.preferred_studio || ticket.province || ticket.postal_code) && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-gray-700 max-w-full truncate">
                    📍 {[toSentenceCase(ticket.preferred_studio || ""), ticket.province, ticket.postal_code].filter(Boolean).join(" · ")}
                  </span>
                )
              ) : (
                category && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-gray-700">
                    {category}
                  </span>
                )
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-gray-500 hover:text-gray-900 p-0.5"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {statusOptions.filter((s) => s !== ticket.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange?.(ticket, s)}>Move to {s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="text-[11px] text-gray-600 whitespace-nowrap">{time}</span>
          {boardKey === "franchise" ? (
            ticket.available_capital ? (
              <span
                className="text-[11px] px-2 py-1 rounded-full bg-white/70 border border-white/80 text-gray-700 font-medium truncate max-w-[60%]"
                title={ticket.available_capital}
              >
                💰 {ticket.available_capital}
              </span>
            ) : null
          ) : boardKey === "influencer" ? (
            (() => {
              const ig = ticket.instagram_handle ? String(ticket.instagram_handle).replace(/^@/, "") : "";
              const tt = ticket.tiktok_handle ? String(ticket.tiktok_handle).replace(/^@/, "") : "";
              if (ig) {
                return (
                  <a
                    href={`https://instagram.com/${ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/70 border border-white/80 text-gray-700 hover:bg-white truncate max-w-[60%]"
                    title={`@${ig}`}
                  >
                    <Instagram className="w-3 h-3" />
                    <span className="truncate">@{ig}</span>
                  </a>
                );
              }
              if (tt) {
                return (
                  <a
                    href={`https://tiktok.com/@${tt}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/70 border border-white/80 text-gray-700 hover:bg-white truncate max-w-[60%]"
                    title={`@${tt}`}
                  >
                    <Music2 className="w-3 h-3" />
                    <span className="truncate">@{tt}</span>
                  </a>
                );
              }
              return null;
            })()
          ) : (boardKey === "instructor" || boardKey === "frontadmin") ? (
            ticket.resume_url ? (
              <a
                href={ticket.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/70 border border-white/80 text-gray-700 hover:bg-white"
                title="Download resume"
              >
                <FileText className="w-3.5 h-3.5" />
                Resume
              </a>
            ) : null
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow"
              style={{ background: bubbleColor }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out 3; }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}