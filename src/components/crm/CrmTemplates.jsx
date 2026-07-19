import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, Save, Trash2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CRM } from "./crmTheme";

const CATEGORIES = ["General", "Franchise", "Influencer", "Hiring", "Follow-up", "Other"];
const EMPTY = { name: "", category: "General", subject: "", body_html: "", is_active: true };

export default function CrmTemplates() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["crm-templates"],
    queryFn: () => base44.entities.EmailTemplate.list("-updated_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: async (t) => {
      if (t.id) return base44.entities.EmailTemplate.update(t.id, t);
      return base44.entities.EmailTemplate.create(t);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-templates"] });
      setEditing(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-templates"] });
      setEditing(null);
    },
  });

  const visible = useMemo(
    () => (category === "All" ? templates : templates.filter((t) => t.category === category)),
    [templates, category]
  );

  const strip = (html) => (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>Collections</h2>
      </div>
      <p className="text-[13px] mb-5" style={{ color: CRM.sub }}>
        Reusable email templates for your different pipelines.
      </p>

      {/* Category card-view selector */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium shrink-0 transition-all"
            style={
              category === c
                ? { background: CRM.ink, color: "white" }
                : { background: "white", color: CRM.sub, border: "1px solid rgba(182,118,81,0.15)" }
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
        {/* Create card */}
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY, category: category === "All" ? "General" : category })}
          className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 min-h-[170px] transition-shadow hover:shadow-md"
          style={{
            background: "linear-gradient(135deg, #fff9f4 0%, #fbe0e2 100%)",
            border: "1px dashed rgba(182,118,81,0.3)",
          }}
        >
          <span className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center">
            <Plus className="w-5 h-5" style={{ color: CRM.brown }} />
          </span>
          <span className="text-[13px] font-medium" style={{ color: CRM.ink }}>Create a template</span>
        </button>

        {isLoading ? null : visible.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setEditing(t)}
            className="crm-card p-5 text-left flex flex-col min-h-[170px] hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[14px] font-semibold leading-snug" style={{ color: CRM.ink }}>
                {t.name}
              </span>
              {!t.is_active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: "#fef3c7", color: "#b45309" }}>
                  Inactive
                </span>
              )}
            </div>
            <div className="text-[12px] font-medium mb-1.5 truncate" style={{ color: CRM.brown }}>
              {t.subject}
            </div>
            <p className="text-[12px] leading-relaxed line-clamp-3 flex-1" style={{ color: CRM.sub }}>
              {strip(t.body_html) || "—"}
            </p>
            <span
              className="mt-3 self-start text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
              style={{ background: CRM.blush, color: CRM.brown }}
            >
              {t.category}
            </span>
          </button>
        ))}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 crm-root pip-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pip-pop-in">
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(182,118,81,0.1)" }}>
              <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>
                {editing.id ? "Edit template" : "New template"}
              </h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-slate-100" style={{ color: CRM.sub }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  placeholder="Welcome {{client_first_name}}!"
                />
              </div>
              <div>
                <Label className="text-xs">Body</Label>
                <ReactQuill
                  theme="snow"
                  value={editing.body_html}
                  onChange={(html) => setEditing({ ...editing, body_html: html })}
                  className="bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="crm-tpl-active"
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <Label htmlFor="crm-tpl-active" className="text-sm">Active</Label>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 p-5" style={{ borderTop: "1px solid rgba(182,118,81,0.1)", background: "#fdf8f4" }}>
              {editing.id ? (
                <button
                  type="button"
                  onClick={() => { if (confirm(`Delete template "${editing.name}"?`)) deleteMutation.mutate(editing.id); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-full text-[12px] font-medium bg-white"
                  style={{ border: "1px solid rgba(182,118,81,0.2)", color: CRM.ink }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saveMutation.isPending || !editing.name || !editing.subject || !editing.body_html}
                  onClick={() => saveMutation.mutate(editing)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold disabled:opacity-50"
                  style={{ background: CRM.accentSoft, color: "#5b3038" }}
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}