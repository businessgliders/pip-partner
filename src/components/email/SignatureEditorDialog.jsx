import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

/**
 * Quick-edit signature modal used from the email composer.
 * Mirrors the dedicated /Settings/Signature page but lets staff edit
 * without leaving the conversation.
 */
export default function SignatureEditorDialog({ open, onOpenChange, initialHtml = "", onSaved }) {
  const [signature, setSignature] = useState(initialHtml);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Re-sync when reopened so other tabs / fresh data isn't overwritten
  useEffect(() => {
    if (open) {
      setSignature(initialHtml || "");
      setSavedAt(null);
    }
  }, [open, initialHtml]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ signature_html: signature });
      setSavedAt(new Date());
      onSaved?.(signature);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Edit your signature</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-500 -mt-1">
          Appended automatically to every email you send from a submission.
        </p>
        <div className="bg-white border border-slate-200 rounded-lg">
          <ReactQuill theme="snow" value={signature} onChange={setSignature} className="bg-white" />
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Preview
          </div>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: signature || "<em>Empty</em>" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : "Not saved yet"}
          </span>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#b67651] hover:bg-[#a4694a] text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {saving ? "Saving..." : "Save Signature"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}