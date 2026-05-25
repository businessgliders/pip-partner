import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { StatusBadge } from "./SubmissionsTable";

/**
 * Small dropdown for changing a ticket's status from the detail modal.
 * Renders the current value using the existing StatusBadge so styling stays consistent.
 */
export default function StatusDropdown({ status, statuses = [], onChange, disabled = false }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || statuses.length === 0}>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full hover:opacity-80 transition disabled:opacity-50"
          title="Change status"
        >
          <StatusBadge status={status} />
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => s !== status && onChange?.(s)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <StatusBadge status={s} />
            {s === status && <Check className="w-3.5 h-3.5 text-slate-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}