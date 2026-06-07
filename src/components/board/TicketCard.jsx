import React from "react";
import { MoreVertical, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { displayName } from "./boardConfig";
import { displayAppNumber } from "@/lib/appNumberDisplay";
import { getStatusLabel } from "./boardConfig";

// Neutral white ticket card rendered inside MasterKanbanCard (bareCard=true).
// Shows: name, obfuscated ticket number, time submitted, and a single
// dropdown to move status or archive/unarchive. No drag handle here — the
// outer Draggable wrapper handles drag.

export default function TicketCard({
  ticket,
  onStatusChange,
  onArchiveChange,
  statusOptions = [],
  boardKey,
}) {
  const name = ticket._display_name || displayName(ticket);
  const number = displayAppNumber(ticket, boardKey);
  const created = ticket.created_date ? new Date(ticket.created_date) : null;
  const timeLabel = created ? format(created, "MMM d, h:mm a") : "";

  const handleStatus = (e, s) => {
    e.stopPropagation();
    if (s !== ticket.status) onStatusChange?.(ticket, s);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    onArchiveChange?.(ticket, !ticket.archived);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
            {number && <span className="font-medium text-slate-600">#{number}</span>}
            {number && timeLabel && <span className="text-slate-300">·</span>}
            {timeLabel && <span>{timeLabel}</span>}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
            {statusOptions.length > 0 && (
              <>
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-slate-400">
                  Move to
                </DropdownMenuLabel>
                {statusOptions.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    disabled={s === ticket.status}
                    onClick={(e) => handleStatus(e, s)}
                    className="capitalize text-xs"
                  >
                    {getStatusLabel ? getStatusLabel(boardKey, s) : s}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleArchive} className="text-xs">
              {ticket.archived ? (
                <>
                  <ArchiveRestore className="w-3.5 h-3.5 mr-2" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}