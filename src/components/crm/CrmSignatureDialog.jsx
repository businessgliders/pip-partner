import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Label } from "@/components/ui/label";
import CrmEmailShellPreview from "./CrmEmailShellPreview";
import { CRM } from "./crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const SAMPLE_BODY = `<p>Hi Jane,</p><p>Thanks so much for reaching out. Here is a quick sample of how your emails will look with your signature attached.</p>`;

export default function CrmSignatureDialog({ onClose }) {
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  useLockBodyScroll();

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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 crm-root pip-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pip-pop-in">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(182,118,81,0.1)" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>Email signature</h2>
            <p className="text-[12px] mt-0.5" style={{ color: CRM.sub }}>
              Appended automatically to every email you send from a lead.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100" style={{ color: CRM.sub }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs">Signature</Label>
              <ReactQuill theme="snow" value={signature} onChange={setSignature} className="bg-white" />
            </div>
            <div>
              <Label className="text-xs">Preview (how it will be sent)</Label>
              <div className="mt-1">
                <CrmEmailShellPreview bodyHtml={SAMPLE_BODY} signatureHtml={signature} height={380} />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 p-5" style={{ borderTop: "1px solid rgba(182,118,81,0.1)", background: "#fdf8f4" }}>
          <span className="text-[11px]" style={{ color: CRM.sub }}>
            {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ""}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[12px] font-medium bg-white"
              style={{ border: "1px solid rgba(182,118,81,0.2)", color: CRM.ink }}
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={save}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold disabled:opacity-50"
              style={{ background: CRM.accentSoft, color: "#5b3038" }}
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save signature"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}