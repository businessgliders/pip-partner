import React from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const priorityBorderColors = {
  Low: "border-green-500",
  Medium: "border-yellow-500",
  High: "border-orange-500",
  Urgent: "border-red-500",
};

const CATEGORY_EMOJI = {
  franchise: "🏢",
  influencer: "✨",
  instructor: "💪",
  frontadmin: "📋",
};

function hashColor(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 60%, 55%)`;
}

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const iso = /Z|[+-]\d\d:?\d\d$/.test(dateString) ? dateString : dateString + "Z";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;

  const fmtTime = (d) => d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const fmtFull = (d) => d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
  const today = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dEst = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dayDiff = Math.floor((today.setHours(0,0,0,0) - new Date(dEst).setHours(0,0,0,0)) / 86400000);
  if (dayDiff === 0) return `Today, ${fmtTime(date)}`;
  if (dayDiff === 1) return `Yesterday, ${fmtTime(date)}`;
  if (dayDiff < 7) return `${dayDiff} days ago`;
  return `${fmtFull(date)}, ${fmtTime(date)}`;
}

export default function TicketCard({ ticket, onStatusChange, onClick, isDragging, isHighlighted, viewMode, statusOptions, tabKey }) {
  const priority = ticket.priority || "Medium";
  const borderClass = priorityBorderColors[priority] || "border-yellow-500";
  const name = ticket._displayName || ticket.full_name || `${ticket.first_name || ""} ${ticket.last_name || ""}`.trim() || "—";
  const number = ticket.app_number ? `#${ticket.app_number}` : `#${(ticket.id || "").slice(-4).toUpperCase()}`;
  const emoji = CATEGORY_EMOJI[tabKey] || "📄";
  const category = ticket.province || ticket.content_style || "—";
  const assigneeKey = ticket.created_by || ticket.email || "?";

  const baseClass = `relative overflow-hidden backdrop-blur-md bg-white/40 border-2 ${borderClass} rounded-xl p-2 md:p-4 group`;
  const stateClass = isDragging
    ? "shadow-2xl bg-white/90 cursor-grabbing ring-4 ring-white/60"
    : isHighlighted
      ? "shadow-2xl bg-white/70 ring-4 ring-yellow-400/50 animate-shake cursor-grab transition-all"
      : "hover:bg-white/50 shadow-lg hover:shadow-xl cursor-grab transition-all";

  return (
    <div className={`${baseClass} ${stateClass}`} onClick={onClick}>
      {viewMode === "category" && (
        <div className="pointer-events-none absolute top-1 right-2 text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-900/10">
          {ticket.status}
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base">{emoji}</span>
            <span className="text-sm font-semibold text-gray-900 truncate">
              <span className="text-gray-500">{number}</span> {name}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {statusOptions.filter((s) => s !== ticket.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(ticket.id, s)}>
                  Move to {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-white/40 border-white/60">
            {category}
          </Badge>
          <span className="text-[10px] text-gray-600">{formatRelativeTime(ticket.created_date)}</span>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-xl">{emoji}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                <span className="font-bold text-gray-500">{number}</span> {name}
              </div>
              <Badge variant="outline" className="mt-1 text-[10px] bg-white/40 border-white/60">
                {category}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {statusOptions.filter((s) => s !== ticket.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(ticket.id, s)}>
                  Move to {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-gray-600">{formatRelativeTime(ticket.created_date)}</span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
            style={{ background: hashColor(assigneeKey) }}
            title={assigneeKey}
          >
            {initials(name)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out 3; }
      `}</style>
    </div>
  );
}