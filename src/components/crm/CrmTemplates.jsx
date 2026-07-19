import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, Save, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CrmEmailShellPreview from "./CrmEmailShellPreview";
import { CRM } from "./crmTheme";

const CATEGORIES = ["General", "Franchise", "Influencer", "Hiring", "Follow-up", "Other"];
const EMPTY = { name: "", category: "General", subject: "", body_html: "", is_active: true };

export default function CrmTemplates() {
  const queryClient = useQueryClient();
  const [openCategory, setOpenCategory] = useState(null); // null = auto (first non-empty)
  const [editing, setEditing] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["crm-templates"],
    queryFn: () => base44.entities.EmailTemplate.list("-updated_date", 200),
  });

  // Current user's signature so the preview mirrors the sent email.
  const { data: me } = useQuery({
    queryKey: ["crm-current-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
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

  const grouped = useMemo(
    () => CATEGORIES.map((c) => ({ category: c, items: templates.filter((t) => t.category === c) })),
    [templates]
  );

  const firstNonEmpty = grouped.find((g) => g.items.length > 0)?.category || CATEGORIES[0];
  const effectiveOpen = openCategory === null ? firstNonEmpty : openCategory;

  const strip = (html) => (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>Collections</h2>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY, category: effectiveOpen })}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-semibold"
          style={{ background: CRM.accentSoft, color: "#5b3038" }}
        >
          <Plus className="w-3.5 h-3.5" /> New template
        </button>
      </div>
      <p className="text-[13px] mb-5" style={{ color: CRM.sub }}>
        Reusable email templates for your different pipelines, grouped by category.
      </p>

      {/* Category accordion */}
      <div className="space-y-3 pb-10">
        {grouped.map(({ category, items }) => {
          const open = effectiveOpen === category;
          return (
            <div key={category} className="crm-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCategory(open ? "" : category)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#fdf8f4] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {open
                    ? <ChevronDown className="w-4 h-4" style={{ color: CRM.brown }} />
                    : <ChevronRight className="w-4 h-4" style={{ color: CRM.brown }} />}
                  <span className="text-[14px] font-semibold" style={{ color: CRM.ink }}>{category}</span>
                </span>
                <span
                  className="text-[10px] font-bold min-w-[22px] h-5 px-1.5 rounded-full flex items-center justify-center"
                  style={{ background: CRM.blush, color: CRM.brown }}
                >
                  {items.length}
                </span>
              </button>

              {open && (
                <div className="px-5 pb-5 pt-1">
                  {isLoading ? null : items.length === 0 ? (
                    <p className="text-[12px] py-2" style={{ color: CRM.sub }}>
                      No templates in this category yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditing(t)}
                          className="rounded-2xl p-4 text-left flex flex-col min-h-[140px] hover:shadow-md transition-shadow"
                          style={{ border: "1px solid rgba(182,118,81,0.15)", background: "#fffdfb" }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[13px] font-semibold leading-snug" style={{ color: CRM.ink }}>
                              {t.name}
                            </span>
                            {!t.is_active && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: "#fef3c7", color: "#b45309" }}>
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] font-medium mb-1 truncate" style={{ color: CRM.brown }}>
                            {t.subject}
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-3 flex-1" style={{ color: CRM.sub }}>
                            {strip(t.body_html) || "No content yet"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
              <div>
                <Label className="text-xs">Preview (how it will be sent)</Label>
                <p className="text-[11px] mb-1" style={{ color: CRM.sub }}>
                  Sample values fill the placeholders and your signature is appended, just like the real email.
                </p>
                <CrmEmailShellPreview
                  bodyHtml={editing.body_html}
                  signatureHtml={me?.signature_html || ""}
                  height={400}
                />
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