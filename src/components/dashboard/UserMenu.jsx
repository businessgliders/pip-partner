import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(user) {
  const name = user?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  return (user?.email || "").slice(0, 2).toUpperCase();
}

export default function UserMenu() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = getInitials(user);
  const display = user.full_name || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title={display}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/60 transition-opacity"
          style={{ backgroundColor: "#f1889b" }}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: "#5a3535" }}
            >
              {user.full_name || "—"}
            </span>
            <span
              className="text-xs truncate"
              style={{ color: "#7a5555" }}
            >
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}