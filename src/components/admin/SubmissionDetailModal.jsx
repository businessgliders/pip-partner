import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mail, Phone, ExternalLink, MapPin, CalendarClock, XCircle, Video, ChevronDown, ChevronUp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/AuthContext";
import EmailThreadPanel from "../email/EmailThreadPanel";
import InternalNotesSection from "./InternalNotesSection";
import AssignTicketSection from "./AssignTicketSection";
import AttachmentsSection from "./AttachmentsSection";
import ResendBookingEmailsButton from "./ResendBookingEmailsButton";
import { StatusBadge, fullName, locationLabel, formatDate } from "./SubmissionsTable";
import { formatAppNumber } from "@/lib/appNumberDisplay";
import LocationMapBanner from "./LocationMapBanner";

const ENTITY_KEY_TO_NAME = {
  franchise: "FranchiseInquiry",
  influencer: "InfluencerApplication",
  instructor: "InstructorApplication",
  frontadmin: "FrontAdminApplication",
};

// Field keys already shown in the contact header — hide them from the detail list
const REDUNDANT_KEYS = new Set(["phone", "preferred_location", "location", "city", "province", "postal_code", "preferred_postal_code", "resume_url"]);

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
  highlightMessageId,
  markAsRead,
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  const handleAttachmentsChange = async (next) => {
    await base44.entities[entityName].update(row.id, { attachments: next });
    row.attachments = next;
    queryClient.invalidateQueries({ queryKey: ["app-board", entityName] });
  };

  const handleFolderCreated = async (folderId, folderUrl) => {
    await base44.entities[entityName].update(row.id, { drive_folder_id: folderId, drive_folder_url: folderUrl });
    row.drive_folder_id = folderId;
    row.drive_folder_url = folderUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-hidden p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] max-h-[92vh]">
          {/* Left: Contact + Email Communications */}
          <div
            className="flex flex-col overflow-hidden border-r order-1 lg:order-none min-h-0 max-h-[92vh]"
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
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <a
                    href="https://cal.com/pilatesinpink"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Cal.com"
                    className="inline-flex items-center gap-1.5 lg:px-2.5 px-2 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs text-slate-700"
                  >
                    <img
                      src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/56863071a_images-1.png"
                      alt="Cal.com"
                      className="w-4 h-4 rounded-sm"
                    />
                    <span className="hidden lg:inline">Cal.com</span>
                  </a>
                  {(() => {
                    const startIso = row._cal_booking?.start || row.scheduled_call_time;
                    if (!startIso) return null;
                    const d = new Date(startIso);
                    if (isNaN(d.getTime())) return null;
                    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
                    const label = isMobile 
                      ? d.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Toronto",
                        })
                      : d.toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Toronto",
                        });
                    const uid = row._cal_booking?.uid || row._cal_booking?.bookingId;
                    const rescheduleUrl = uid ? `https://cal.com/reschedule/${uid}` : null;
                    const cancelUrl = uid ? `https://cal.com/booking/${uid}?cancel=true` : null;
                    const calBookingUrl = uid ? `https://cal.com/booking/${uid}` : null;
                    const meetingUrlRaw = row._cal_booking?.meetingUrl || "";
                    const meetingUrl = /^https?:\/\//i.test(meetingUrlRaw) ? meetingUrlRaw : null;
                    return (
                      <div className="flex flex-row items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-200 transition whitespace-nowrap"
                              title="Manage booking"
                            >
                              📅 {label}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-56 p-1">
                            {uid ? (
                              <>
                                <a
                                  href={calBookingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                  Open meeting in Cal.com
                                </a>
                                <a
                                  href={rescheduleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                                >
                                  <CalendarClock className="w-3.5 h-3.5 text-emerald-700" />
                                  Reschedule on Cal.com
                                </a>
                                <a
                                  href={cancelUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  Cancel booking
                                </a>
                              </>
                            ) : (
                              <div className="px-2.5 py-2 text-xs text-slate-500">
                                No Cal.com booking linked. Open{" "}
                                <a
                                  href="https://app.cal.com/bookings/upcoming"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  Cal.com bookings
                                </a>
                                .
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        {meetingUrl && (
                          <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Join meeting"
                            className="inline-flex items-center justify-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-700 font-medium hover:bg-blue-200 transition lg:gap-1"
                          >
                            <Video className="w-3 h-3" />
                            <span className="hidden lg:inline">Join meeting</span>
                          </a>
                        )}
                        {tabKey === "franchise" && (
                          <ResendBookingEmailsButton
                            inquiryId={row.id}
                            scheduledTime={row.scheduled_call_time}
                            recipientEmail={row.email}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Email Communications */}
            <div className="flex-1 overflow-hidden p-4 bg-slate-50">
              {ticketType ? (
                <EmailThreadPanel
                  ticket={row}
                  ticketType={ticketType}
                  currentUser={user}
                  highlightMessageId={highlightMessageId}
                  markAsRead={markAsRead}
                />
              ) : (
                <div className="text-sm text-slate-500 p-6">Email not available for this submission.</div>
              )}
            </div>
          </div>

          {/* Right: Request Details + Assign To + Internal Notes */}
          <div className="relative overflow-y-auto bg-white order-2 lg:order-none">
            {/* Mobile/Tablet collapse toggle */}
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="lg:hidden w-full flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white sticky top-0 z-20"
            >
              <span className="text-xs tracking-wider uppercase text-slate-500 font-semibold">
                Request Details & Notes
              </span>
              {detailsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            <div className={`${detailsOpen ? "block" : "hidden"} lg:block`}>
            <LocationMapBanner
              postalCode={row.preferred_postal_code || row.postal_code}
              city={row.preferred_location || row.location || row.city}
              province={row.province}
              label={[row.preferred_location || row.location || row.city, row.province, row.preferred_postal_code || row.postal_code].filter(Boolean).join(" · ")}
            />
            <div className="relative z-10 p-5 space-y-4">
              <div>
                <p className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-2">
                  Request Details
                </p>
                <div className="space-y-1.5 mb-3 pb-3 border-b border-slate-200/70">
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
                  {(row.preferred_location || row.location || row.city || row.province || row.postal_code || row.preferred_postal_code) && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {[row.preferred_location || row.location || row.city, row.province, row.preferred_postal_code || row.postal_code].filter(Boolean).join(" · ")}
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

              <AttachmentsSection
                attachments={row.attachments || []}
                onChange={handleAttachmentsChange}
                accentColor={accentColor}
                currentUserEmail={user?.email}
                ticket={row}
                ticketType={ticketType}
                onFolderCreated={handleFolderCreated}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}