import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, X, FileText } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import BackToHome from "../components/BackToHome";
import AdminFavicon from "../components/AdminFavicon";

const CATEGORIES = ["General", "Franchise", "Influencer", "Hiring", "Follow-up", "Other"];
const VARS = [
  "client_name", "client_first_name", "client_email", "client_phone",
  "inquiry_type", "ticket_id", "staff_name", "staff_first_name", "staff_email",
];

const EMPTY = { name: "", category: "General", subject: "", body_html: "", is_active: true };

export default function AdminSettingsTemplates() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.EmailTemplate.list("-updated_date", 200);
    setTemplates(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.subject || !editing.body_html) {
      alert("Please fill name, subject, and body.");
      return;
    }
    if (editing.id) {
      await base44.entities.EmailTemplate.update(editing.id, editing);
    } else {
      await base44.entities.EmailTemplate.create(editing);
    }
    setEditing(null);
    load();
  };

  const remove = async (t) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    await base44.entities.EmailTemplate.delete(t.id);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminFavicon title="Pilates in Pink™ — Templates" />
      <BackToHome to="/Settings" label="Settings" />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.25em] text-slate-500 font-semibold mb-1">EMAIL</p>
            <h1 className="text-2xl font-light text-slate-900">Templates</h1>
          </div>
          <Button onClick={() => setEditing({ ...EMPTY })} className="bg-[#b67651] hover:bg-[#a4694a] text-white">
            <Plus className="w-4 h-4 mr-1.5" /> New Template
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
          <div className="font-semibold mb-2 text-slate-700">Available variables (use {`{{variable}}`}):</div>
          <div className="flex flex-wrap gap-2">
            {VARS.map((v) => (
              <code key={v} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{`{{${v}}}`}</code>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid gap-3">
            {templates.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No templates yet. Create one to get started.
              </div>
            )}
            {templates.map((t) => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{t.name}</span>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {t.category}
                    </span>
                    {!t.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Inactive</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{t.subject}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t)} className="text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-lg font-semibold">{editing.id ? "Edit Template" : "New Template"}</h2>
                <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
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
                  <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Welcome {{client_first_name}}!" />
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
                    id="active"
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  <Label htmlFor="active" className="text-sm">Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-5 border-t bg-slate-50">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save} className="bg-[#b67651] hover:bg-[#a4694a] text-white">
                  <Save className="w-4 h-4 mr-1.5" /> Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}