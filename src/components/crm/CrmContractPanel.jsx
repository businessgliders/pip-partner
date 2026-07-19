import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CRM } from "./crmTheme";
import { CONTRACT_STATUSES, leadFolderName } from "./contractsConfig";
import { displayName, getStatusLabel } from "@/components/board/boardConfig";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, FileText, FolderOpen, Loader2, Upload } from "lucide-react";

// Right panel of the Contracts hub: the selected lead's Drive contract folder.
export default function CrmContractPanel({ lead, group, currentUser, onBack }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const folderName = leadFolderName(lead);

  const { data: driveData, isLoading } = useQuery({
    queryKey: ["contract-files", group.key, lead.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("contractsDrive", {
        action: "list",
        group_label: group.groupLabel,
        lead_name: folderName,
      });
      return res.data;
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", lead.id],
    queryFn: () => base44.entities.Contract.filter({ ticket_id: lead.id }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["contract-files", group.key, lead.id] });
    queryClient.invalidateQueries({ queryKey: ["contracts", lead.id] });
    queryClient.invalidateQueries({ queryKey: ["contracts-all"] });
  };

  const statusMutation = useMutation({
    mutationFn: async ({ file, status }) => {
      const existing = contracts.find((c) => c.drive_file_id === file.id);
      if (existing) {
        await base44.entities.Contract.update(existing.id, { status });
      } else {
        await base44.entities.Contract.create({
          ticket_id: lead.id,
          ticket_type: group.entity,
          lead_type: group.key,
          lead_name: displayName(lead),
          status,
          drive_file_id: file.id,
          drive_file_url: file.webViewLink,
          file_name: file.name,
          uploaded_by: currentUser?.email,
        });
      }
    },
    onSuccess: invalidate,
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("contractsDrive", {
        action: "upload",
        group_label: group.groupLabel,
        lead_name: folderName,
        file_url,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
      });
      const uploaded = res.data?.file;
      if (uploaded?.id) {
        await base44.entities.Contract.create({
          ticket_id: lead.id,
          ticket_type: group.entity,
          lead_type: group.key,
          lead_name: displayName(lead),
          status: "draft",
          drive_file_id: uploaded.id,
          drive_file_url: uploaded.webViewLink,
          file_name: uploaded.name,
          uploaded_by: currentUser?.email,
        });
      }
      invalidate();
    } finally {
      setUploading(false);
    }
  };

  const files = driveData?.files || [];

  return (
    <div className="crm-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button type="button" onClick={onBack} className="lg:hidden p-1 -ml-1 rounded-lg" style={{ color: CRM.sub }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate" style={{ color: CRM.ink }}>{displayName(lead)}</h3>
            <p className="text-[11px]" style={{ color: CRM.sub }}>
              {group.label} · {getStatusLabel(group.key, lead.status)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {driveData?.folder?.url && (
            <a
              href={driveData.folder.url}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border"
              style={{ borderColor: "rgba(182,118,81,0.2)", color: CRM.brown }}
            >
              <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Open in Drive</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isLoading}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-white disabled:opacity-60"
            style={{ background: CRM.ink }}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Files */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: CRM.accent }} />
        </div>
      ) : files.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: CRM.accentSoft }} />
          <p className="text-sm font-medium" style={{ color: CRM.ink }}>No contracts yet</p>
          <p className="text-xs mt-1" style={{ color: CRM.sub }}>Upload the first file to create this lead's Drive folder.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(182,118,81,0.08)" }}>
          {files.map((file) => {
            const contract = contracts.find((c) => c.drive_file_id === file.id);
            const status = contract?.status || "draft";
            const statusMeta = CONTRACT_STATUSES.find((s) => s.key === status);
            return (
              <div key={file.id} className="flex items-center gap-3 py-3">
                <FileText className="w-4 h-4 shrink-0" style={{ color: CRM.brown }} />
                <div className="flex-1 min-w-0">
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm font-medium truncate hover:underline"
                    style={{ color: CRM.ink }}
                  >
                    {file.name}
                  </a>
                  <p className="text-[11px]" style={{ color: CRM.sub }}>
                    {file.modifiedTime ? format(new Date(file.modifiedTime), "MMM d, yyyy") : ""}
                  </p>
                </div>
                <select
                  value={status}
                  onChange={(e) => statusMutation.mutate({ file, status: e.target.value })}
                  className="h-8 text-[11px] font-semibold rounded-full px-2.5 border outline-none cursor-pointer"
                  style={{
                    color: statusMeta?.color,
                    borderColor: "rgba(182,118,81,0.15)",
                    background: "#fff",
                  }}
                >
                  {CONTRACT_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <a href={file.webViewLink} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg" style={{ color: CRM.sub }}>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}