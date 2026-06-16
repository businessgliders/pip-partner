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
import { statusChip, statusLabel, statusOrderFor, entityForSource } from "./inboxConfig";

/**
 * Pill-styled status dropdown. Updates the ticket's status (with history) and
 * invalidates the shared ApplicationBoard query so other views refresh.
 */
export default function InboxStatusDropdown({ ticket, sourceKey, variant = "light" }) {
  const queryClient = useQueryClient();
  const entity = entityForSource(sourceKey);
  const statuses = statusOrderFor(sourceKey);

  const mutation = useMutation({
    mutationFn: (newStatus) => {
      const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
      const updated = [
        ...history,
        { status: newStatus, timestamp: new Date().toISOString() },
      ];
      return base44.entities[entity].update(ticket.id, {
        status: newStatus,
        status_history: updated,
      });
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
      <DropdownMenuContent align="start" className="w-48">
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => {
              if (s !== ticket.status) mutation.mutate(s);
            }}
            className="text-xs"
          >
            <span
              className={`mr-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${statusChip(
                s
              )}`}
            >
              {statusLabel(sourceKey, s)}
            </span>
            {ticket.status === s && (
              <Check className="w-3 h-3 ml-auto text-slate-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}