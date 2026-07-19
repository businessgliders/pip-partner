import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, ArrowUp, ArrowDown, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CRM } from "./crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

// Manage kanban swimlanes: add, rename and reorder TaskColumn records.
export default function CrmTaskColumnsDialog({ columns, onClose }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(columns.map((c) => ({ ...c })));
  useLockBodyScroll();

  const saveMutation = useMutation({
    mutationFn: async (list) => {
      await Promise.all(
        list.map((r, i) =>
          r.id
            ? base44.entities.TaskColumn.update(r.id, { label: r.label, order: i })
            : base44.entities.TaskColumn.create({
                key: `col_${Date.now()}_${i}`,
                label: r.label,
                order: i,
              })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-columns"] });
      onClose();
    },
  });

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const valid = rows.every((r) => r.label.trim());

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 crm-root pip-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm pip-pop-in">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(182,118,81,0.1)" }}>
          <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>Swimlanes</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100" style={{ color: CRM.sub }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-2 max-h-[50vh] overflow-y-auto">
          {rows.map((r, i) => (
            <div key={r.id || `new-${i}`} className="flex items-center gap-1.5">
              <Input
                value={r.label}
                onChange={(e) => setRows(rows.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                className="h-9 text-[13px]"
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#faf1ea] disabled:opacity-30 shrink-0"
                style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.sub }}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#faf1ea] disabled:opacity-30 shrink-0"
                style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.sub }}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows([...rows, { label: "" }])}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold mt-1"
            style={{ color: CRM.brown }}
          >
            <Plus className="w-3.5 h-3.5" /> Add swimlane
          </button>
        </div>
        <div className="flex justify-end gap-2 p-5" style={{ borderTop: "1px solid rgba(182,118,81,0.1)", background: "#fdf8f4" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[12px] font-medium bg-white"
            style={{ border: "1px solid rgba(182,118,81,0.2)", color: CRM.ink }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || saveMutation.isPending}
            onClick={() => saveMutation.mutate(rows)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold disabled:opacity-50"
            style={{ background: CRM.accentSoft, color: "#5b3038" }}
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}