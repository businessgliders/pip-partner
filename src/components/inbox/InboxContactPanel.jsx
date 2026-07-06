import React, { useState } from "react";
import { Mail, Phone, X, Hash, User as UserIcon, ExternalLink, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import FranchiseMeetingPills from "./FranchiseMeetingPills";
import InternalNotesSection from "@/components/admin/InternalNotesSection";
import FollowUpControl from "@/components/admin/FollowUpControl";
import { ConfirmDialog } from "@/components/board/BoardDialogs";
import {
  displayName,
  initials,
  avatarGradient,
  entityForSource,
} from "./inboxConfig";

function Field({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </div>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{value}</div>
    </div>
  );
}

export default function InboxContactPanel({
  ticket,
  sourceKey,
  detailFields = [],
  accent = "#b67651",
  onClose,
  currentUser,
}) {
  const queryClient = useQueryClient();
  const entity = entityForSource(sourceKey);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // On mobile/tablet the details panel opens as a slide-in drawer and the
  // full field list can push everything else out of view. Collapse it there
  // by default; xl+ (persistent side column) keeps it expanded.
  const [detailsExpanded, setDetailsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1280px)").matches;
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities[entity].delete(ticket.id);
      queryClient.invalidateQueries({ queryKey: ["app-board", entity] });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!ticket) return null;
  const name = displayName(ticket);
  const phone = [ticket.phone_country, ticket.phone].filter(Boolean).join(" ");

  const notes = Array.isArray(ticket.internal_notes) ? ticket.internal_notes : [];

  const saveNotes = async (next) => {
    await base44.entities[entity].update(ticket.id, { internal_notes: next });
    queryClient.invalidateQueries({ queryKey: ["app-board", entity] });
  };

  const handleAddNote = async (comment) => {
    const next = [
      ...notes,
      {
        user_email: currentUser?.email || "",
        user_name: currentUser?.full_name || currentUser?.email || "Staff",
        comment,
        timestamp: new Date().toISOString(),
      },
    ];
    await saveNotes(next);
  };

  const handleUpdateNote = async (index, comment) => {
    const next = notes.map((n, i) => (i === index ? { ...n, comment } : n));
    await saveNotes(next);
  };

  const handleDeleteNote = async (index) => {
    const next = notes.filter((_, i) => i !== index);
    await saveNotes(next);
  };

  return (
    <div className="h-full flex flex-col bg-white/95 rounded-2xl border border-white/40 backdrop-blur shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Details
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center text-center mb-4">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient(
              name
            )} flex items-center justify-center text-white text-lg font-bold shadow-lg`}
          >
            {initials(name)}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900">{name}</h3>
            {ticket.app_number && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-0.5">
                <Hash className="w-3 h-3" />
                {ticket.app_number}
              </span>
            )}
          </div>
          {ticket.email && (
            <a
              href={`mailto:${ticket.email}`}
              className="text-xs text-slate-600 hover:underline flex items-center gap-1 mt-1"
            >
              <Mail className="w-3 h-3" /> {ticket.email}
            </a>
          )}
          {phone && (
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {phone}
            </span>
          )}
        </div>

        {ticket.assigned_to && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {ticket.assigned_to.split("@")[0]}
            </span>
          </div>
        )}

        {/* Franchise-only: "Available Options" — FDD countdown sits above a
            Cal.com block whose buttons render in a 2-column grid. The grid
            override targets the inner flex container that FranchiseMeetingPills
            produces, turning each pill into a full-width grid cell. */}
        {sourceKey === "franchise" ? (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Available Options
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <FranchiseMeetingPills ticket={ticket} section="fdd" dedupeAgainstHeader />
              <div className="[&>div]:!grid [&>div]:!grid-cols-2 [&>div]:!gap-1.5 [&>div>*]:w-full [&>div>*]:justify-center">
                <FranchiseMeetingPills ticket={ticket} section="cal" dedupeAgainstHeader />
              </div>
              <FollowUpControl ticket={ticket} ticketType={entity} />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Available Options
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <FollowUpControl ticket={ticket} ticketType={entity} />
            </div>
          </div>
        )}

        <InternalNotesSection
          notes={notes}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          currentUserEmail={currentUser?.email}
          accentColor={accent}
        />

        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setDetailsExpanded((v) => !v)}
            className="w-full flex items-center justify-between py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold hover:text-slate-700 transition-colors"
          >
            <span>Details</span>
            {detailsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        {detailsExpanded && (
        <div>
          {detailFields.map((f) => {
            if (f.key === "phone") return null;
            const v = typeof f.get === "function" ? f.get(ticket) : ticket[f.key];
            if (v === undefined || v === null || v === "") return null;
            if (f.key === "resume_url") {
              return (
                <div
                  key={f.key}
                  className="py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    {f.label}
                  </div>
                  <a
                    href={v}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
                    style={{ background: `${accent}22`, color: accent }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Resume
                  </a>
                </div>
              );
            }
            return <Field key={f.key} label={f.label} value={v} />;
          })}
        </div>
        )}

        {/* Danger zone — delete ticket permanently */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting…" : "Delete ticket"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this ticket?"
        message={`This will permanently delete ${name}'s ticket and all of its associated data. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}