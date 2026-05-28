import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, List, Link as LinkIcon,
  Sparkles, Lightbulb, Wand2, Trash2, Send, X, Loader2, CalendarDays, Users,
  Paperclip, FileText, Link2, Maximize2, Minimize2
} from "lucide-react";
import {
  Popover, PopoverTrigger, PopoverContent
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import TemplatePicker from "./TemplatePicker";
import AiAssistBar from "./AiAssistBar";
import BookCallPopover from "./BookCallPopover";
import DrivePickerDialog from "../admin/DrivePickerDialog";

const STAFF_DOMAINS = ["pilatesinpinkstudio.com", "pilatesinpink.ca"];
const isStaffEmail = (e) =>
  !!e && STAFF_DOMAINS.some((d) => e.toLowerCase().endsWith(`@${d}`));

function isEmpty(html) {
  return !(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
}

// Mirror of FROM_ALIASES in functions/sendTicketEmail.js — kept in sync for display only
const FROM_ALIASES = {
  FranchiseInquiry: "franchise@pilatesinpinkstudio.com",
  InfluencerApplication: "partner@pilatesinpinkstudio.com",
  InstructorApplication: "hire@pilatesinpinkstudio.com",
  FrontAdminApplication: "hire@pilatesinpinkstudio.com",
};

export default function EmailComposer({
  ticket,
  ticketType,
  currentUser,
  onSent,
  onCancel,
  isMobileFullscreen,
  onRequestFullscreen,
  isFullscreen,
  editorHeightPx,
}) {
  const editorRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [showDescribe, setShowDescribe] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null); // { start, timeZone, friendly }
  const [teamMembers, setTeamMembers] = useState([]);
  // Selected team-member emails (in addition to the applicant). Empty = applicant only.
  // If applicant is excluded (toggled off), the message becomes "internal".
  const [selectedTeam, setSelectedTeam] = useState([]); // array of emails
  const [includeApplicant, setIncludeApplicant] = useState(true);
  // Indices into ticket.attachments[] that should be appended to the outgoing email
  const [selectedAttachmentIdxs, setSelectedAttachmentIdxs] = useState([]);
  // Ad-hoc Drive files picked just for this email (not persisted on ticket)
  const [driveAttachments, setDriveAttachments] = useState([]); // [{label, url, type:'link'}]
  const [driveOpen, setDriveOpen] = useState(false);
  // Subject override — only set when a template is used so the staff can tweak it
  const [subjectOverride, setSubjectOverride] = useState(null);
  // Tracks whether the editor currently has any content (for compact-when-empty UI)
  const [hasContent, setHasContent] = useState(false);

  const ticketAttachments = Array.isArray(ticket?.attachments) ? ticket.attachments : [];

  // Load team members (staff-domain users) via a backend function that uses
  // service role — the built-in User entity RLS only lets admins list other
  // users, so a direct entities.User.list call would return just the current
  // user for non-admin staff.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("listStaffMembers", {});
        const members = res?.data?.members || [];
        const staff = members.filter((u) => u.email !== currentUser?.email);
        if (!cancelled) setTeamMembers(staff);
      } catch (e) {
        console.error("Failed to load team members", e);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const ticketEmail = ticket?.email || "";
  const ticketName =
    ticket?.full_name ||
    `${ticket?.first_name || ""} ${ticket?.last_name || ""}`.trim() ||
    ticketEmail;
  const firstName = ticket?.first_name || (ticket?.full_name || "").split(" ")[0] || "";

  const vars = {
    client_name: ticketName,
    client_first_name: firstName,
    client_email: ticketEmail,
    client_phone: ticket?.phone || "",
    inquiry_type: ticketType,
    ticket_id: ticket?.id || "",
    staff_name: currentUser?.full_name || "",
    staff_first_name: (currentUser?.full_name || "").split(" ")[0] || "",
    staff_email: currentUser?.email || "",
  };

  const setHtml = (html) => {
    if (editorRef.current) editorRef.current.innerHTML = html;
    setHasContent(!isEmpty(html));
  };
  const getHtml = () => editorRef.current?.innerHTML || "";

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleInsertLink = () => {
    const editor = editorRef.current;
    if (!editor) return;

    // Make sure focus is in the editor so the selection is valid
    editor.focus();

    const selection = window.getSelection();
    const hasSelectionInEditor =
      selection &&
      selection.rangeCount > 0 &&
      !selection.isCollapsed &&
      editor.contains(selection.anchorNode);

    const selectedText = hasSelectionInEditor ? selection.toString() : "";

    const rawUrl = window.prompt("Enter URL", "https://");
    if (!rawUrl) return;
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed === "https://" || trimmed === "http://") return;

    // Normalize: add https:// if no scheme and it's not a mailto/tel link
    const href = /^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    if (hasSelectionInEditor) {
      // Wrap the selected text with a link
      document.execCommand("createLink", false, href);
      // Make the newly-created link open in a new tab
      const anchors = editor.querySelectorAll(`a[href="${href}"]`);
      anchors.forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
    } else {
      // No selection — ask for visible text and insert a fresh anchor
      const linkText = window.prompt("Link text", href) || href;
      const safeText = linkText.replace(/[<>&]/g, (c) =>
        ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])
      );
      const html = `<a href="${href}" target="_blank" rel="noopener noreferrer">${safeText}</a>&nbsp;`;
      document.execCommand("insertHTML", false, html);
    }
  };

  // Build the actual recipient list to send
  const recipientEmails = [
    ...(includeApplicant && ticketEmail ? [ticketEmail] : []),
    ...selectedTeam,
  ];
  const isInternalSend = recipientEmails.length > 0 && !includeApplicant;
  const canSend = recipientEmails.length > 0;

  const handleSend = async () => {
    const html = getHtml();
    if (isEmpty(html) || sending || !canSend) return;
    setSending(true);
    try {
      // 1. Send the email first. If this fails, we never book the slot.
      const payload = {
        ticket_id: ticket.id,
        ticket_type: ticketType,
        body_html: html,
      };
      // Only pass overrides when the recipient set differs from "just the applicant"
      const isDefaultRecipientSet = includeApplicant && selectedTeam.length === 0;
      if (!isDefaultRecipientSet) {
        payload.to_emails_override = recipientEmails;
      }
      const combinedAttachments = [
        ...selectedAttachmentIdxs
          .map((i) => ticketAttachments[i])
          .filter((a) => a && a.url)
          .map((a) => ({ label: a.label || a.url, url: a.url, type: a.type || "link" })),
        ...driveAttachments.map((a) => ({ label: a.label || a.url, url: a.url, type: "link" })),
      ];
      if (combinedAttachments.length > 0) {
        payload.attachments = combinedAttachments;
      }
      if (subjectOverride && subjectOverride.trim()) {
        payload.subject_override = subjectOverride.trim();
      }
      await base44.functions.invoke("sendTicketEmail", payload);

      // 2. Only book the Cal.com slot AFTER a successful send (skip for internal emails).
      if (pendingBooking && !isInternalSend) {
        try {
          await base44.functions.invoke("bookCalEvent", {
            start: pendingBooking.start,
            timeZone: pendingBooking.timeZone,
            name: ticketName,
            email: ticketEmail,
            phone: ticket?.phone || "",
            notes: `Booked by staff from admin board (ticket ${ticket?.id || ""})`,
            inquiryId: ticket?.id,
            boardKey: ticketType === 'FranchiseInquiry' ? 'franchise' : 'hiring',
          });
        } catch (bookErr) {
          console.error("bookCalEvent failed after send", bookErr);
          alert(
            "Email was sent, but the meeting could not be booked — that slot may have just been taken. Please book another time manually."
          );
        }
      }

      setHtml("");
      setPendingBooking(null);
      setSelectedTeam([]);
      setIncludeApplicant(true);
      setSelectedAttachmentIdxs([]);
      setDriveAttachments([]);
      setSubjectOverride(null);
      onSent?.();
    } catch (e) {
      console.error(e);
      alert("Failed to send: " + (e?.response?.data?.error || e.message));
    } finally {
      setSending(false);
    }
  };

  const handlePolish = async () => {
    const html = getHtml();
    if (isEmpty(html) || polishing) return;
    setPolishing(true);
    try {
      const res = await base44.functions.invoke("aiEmailAssist", {
        mode: "polish",
        ticket_id: ticket.id,
        ticket_type: ticketType,
        draft: html,
      });
      setHtml(res.data.body_html || html);
    } catch (e) {
      console.error(e);
    } finally {
      setPolishing(false);
    }
  };

  const handleClear = () => {
    setHtml("");
    setSubjectOverride(null);
  };

  const handleTemplate = ({ subject, body_html }) => {
    setHtml(body_html);
    if (subject) setSubjectOverride(subject);
  };
  const handleApply = (html) => {
    setHtml(html);
    setShowDescribe(false);
    setShowSuggest(false);
  };

  const handleSlotSelected = ({ start, timeZone, friendly }) => {
    setPendingBooking({ start, timeZone, friendly });
    const greetingName = firstName || ticketName || "there";
    const block = `
<p style="margin:0 0 12px;">Hi ${greetingName},</p>
<p style="margin:0 0 12px;">Booked a meeting for you on:</p>
<p style="margin:0 0 12px;"><strong>${friendly} (America/Toronto)</strong></p>
<p style="margin:0 0 12px;">You'll receive a calendar invite shortly with all the details.</p>
<p style="margin:0 0 12px;">Looking forward to chatting!</p>
`.trim();
    const current = getHtml();
    setHtml(current ? `${block}<br/>${current}` : block);
  };

  return (
    <div className={`border-t bg-white space-y-3 ${isMobileFullscreen ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between text-xs text-gray-600 gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div>
            <span className="font-medium">From:</span> {FROM_ALIASES[ticketType] || "—"}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">To:</span>
            {/* Recipient chips */}
            <div className="flex items-center gap-1 flex-wrap">
              {includeApplicant && ticketEmail && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700">
                  <span className="truncate max-w-[200px]">{ticketEmail}</span>
                  {selectedTeam.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIncludeApplicant(false)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Remove applicant"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              )}
              {selectedTeam.map((email) => {
                const member = teamMembers.find((m) => m.email === email);
                const label = member?.full_name || email;
                return (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-300 bg-amber-50 text-xs text-amber-900"
                  >
                    <Users className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">{label}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTeam((cur) => cur.filter((e) => e !== email))}
                      className="text-amber-600 hover:text-amber-900"
                      title="Remove recipient"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            {/* Add picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                  title="Add recipient"
                >
                  + Add
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0 max-h-80 overflow-y-auto">
                <div className="p-2 border-b">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">
                    Applicant
                  </p>
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <Checkbox
                      checked={includeApplicant}
                      onCheckedChange={(v) => setIncludeApplicant(!!v)}
                      disabled={!ticketEmail}
                    />
                    <span className="truncate text-sm">{ticketEmail || "—"}</span>
                  </label>
                </div>
                {teamMembers.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">
                      Team members
                    </p>
                    {teamMembers.map((m) => {
                      const checked = selectedTeam.includes(m.email);
                      return (
                        <label
                          key={m.id || m.email}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              if (v) {
                                setSelectedTeam((cur) => Array.from(new Set([...cur, m.email])));
                              } else {
                                setSelectedTeam((cur) => cur.filter((e) => e !== m.email));
                              }
                            }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm">{m.full_name || m.email}</span>
                            {m.full_name && (
                              <span className="truncate text-[10px] text-gray-500">{m.email}</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
            {isInternalSend && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-semibold">
                INTERNAL
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onRequestFullscreen && (
            <button
              onClick={onRequestFullscreen}
              className="text-gray-400 hover:text-gray-700 p-1"
              title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
              type="button"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 p-1" type="button">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {subjectOverride !== null && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold shrink-0">
            Subject
          </label>
          <input
            type="text"
            value={subjectOverride}
            onChange={(e) => setSubjectOverride(e.target.value)}
            placeholder="Email subject"
            className="flex-1 min-w-0 text-sm px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-300"
          />
          <button
            type="button"
            onClick={() => setSubjectOverride(null)}
            className="text-gray-400 hover:text-gray-700"
            title="Use default subject"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 lg:gap-1.5">
        <Button
          size="sm"
          variant={showDescribe ? "default" : "outline"}
          className={`${isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"} ${showDescribe ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-700 border-purple-200 hover:bg-purple-50"}`}
          onClick={() => { setShowDescribe((v) => !v); setShowSuggest(false); }}
          title="Describe in simple words"
        >
          <Sparkles className="w-3.5 h-3.5 lg:mr-1.5" />
          <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Describe</span>
        </Button>
        <Button
          size="sm"
          variant={showSuggest ? "default" : "outline"}
          className={`${isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"} ${showSuggest ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-700 border-purple-200 hover:bg-purple-50"}`}
          onClick={() => { setShowSuggest((v) => !v); setShowDescribe(false); }}
          title="Suggest replies"
        >
          <Lightbulb className="w-3.5 h-3.5 lg:mr-1.5" />
          <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Suggest</span>
        </Button>
        <TemplatePicker vars={vars} onSelect={handleTemplate} isMobileFullscreen={isMobileFullscreen} />
        <BookCallPopover onSelect={handleSlotSelected} isMobileFullscreen={isMobileFullscreen} boardKey={ticketType === 'FranchiseInquiry' ? 'franchise' : 'hiring'} />
        <Button
          size="sm"
          variant="outline"
          className={`text-slate-700 border-slate-200 hover:bg-slate-50 ${isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"}`}
          onClick={() => setDriveOpen(true)}
          title="Attach from Google Drive"
        >
          <img
            src="https://www.google.com/s2/favicons?sz=16&domain=drive.google.com"
            alt=""
            className={`w-3.5 h-3.5 ${isMobileFullscreen ? "" : "lg:mr-1.5"}`}
          />
          <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Drive</span>
          {driveAttachments.length > 0 && (
            <span className={`rounded-full bg-pink-100 text-pink-700 text-[10px] font-semibold ${isMobileFullscreen ? "ml-1 px-1 py-0" : "ml-1.5 px-1.5 py-0.5"}`}>
              {driveAttachments.length}
            </span>
          )}
        </Button>
        {ticketAttachments.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={`text-slate-700 border-slate-200 hover:bg-slate-50 ${isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"}`}
                title="Attach ticket files"
              >
                <Paperclip className={`w-3.5 h-3.5 ${isMobileFullscreen ? "" : "lg:mr-1.5"}`} />
                <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Attach</span>
                {selectedAttachmentIdxs.length > 0 && (
                  <span className={`rounded-full bg-pink-100 text-pink-700 text-[10px] font-semibold ${isMobileFullscreen ? "ml-1 px-1 py-0" : "ml-1.5 px-1.5 py-0.5"}`}>
                    {selectedAttachmentIdxs.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2 max-h-72 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">
                Attach from ticket
              </p>
              {ticketAttachments.map((a, idx) => {
                const checked = selectedAttachmentIdxs.includes(idx);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setSelectedAttachmentIdxs((cur) =>
                          v ? Array.from(new Set([...cur, idx])) : cur.filter((i) => i !== idx)
                        );
                      }}
                    />
                    {a.type === "link" ? (
                      <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate text-sm flex-1">{a.label || a.url}</span>
                  </label>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {(selectedAttachmentIdxs.length > 0 || driveAttachments.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Attached:</span>
          {selectedAttachmentIdxs.map((idx) => {
            const a = ticketAttachments[idx];
            if (!a) return null;
            return (
              <span
                key={`t-${idx}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700"
              >
                {a.type === "link" ? <Link2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                <span className="truncate max-w-[160px]">{a.label || a.url}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAttachmentIdxs((cur) => cur.filter((i) => i !== idx))
                  }
                  className="text-slate-400 hover:text-slate-700"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {driveAttachments.map((a, i) => (
            <span
              key={`d-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700"
            >
              <img
                src="https://www.google.com/s2/favicons?sz=16&domain=drive.google.com"
                alt=""
                className="w-3 h-3"
              />
              <span className="truncate max-w-[160px]">{a.label || a.url}</span>
              <button
                type="button"
                onClick={() =>
                  setDriveAttachments((cur) => cur.filter((_, j) => j !== i))
                }
                className="text-slate-400 hover:text-slate-700"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {pendingBooking && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              Meeting will be booked for <strong>{pendingBooking.friendly}</strong> when you send this email.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPendingBooking(null)}
            className="text-amber-700 hover:text-amber-900"
            title="Cancel pending booking"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <AiAssistBar
        ticketId={ticket.id}
        ticketType={ticketType}
        onApply={handleApply}
        showDescribe={showDescribe}
        showSuggest={showSuggest}
      />

      <DrivePickerDialog
        open={driveOpen}
        onOpenChange={setDriveOpen}
        onPick={(picked) => {
          setDriveAttachments((cur) => {
            const seen = new Set(cur.map((c) => c.url));
            return [...cur, ...picked.filter((p) => !seen.has(p.url))];
          });
        }}
        multiple
      />

      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-1 border-b bg-gray-50 px-2 py-1">
          <button type="button" onClick={() => exec("bold")} className="p-1.5 hover:bg-gray-200 rounded">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => exec("italic")} className="p-1.5 hover:bg-gray-200 rounded">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => exec("insertUnorderedList")} className="p-1.5 hover:bg-gray-200 rounded">
            <List className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleInsertLink} className="p-1.5 hover:bg-gray-200 rounded">
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          data-placeholder="Write your reply..."
          onInput={(e) => setHasContent(!isEmpty(e.currentTarget.innerHTML))}
          style={editorHeightPx ? { height: `${editorHeightPx}px`, maxHeight: "none" } : undefined}
          className={`prose prose-sm max-w-none p-3 overflow-y-auto focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 ${
            editorHeightPx
              ? ""
              : isFullscreen
                ? "min-h-32 max-h-[28vh]"
                : isMobileFullscreen
                  ? (hasContent ? "min-h-24 max-h-48" : "min-h-14 max-h-48")
                  : (hasContent ? "min-h-32 max-h-80" : "min-h-16 max-h-80")
          }`}
          suppressContentEditableWarning
        />
        {currentUser?.signature_html && (
          <div className="border-t bg-gray-50/60 px-3 py-1.5">
            <div className="text-[8px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
              Signature
            </div>
            <div
              className="prose prose-xs max-w-none text-gray-600 text-xs [&_p]:!m-0 [&_p:not(:last-child)]:!mb-0.5"
              dangerouslySetInnerHTML={{ __html: currentUser.signature_html }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={handleClear} title="Clear draft" className={isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"}>
            <Trash2 className={`w-3.5 h-3.5 ${isMobileFullscreen ? "" : "lg:mr-1.5"}`} />
            <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Clear</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handlePolish} disabled={polishing} title="Polish with AI" className={isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"}>
            {polishing ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${isMobileFullscreen ? "" : "lg:mr-1.5"}`} /> : <Wand2 className={`w-3.5 h-3.5 ${isMobileFullscreen ? "" : "lg:mr-1.5"}`} />}
            <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Polish</span>
          </Button>
        </div>
        <Button size="sm" onClick={handleSend} disabled={sending || !canSend} className={`bg-pink-600 hover:bg-pink-700 text-white ${isMobileFullscreen ? "p-1.5" : "lg:px-3 px-2"}`}>
          {sending ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${isMobileFullscreen ? "" : "lg:mr-1.5"}`} /> : <Send className={`w-3.5 h-3.5 ${isMobileFullscreen ? "" : "lg:mr-1.5"}`} />}
          <span className={isMobileFullscreen ? "hidden" : "hidden lg:inline"}>Send Reply</span>
          <span className={isMobileFullscreen ? "hidden" : "lg:hidden"}>Send</span>
        </Button>
      </div>
    </div>
  );
}