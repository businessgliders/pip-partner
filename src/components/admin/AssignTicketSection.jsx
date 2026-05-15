import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserPlus, Check } from "lucide-react";

export default function AssignTicketSection({ assignedTo, onAssign, accentColor }) {
  const [selected, setSelected] = useState(assignedTo || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: adminUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
    select: (users) => users.filter((u) => u.role === "admin"),
    staleTime: 60000,
  });

  const handleAssign = async () => {
    if (!selected || selected === assignedTo) return;
    setSaving(true);
    await onAssign(selected);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const assignedUser = adminUsers.find((u) => u.email === assignedTo);
  const initials = assignedUser
    ? assignedUser.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
          Assign To
        </span>
      </div>

      {assignedTo && assignedUser && (
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: accentColor }}
          >
            {initials || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{assignedUser.full_name}</p>
            <p className="text-[10px] text-slate-400">{assignedUser.email}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1 h-9 text-sm">
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {adminUsers.map((u) => (
              <SelectItem key={u.id} value={u.email}>
                {u.full_name || u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleAssign}
          disabled={!selected || selected === assignedTo || saving}
          className="h-9 px-3 text-xs shrink-0"
          style={{ background: accentColor }}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : saving ? "..." : "Assign"}
        </Button>
      </div>
    </div>
  );
}