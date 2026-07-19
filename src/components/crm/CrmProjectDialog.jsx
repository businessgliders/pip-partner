import React, { useState } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { displayName } from "@/components/board/boardConfig";
import { LEAD_TYPE_LABELS } from "./CrmProjectColumn";
import { CRM } from "./crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

export default function CrmProjectDialog({ project, columns, leads, onSave, onDelete, onClose, saving }) {
  const [form, setForm] = useState({
    title: project?.title || "",
    details: project?.details || "",
    status: project?.status || columns[0]?.key || "todo",
    due_date: project?.due_date || "",
    lead_type: project?.lead_type || "",
    lead_id: project?.lead_id || "",
  });

  const leadOptions = (leads || []).filter((t) => !form.lead_type || t._boardKey === form.lead_type);
  useLockBodyScroll();

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 crm-root pip-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md pip-pop-in">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(182,118,81,0.1)" }}>
          <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>
            {project?.id ? "Edit task" : "New task"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100" style={{ color: CRM.sub }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task name" />
          </div>
          <div>
            <Label className="text-xs">Details</Label>
            <Textarea rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Optional notes" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lead type</Label>
              <Select
                value={form.lead_type || "none"}
                onValueChange={(v) => setForm({ ...form, lead_type: v === "none" ? "" : v, lead_id: "" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Object.entries(LEAD_TYPE_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Lead</Label>
              <Select
                value={form.lead_id || "none"}
                onValueChange={(v) => {
                  if (v === "none") { setForm({ ...form, lead_id: "" }); return; }
                  const t = (leads || []).find((l) => l.id === v);
                  setForm({ ...form, lead_id: v, lead_type: t?._boardKey || form.lead_type });
                }}
                disabled={!form.lead_type}
              >
                <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {leadOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{displayName(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Swimlane</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columns.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 p-5" style={{ borderTop: "1px solid rgba(182,118,81,0.1)", background: "#fdf8f4" }}>
          {project?.id ? (
            <button
              type="button"
              onClick={() => { if (confirm(`Delete task "${project.title}"?`)) onDelete(project.id); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
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
              disabled={saving || !form.title.trim()}
              onClick={() => onSave({ ...(project?.id ? { id: project.id } : {}), ...form })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold disabled:opacity-50"
              style={{ background: CRM.accentSoft, color: "#5b3038" }}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}