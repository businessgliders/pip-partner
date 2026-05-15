import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mail, Phone, ExternalLink, MapPin } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import EmailThreadPanel from "../email/EmailThreadPanel";
import InternalNotesSection from "./InternalNotesSection";
import AssignTicketSection from "./AssignTicketSection";
import { StatusBadge, fullName, locationLabel, formatDate } from "./SubmissionsTable";
import { formatAppNumber } from "@/lib/appNumberDisplay";

const ENTITY_KEY_TO_NAME = {
  franchise: "FranchiseInquiry",
  influencer: "InfluencerApplication",
  instructor: "InstructorApplication",
  frontadmin: "FrontAdminApplication",
};

// Field keys already shown in the contact header — hide them from the detail list
const REDUNDANT_KEYS = new Set(["phone", "preferred_location", "location", "city", "province"]);

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  const str = String(value);
  const isLong = str.length > 200;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">{label}</span>
      {isLong ? (
        <div className="text-sm text-slate-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto pr-2 bg-white/60 rounded-md border border-slate-100 p-2">
          {str}
        </div>
      ) : (
        <span className="text-sm text-slate-700 break-words">{str}</span>
      )}
    </div>
  );
}

export default function SubmissionDetailModal({
  open,
  onOpenChange,
  row,
  tabKey,
  detailFields = [],
  accentColor = "#0f172a",
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  if (!row) return null;

  const ticketType = ENTITY_KEY_TO_NAME[tabKey];
  const entityName = ticketType;
  const displayName = row.full_name || fullName(row);

  const handleAddNote = async (comment) => {
    const existing = Array.isArray(row.internal_notes) ? row.internal_notes : [];
    const newNote = {
      user_email: user?.email || "",
      user_name: user?.full_name || user?.email?.split("@")[0] || "Staff",
      comment,
      timestamp: new Date().toISOString(),
    };
    const updated = [...existing, newNote];
    await base44.entities[entityName].update(row.id, { internal_notes: updated });
    row.internal_notes = updated;
    queryClient.invalidateQueries({ queryKey: ["app-board", entityName] });
  };

  const handleAssign = async (email) => {
    await base44.entities[entityName].update(row.id, { assigned_to: email });
    row.assigned_to = email;
    queryClient.invalidateQueries({ queryKey: ["app-board", entityName] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-hidden p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] max-h-[92vh]">
          {/* Left: Contact + Email Communications */}
          <div
            className="flex flex-col overflow-hidden border-r"
            style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf3ec 100%)" }}
          >
            {/* Header (fixed) */}
            <div className="p-6 border-b shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase font-semibold mb-1" style={{ color: accentColor }}>
                    Submission {row.app_number ? `#${formatAppNumber(row.app_number, tabKey)}` : ""}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">{displayName}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={row.status} />
                    <span className="text-xs text-slate-500">{formatDate(row.created_date)}</span>
                  </div>
                </div>
                <a
                  href="https://cal.com/pilatesinpink"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Cal.com"
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs text-slate-700"
                >
                  <img
                    src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/56863071a_images-1.png"
                    alt="Cal.com"
                    className="w-4 h-4 rounded-sm"
                  />
                  Cal.com
                </a>
              </div>
            </div>

            {/* Email Communications */}
            <div className="flex-1 overflow-hidden p-4 bg-slate-50">
              {ticketType ? (
                <EmailThreadPanel
                  ticket={row}
                  ticketType={ticketType}
                  currentUser={user}
                />
              ) : (
                <div className="text-sm text-slate-500 p-6">Email not available for this submission.</div>
              )}
            </div>
          </div>

          {/* Right: Request Details + Assign To + Internal Notes */}
          <div className="overflow-y-auto p-6 bg-white">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-3">
                  Request Details
                </p>
                <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                  {row.email && (
                    <a
                      href={`mailto:${row.email}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {row.email}
                    </a>
                  )}
                  {row.phone && (
                    <a
                      href={`tel:${row.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {[row.phone_country, row.phone].filter(Boolean).join(" ")}
                    </a>
                  )}
                  {(row.preferred_location || row.location || row.city || row.province) && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {[row.preferred_location || row.location || row.city, row.province].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {row.resume_url && (
                    <a
                      href={row.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Resume
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {detailFields
                    .filter((f) => !REDUNDANT_KEYS.has(f.key))
                    .map((f) => (
                      <Field
                        key={f.key}
                        label={f.label}
                        value={typeof f.get === "function" ? f.get(row) : row[f.key]}
                      />
                    ))}
                </div>
              </div>

              <AssignTicketSection
                assignedTo={row.assigned_to}
                onAssign={handleAssign}
                accentColor={accentColor}
              />

              <InternalNotesSection
                notes={row.internal_notes || []}
                onAddNote={handleAddNote}
                accentColor={accentColor}
                large
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}