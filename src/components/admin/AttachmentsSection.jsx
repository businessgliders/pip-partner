import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, Link2, FileText, Trash2, ExternalLink, Loader2, Upload, Plus } from "lucide-react";
import DrivePickerDialog from "./DrivePickerDialog";

// Reusable attachments section for ticket detail modal.
// Persists attachments on the entity (FranchiseInquiry / InfluencerApplication / etc.).
// Each attachment: { label, url, type: 'file' | 'link', uploaded_by, uploaded_at }
export default function AttachmentsSection({
  attachments = [],
  onChange,
  accentColor = "#0f172a",
  currentUserEmail = "",
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [driveOpen, setDriveOpen] = useState(false);

  const handleDrivePick = async (picked) => {
    if (!picked?.length) return;
    const additions = picked.map((p) => ({
      label: p.label,
      url: p.url,
      type: "link",
      uploaded_by: currentUserEmail,
      uploaded_at: new Date().toISOString(),
    }));
    await onChange([...(attachments || []), ...additions]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newAttachment = {
        label: file.name,
        url: file_url,
        type: "file",
        uploaded_by: currentUserEmail,
        uploaded_at: new Date().toISOString(),
      };
      await onChange([...(attachments || []), newAttachment]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    let normalizedUrl = url;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    const newAttachment = {
      label: linkLabel.trim() || normalizedUrl,
      url: normalizedUrl,
      type: "link",
      uploaded_by: currentUserEmail,
      uploaded_at: new Date().toISOString(),
    };
    await onChange([...(attachments || []), newAttachment]);
    setLinkLabel("");
    setLinkUrl("");
    setShowLinkForm(false);
  };

  const handleRemove = async (index) => {
    const next = [...(attachments || [])];
    next.splice(index, 1);
    await onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
          Attachments & Links
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-white disabled:opacity-50"
            style={{ background: accentColor }}
            title="Upload a file"
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            File
          </button>
          <button
            type="button"
            onClick={() => setDriveOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border bg-white"
            style={{ color: accentColor, borderColor: accentColor }}
            title="Browse Google Drive"
          >
            <img
              src="https://www.google.com/s2/favicons?sz=16&domain=drive.google.com"
              alt=""
              className="w-3 h-3"
            />
            Drive
          </button>
          <button
            type="button"
            onClick={() => setShowLinkForm((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border"
            style={{ color: accentColor, borderColor: accentColor }}
            title="Add a URL"
          >
            <Link2 className="w-3 h-3" />
            Link
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {showLinkForm && (
        <div className="mb-2 p-2 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
          <input
            type="text"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Label (e.g., NDA Google Doc)"
            className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => { setShowLinkForm(false); setLinkLabel(""); setLinkUrl(""); }}
              className="text-[11px] px-2 py-1 rounded text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="text-[11px] px-2 py-1 rounded text-white disabled:opacity-50"
              style={{ background: accentColor }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {(attachments || []).length === 0 ? (
        <p className="text-xs text-slate-400 italic">No attachments yet</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a, idx) => {
            let favicon = null;
            if (a.type === "link" && /^https?:\/\//i.test(a.url)) {
              try {
                const domain = new URL(a.url).hostname;
                favicon = `https://www.google.com/s2/favicons?sz=16&domain=${encodeURIComponent(domain)}`;
              } catch (_) {}
            }
            return (
              <li
                key={idx}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-slate-200 bg-white group"
              >
                {favicon ? (
                  <img src={favicon} alt="" className="w-3.5 h-3.5 rounded shrink-0" />
                ) : a.type === "link" ? (
                  <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-700 truncate flex-1 hover:underline"
                  title={a.url}
                >
                  {a.label}
                </a>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700"
                  title="Open"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <DrivePickerDialog
        open={driveOpen}
        onOpenChange={setDriveOpen}
        onPick={handleDrivePick}
        multiple
      />
    </div>
  );
}