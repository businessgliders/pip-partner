import React from "react";
import { ChevronDown, Check } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Archive } from "lucide-react";
import { statusChip, statusLabel, statusGroupsFor, entityForSource, UPCOMING_MEETINGS_KEY } from "./inboxConfig";

// Pseudo status key used to surface the "Archive" action inside the dropdown's
// "Other" group. It's not a real entity status — selecting it archives the
// ticket rather than changing its status.
const ARCHIVE_ACTION_KEY = "__archive__";

/**
 * Pill-styled status dropdown. Updates the ticket's status (with history) and
 * invalidates the shared ApplicationBoard query so other views refresh.
 *
 * Layout: statuses are rendered in COLUMNS, one per group defined in
 * inboxConfig.INBOX_STATUS_GROUPS (Step 1 / Step 2 / Other for franchise).
 * Each group has its own labeled column inside the popover for easy scanning.
 */
export default function InboxStatusDropdown({ ticket, sourceKey, variant = "light" }) {
  const queryClient = useQueryClient();
  const entity = entityForSource(sourceKey);
  // Drop the "upcoming" pseudo-group (it's a rail filter, not a real status)
  // and any empty groups, so we only render real status columns. Append an
  // "Archive" action into the "Other" group so it's reachable from this menu.
  const groups = statusGroupsFor(sourceKey)
    .map((g) => ({
      ...g,
      statuses: (g.statuses || []).filter((s) => s !== UPCOMING_MEETINGS_KEY),
    }))
    .filter((g) => g.statuses.length > 0)
    .map((g) =>
      g.label === "Other"
        ? { ...g, statuses: [...g.statuses, ARCHIVE_ACTION_KEY] }
        : g
    );

  const mutation = useMutation({
    mutationFn: (newStatus) => {
      // Special "Archive" pseudo-action — just flips the archived flag on the
      // ticket; no status change, no status_history entry.
      if (newStatus === ARCHIVE_ACTION_KEY) {
        return base44.entities[entity].update(ticket.id, { archived: true });
      }
      const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
      const updated = [
        ...history,
        { status: newStatus, timestamp: new Date().toISOString() },
      ];
      // Changing status on an archived ticket un-archives it so it returns to
      // the active inbox under its new status (instead of being hidden away).
      const patch = {
        status: newStatus,
        status_history: updated,
      };
      if (ticket.archived) patch.archived = false;
      return base44.entities[entity].update(ticket.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-board", entity] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={mutation.isPending}
          className={`text-[11px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 hover:opacity-80 transition-opacity ${statusChip(
            ticket.status
          )}`}
        >
          {statusLabel(sourceKey, ticket.status)}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-2">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(8.5rem, 1fr))` }}
        >
          {groups.map((g, gi) => (
            <div key={gi} className="flex flex-col gap-1">
              {g.label && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5 pb-1 border-b border-slate-200">
                  {g.label}
                </div>
              )}
              {g.statuses.map((s) => {
                if (s === ARCHIVE_ACTION_KEY) {
                  return (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => {
                        if (!ticket.archived) mutation.mutate(ARCHIVE_ACTION_KEY);
                      }}
                      className="text-xs px-1.5 py-1 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap bg-slate-200 text-slate-700">
                        <Archive className="w-3 h-3" />
                        Archived
                      </span>
                      {ticket.archived && (
                        <Check className="w-3 h-3 ml-auto text-slate-500" />
                      )}
                    </DropdownMenuItem>
                  );
                }
                return (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      if (s !== ticket.status) mutation.mutate(s);
                    }}
                    className="text-xs px-1.5 py-1 cursor-pointer"
                  >
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${statusChip(s)}`}
                    >
                      {statusLabel(sourceKey, s)}
                    </span>
                    {ticket.status === s && (
                      <Check className="w-3 h-3 ml-auto text-slate-500" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}