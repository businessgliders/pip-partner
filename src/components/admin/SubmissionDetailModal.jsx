import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mail, Phone, ExternalLink, MapPin, CalendarClock, XCircle, Video, ChevronDown, ChevronUp, Info, ArrowLeft } from "lucide-react";
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
import StatusDropdown from "./StatusDropdown";
import SubmitterCalBookingsPopover from "./SubmitterCalBookingsPopover";
import { BOARD_TYPES } from "../board/boardConfig";
import { displayAppNumber } from "@/lib/appNumberDisplay";
import LocationMapBanner from "./LocationMapBanner";
import FddCountdownBadge from "./FddCountdownBadge";

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
  // Mobile (< md) uses a tab-style switch so the conversation gets the full
  // viewport height by default. Desktop (md+) keeps the two columns
  // side-by-side and ignores this state.
  const [mobileTab, setMobileTab] = useState("conversation");
  const threadRef = useRef(null);
  // One-shot "jiggle" animation key. Bumped every time the modal opens via a
  // notification click (signalled by a non-empty highlightMessageId). The key
  // change re-mounts the animated class so the keyframe plays exactly once.
  const [jiggleKey, setJiggleKey] = useState(0);
  useEffect(() => {
    if (open && highlightMessageId) {
      setJiggleKey((k) => k + 1);
    }
  }, [open, highlightMessageId]);
  // Reset the mobile tab whenever a new submission is opened so users always
  // land on the conversation view first.
  useEffect(() => {
    if (open) setMobileTab("conversation");
  }, [open, row?.id]);
  if (!row) return null;

  // Intercept modal close (backdrop, Esc, or close button) so that any unsaved
  // composer draft prompts the save/discard dialog before the modal disappears.
  const handleOpenChange = (next) => {
    if (next) {
      onOpenChange(next);
      return;
    }
    const api = threadRef.current;
    if (api?.hasUnsavedDraft?.()) {
      api.tryClose(() => onOpenChange(false));
      return;
    }
    onOpenChange(false);
  };

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

  const handleUpdateNote = async (index, newComment) => {
    const existing = Array.isArray(row.internal_notes) ? row.internal_notes : [];
    if (index < 0 || index >= existing.length) return;
    const updated = existing.map((n, i) =>
      i === index ? { ...n, comment: newComment, edited_at: new Date().toISOString() } : n
    );
    await base44.entities[entityName].update(row.id, { internal_notes: updated });
    row.internal_notes = updated;
    queryClient.invalidateQueries({ queryKey: ["app-board", entityName] });
  };

  const handleDeleteNote = async (index) => {
    const existing = Array.isArray(row.internal_notes) ? row.internal_notes : [];
    if (index < 0 || index >= existing.length) return;
    const updated = existing.filter((_, i) => i !== index);
    await base44.entities[entityName].update(row.id, { internal_notes: updated });
    row.internal_notes = updated;
    queryClient.invalidateQueries({ queryKey: ["app-board", entityName] });
  };

  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === row.status) return;
    const history = Array.isArray(row.status_history) ? row.status_history : [];
    const updated = [
      ...history,
      {
        status: newStatus,
        note: "",
        by_name: user?.full_name || user?.email?.split("@")[0] || "Staff",
        timestamp: new Date().toISOString(),
      },
    ];
    await base44.entities[entityName].update(row.id, { status: newStatus, status_history: updated });
    row.status = newStatus;
    row.status_history = updated;
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        key={`jiggle-${jiggleKey}`}
        className={`max-w-7xl sm:max-w-2xl md:max-w-4xl lg:max-w-7xl xl:max-w-[81rem] max-h-[92vh] overflow-hidden p-0 ${
          jiggleKey > 0 ? "pip-jiggle" : ""
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] lg:grid-cols-[3fr_2fr] max-h-[92vh]">
          {/* Left: Contact + Email Communications
              Mobile: hidden when the user has switched to the details tab. */}
           <div
             className={`flex-col overflow-hidden border-r order-1 md:order-none min-h-0 max-h-[92vh] ${
               mobileTab === "details" ? "hidden md:flex" : "flex"
             }`}
             style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf3ec 100%)" }}
           >
            {/* Header (fixed) */}
            <div className="p-6 border-b shrink-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: accentColor }}>
                      Submission {(row.display_ticket_number || row.app_number) ? `#${displayAppNumber(row, tabKey)}` : ""}
                    </p>
                    {/* Mobile-only: jump to the details panel (contact info,
                        request details, notes, attachments). Frees up the
                        whole viewport for the conversation on mobile. */}
                    <button
                      type="button"
                      onClick={() => setMobileTab("details")}
                      className="md:hidden inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Show details"
                    >
                      <Info className="w-3 h-3" />
                      Details
                    </button>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{displayName}</h2>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <StatusDropdown
                      status={row.status}
                      statuses={BOARD_TYPES.find((b) => b.key === tabKey)?.statuses || []}
                      onChange={handleStatusChange}
                    />
                    <span className="text-xs text-slate-500">{formatDate(row.created_date)}</span>
                    {tabKey === "franchise" && <FddCountdownBadge ticketId={row.id} ticket={row} />}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1 mt-6">
                  <div className="hidden lg:block">
                    <SubmitterCalBookingsPopover email={row.email} />
                  </div>
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
                      <div className="flex flex-col-reverse lg:flex-row items-start lg:items-center gap-2 lg:gap-1">
                        <div className="flex flex-row items-center gap-1">
                          <div className="lg:hidden">
                            <SubmitterCalBookingsPopover email={row.email} />
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-200 transition whitespace-nowrap"
                                title="Manage booking"
                              >
                                📅 <span className="hidden lg:inline">{label}</span>
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
                        <button
                          type="button"
                          className="w-full lg:w-auto text-left lg:text-center inline-flex lg:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-200 transition whitespace-nowrap lg:hidden"
                          title="Call time"
                        >
                          📅 {label}
                        </button>
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
                  ref={threadRef}
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

          {/* Right: Request Details + Assign To + Internal Notes
              Mobile: hidden by default (conversation gets full height); shows
              when the user taps the "Details" button in the conversation
              header. A back arrow returns to the conversation. */}
          <div
            className={`relative overflow-y-auto bg-white order-2 md:order-none hide-scrollbar ${
              mobileTab === "details" ? "block" : "hidden md:block"
            } max-h-[92vh]`}
          >
            {/* Mobile back button — sticky so it stays reachable while scrolling. */}
            <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileTab("conversation")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" /> Conversation
              </button>
              <span className="text-[11px] text-slate-500 truncate max-w-[60%]">{displayName}</span>
            </div>
            <LocationMapBanner
              postalCode={row.preferred_postal_code || row.postal_code}
              city={row.preferred_location || row.location || row.city}
              province={row.province}
              label={[row.preferred_location || row.location || row.city, row.province, row.preferred_postal_code || row.postal_code].filter(Boolean).join(" · ")}
            />
            {/* Always-visible basic contact info */}
            <div className="relative z-10 p-5 space-y-1.5 border-b border-slate-200/70">
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

            {/* Toggle for additional request details */}
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="relative z-30 w-full flex items-center justify-between px-5 py-3"
            >
              <span className="text-xs tracking-wider uppercase text-slate-500 font-semibold">
                {detailsOpen ? "Hide" : "Show"} Additional Details
              </span>
              {detailsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Collapsible additional form fields */}
            {detailsOpen && (
              <div className="relative z-10 p-5 space-y-4 border-b border-slate-200/70">
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
            )}

            {/* Always-visible admin sections */}
            <div className="relative z-10 p-5 pb-2 space-y-4">
              <AssignTicketSection
                assignedTo={row.assigned_to}
                onAssign={handleAssign}
                accentColor={accentColor}
                defaultExpanded={user?.role !== "admin"}
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
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                currentUserEmail={user?.email}
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