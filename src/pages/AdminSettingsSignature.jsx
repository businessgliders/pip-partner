import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import BackToHome from "../components/BackToHome";

export default function AdminSettingsSignature() {
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setSignature(u?.signature_html || "");
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe({ signature_html: signature });
    setSavedAt(new Date());
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <BackToHome to="/AdminDashboard/Settings" label="Settings" />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.25em] text-slate-500 font-semibold mb-1">EMAIL</p>
          <h1 className="text-2xl font-light text-slate-900">Your Signature</h1>
          <p className="text-sm text-slate-500 mt-1">
            Appended automatically to every email you send from a submission.
          </p>
        </div>

        {loading ? (
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <ReactQuill theme="snow" value={signature} onChange={setSignature} className="bg-white" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : "Not saved yet"}
              </span>
              <Button onClick={save} disabled={saving} className="bg-[#b67651] hover:bg-[#a4694a] text-white">
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Saving..." : "Save Signature"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Preview</div>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: signature || "<em>Empty</em>" }} />
        </div>
      </div>
    </div>
  );
}