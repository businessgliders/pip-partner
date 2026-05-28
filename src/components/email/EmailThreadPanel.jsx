import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail, ChevronDown, ChevronUp, X } from "lucide-react";
import EmailMessageItem from "./EmailMessageItem";
import EmailComposer from "./EmailComposer";
import ComposerDragHandle from "./ComposerDragHandle";
import { buildWelcomeHtml } from "./welcomeEmailHtml";

const STAFF_DOMAINS = ["pilatesinpinkstudio.com", "pilatesinpink.ca"];
const isStaff = (e) => !!e && STAFF_DOMAINS.some((d) => e.toLowerCase().endsWith(`@${d}`));

const PROGRAM_LABELS = {
  FranchiseInquiry: "Franchise Inquiry",
  InfluencerApplication: "Influencer Application",
  InstructorApplication: "Instructor Application",
  FrontAdminApplication: "Front Desk Application",
};

// Must mirror FROM_ALIASES in EmailComposer / functions/sendTicketEmail
const FROM_ALIASES = {
  FranchiseInquiry: "franchise@pilatesinpinkstudio.com",
  InfluencerApplication: "partner@pilatesinpinkstudio.com",
  InstructorApplication: "hire@pilatesinpinkstudio.com",
  FrontAdminApplication: "hire@pilatesinpinkstudio.com",
};

function buildIntakeFull(ticket, ticketType) {
  const rows = [];
  const add = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;font-weight:600;width:140px;word-break:break-word;">${label}</td><td style="padding:4px 0;vertical-align:top;font-size:13px;color:#334155;word-break:break-word;overflow-wrap:anywhere;">${value}</td></tr>`
    );
  };

  const phone = [ticket?.phone_country, ticket?.phone].filter(Boolean).join(" ");
  add("Email", ticket?.email);
  add("Phone", phone);

  if (ticketType === "FranchiseInquiry") {
    add("Province", ticket?.province);
    add("Preferred Location", ticket?.preferred_location);
    add("Available Capital", ticket?.available_capital);
    add("Operation Style", ticket?.operation_style);
    add("Ready to Sign NDA", ticket?.ready_to_sign_nda);
    add("Why Pilates in Pink", ticket?.why_pilates_in_pink);
    add("Business Experience", ticket?.business_experience);
    add("Discovery Call", ticket?.scheduled_call_time);
  } else if (ticketType === "InfluencerApplication") {
    add("Instagram", ticket?.instagram_handle ? `@${ticket.instagram_handle}` : "");
    add("TikTok", ticket?.tiktok_handle ? `@${ticket.tiktok_handle}` : "");
    add("Followers", ticket?.follower_count);
    add("Content Style", ticket?.content_style);
    add("Location", ticket?.location);
    add("Why Partner", ticket?.why_partner);
  } else if (ticketType === "InstructorApplication" || ticketType === "FrontAdminApplication") {
    add("Preferred Studio", ticket?.preferred_studio);
    add("Postal Code", ticket?.postal_code);
    add("Province", ticket?.province);
    if (ticket?.qualifications?.length) add("Qualifications", ticket.qualifications.join(", "));
    if (ticket?.resume_url) add("Resume", `<a href="${ticket.resume_url}" target="_blank" rel="noopener noreferrer" style="color:#0f172a;text-decoration:underline;">View Resume</a>`);
    add("Message", ticket?.message);
  }

  if (!rows.length) {
    return `<p><em>${PROGRAM_LABELS[ticketType]} submitted — no additional notes.</em></p>`;
  }
  return `<table style="border-collapse:collapse;width:100%;">${rows.join("")}</table>`;
}

function buildIntakeSummary(ticket, ticketType) {
  const name =
    ticket?.full_name ||
    `${ticket?.first_name || ""} ${ticket?.last_name || ""}`.trim() ||
    "An applicant";
  const sentences = [];

  if (ticketType === "FranchiseInquiry") {
    const loc = [ticket?.preferred_location, ticket?.province].filter(Boolean).join(", ");
    sentences.push(
      `${name} submitted a franchise inquiry${loc ? ` for ${loc}` : ""}${ticket?.available_capital ? ` with ${ticket.available_capital} available capital` : ""}.`
    );
    if (ticket?.operation_style || ticket?.ready_to_sign_nda) {
      sentences.push(
        [
          ticket?.operation_style ? `Prefers ${ticket.operation_style.toLowerCase()}` : "",
          ticket?.ready_to_sign_nda ? `NDA: ${ticket.ready_to_sign_nda}` : "",
        ].filter(Boolean).join(" · ") + "."
      );
    }
    if (ticket?.why_pilates_in_pink || ticket?.scheduled_call_time) {
      sentences.push(
        [
          ticket?.why_pilates_in_pink ? `Motivation: ${ticket.why_pilates_in_pink}` : "",
          ticket?.scheduled_call_time ? `Discovery call: ${ticket.scheduled_call_time}` : "",
        ].filter(Boolean).join(" · ") + "."
      );
    }
  } else if (ticketType === "InfluencerApplication") {
    const handles = [
      ticket?.instagram_handle ? `@${ticket.instagram_handle} on Instagram` : "",
      ticket?.tiktok_handle ? `@${ticket.tiktok_handle} on TikTok` : "",
    ].filter(Boolean).join(" and ");
    sentences.push(
      `${name}${handles ? ` (${handles})` : ""} applied to the influencer program${ticket?.follower_count ? ` with ${ticket.follower_count} followers` : ""}${ticket?.location ? ` from ${ticket.location}` : ""}.`
    );
    if (ticket?.content_style) sentences.push(`Content focus: ${ticket.content_style}.`);
    if (ticket?.why_partner) sentences.push(`Why partner: ${ticket.why_partner}`);
  } else if (ticketType === "InstructorApplication" || ticketType === "FrontAdminApplication") {
    const role = ticketType === "InstructorApplication" ? "instructor" : "front desk";
    const loc = [ticket?.preferred_studio, ticket?.province].filter(Boolean).join(", ");
    sentences.push(
      `${name} applied for a ${role} role${loc ? ` at ${loc}` : ""}${ticket?.postal_code ? ` (${ticket.postal_code})` : ""}.`
    );
    if (ticket?.qualifications?.length) {
      sentences.push(`Qualifications: ${ticket.qualifications.join(", ")}.`);
    }
    if (ticket?.message) sentences.push(ticket.message);
  }

  if (!sentences.length) {
    sentences.push(`${PROGRAM_LABELS[ticketType]} submitted — no additional notes.`);
  }

  const escape = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  return sentences
    .slice(0, 3)
    .map((s) => `<p style="margin:0 0 6px 0;font-size:13px;line-height:1.55;color:#334155;">${escape(s)}</p>`)
    .join("");
}

export default function EmailThreadPanel({ ticket, ticketType, currentUser, highlightMessageId, markAsRead }) {
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const userEmail = (currentUser?.email || "").toLowerCase().trim();
  const [composerOpen, setComposerOpen] = useState(false);
  // Desktop composer editor height (in px) when user has resized via the drag handle.
  // null = use the default responsive sizing baked into EmailComposer.
  const [editorHeight, setEditorHeight] = useState(null);
  // Track panel height so the inline drag handle can clamp the editor and keep
  // the Send Reply row visible inside the container.
  const [panelHeight, setPanelHeight] = useState(0);
  useEffect(() => {
    if (!panelRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setPanelHeight(entry.contentRect.height);
    });
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, []);
  // Cap the editor at ~45% of the panel so the Send Reply row never gets pushed
  // beneath the container edge, regardless of toolbar/signature chrome size.
  const inlineEditorMax = Math.max(80, Math.floor(panelHeight * 0.45));
  useEffect(() => {
    if (editorHeight !== null && editorHeight > inlineEditorMax) {
      setEditorHeight(inlineEditorMax);
    }
  }, [inlineEditorMax, editorHeight]);
  // Desktop full-screen modal toggle for the entire thread + composer
  const [fullscreen, setFullscreen] = useState(false);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["email-messages", ticket.id],
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { ticket_id: ticket.id, ticket_type: ticketType },
        "created_date",
        500
      ),
    refetchInterval: 15000,
  });

  // Fetch staff users once for resolving internal email addresses to full names
  const { data: staffUsers = [] } = useQuery({
    queryKey: ["staff-users-for-thread"],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000,
  });
  const staffNameByEmail = useMemo(() => {
    const map = {};
    staffUsers.forEach((u) => {
      if (u?.email) map[u.email.toLowerCase()] = u.full_name || u.email;
    });
    return map;
  }, [staffUsers]);

  // Filter out:
  // 1. Legacy system notifications (outbound to staff domain, not explicitly is_internal)
  // 2. Assignment emails (owner notifications about booked discovery calls)
  // Show: applicant-facing emails (inbound, outbound to applicant) and user-authored internal emails
  const visibleReal = useMemo(
    () =>
      messages.filter((m) => {
        // Hide outbound staff emails unless explicitly marked as user-authored internal
        if (m.direction === "outbound" && isStaff(m.to_email) && !m.is_internal) return false;
        // Hide owner assignment emails (they contain "New franchise inquiry" and go to staff)
        if (m.is_internal && m.direction === "outbound" && m.subject?.includes("New franchise inquiry")) return false;
        return true;
      }),
    [messages]
  );

  // Synthesize intake bubble (always)
  const clientName =
    ticket?.full_name ||
    `${ticket?.first_name || ""} ${ticket?.last_name || ""}`.trim() ||
    "Client";

  const intakeBubble = {
    id: `__intake_${ticket.id}`,
    direction: "inbound",
    from_name: clientName,
    from_email: ticket?.email || "",
    subject: `${PROGRAM_LABELS[ticketType]} — Original submission`,
    body_html: buildIntakeSummary(ticket, ticketType),
    full_body_html: buildIntakeFull(ticket, ticketType),
    sent_at: ticket?.created_date,
    send_status: "received",
    is_ai_summary: true,
  };

  const hasRealWelcome = visibleReal.some((m) => m.is_welcome);
  const welcomeBubble = hasRealWelcome
    ? null
    : {
        id: `__welcome_${ticket.id}`,
        direction: "outbound",
        is_welcome: true,
        from_name: "Pilates in Pink ™",
        from_email: "",
        to_email: ticket?.email || "",
        subject: `Welcome to Pilates in Pink ™`,
        body_html: buildWelcomeHtml({
          clientName,
          programLabel: PROGRAM_LABELS[ticketType],
          appNumber: ticket?.app_number,
          ticketShortId: ticket.id.slice(-8),
          ticketType,
        }),
        sent_at: ticket?.created_date,
        send_status: "sent",
      };

  const allMessages = useMemo(() => {
    const arr = [intakeBubble];
    if (welcomeBubble) arr.push(welcomeBubble);
    arr.push(...visibleReal);
    return arr;
  }, [visibleReal, welcomeBubble?.id]);

  // Scrolling behavior
  useEffect(() => {
    if (!containerRef.current) return;
    const scrollToBottom = () => {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    };
    if (highlightMessageId) {
      const el = document.getElementById(`msg-${highlightMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    // jump to newest on open
    scrollToBottom();
  }, [allMessages.length, highlightMessageId]);

  const handleSent = () => {
    refetch().then(() => {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    });
  };

  return (
    <>
      <div ref={panelRef} className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-pink-50">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="w-4 h-4 text-pink-600 shrink-0" />
            <span className="font-semibold text-sm lg:text-sm text-gray-800">
              <span className="lg:hidden">Emails</span>
              <span className="hidden lg:inline">Email Communications</span>
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
              {allMessages.length}
            </span>
          </div>
          {FROM_ALIASES[ticketType] && (
            <span className="hidden lg:block text-[11px] text-gray-500 truncate ml-2 shrink-0">
              <span className="text-gray-400">From:</span>{" "}
              <span className="font-medium text-gray-700">{FROM_ALIASES[ticketType]}</span>
            </span>
          )}
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-3 lg:p-4 bg-gradient-to-b from-amber-50/30 to-pink-50/30"
          style={{ maxHeight: "auto" }}
        >
          {allMessages.map((m) => {
            const readBy = Array.isArray(m.read_by) ? m.read_by : [];
            const isUnread =
              !!userEmail &&
              m.direction === "inbound" &&
              !String(m.id || "").startsWith("__") &&
              !readBy.some((e) => (e || "").toLowerCase() === userEmail);
            return (
              <EmailMessageItem
                key={m.id}
                message={m}
                isHighlighted={highlightMessageId === m.id}
                isUnread={isUnread}
                onMarkRead={isUnread && markAsRead ? () => markAsRead(m.id) : undefined}
                staffNameByEmail={staffNameByEmail}
              />
            );
          })}
        </div>

        <div className="border-t bg-white">
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            className="md:hidden w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="text-xs tracking-wider uppercase text-gray-600 font-semibold">Reply</span>
            {composerOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          <div className={`${composerOpen ? "block" : "hidden"} md:block`}>
            {/* Desktop-only drag handle to resize the composer editor */}
            <div className="hidden md:block">
              <ComposerDragHandle
                currentHeight={editorHeight ?? 200}
                onResize={(h) => setEditorHeight(Math.min(h, inlineEditorMax))}
                minHeight={80}
                maxHeight={inlineEditorMax}
              />
            </div>
            <EmailComposer
              ticket={ticket}
              ticketType={ticketType}
              currentUser={currentUser}
              onSent={handleSent}
              onRequestFullscreen={() => setFullscreen(true)}
              editorHeightPx={editorHeight}
            />
          </div>
        </div>
      </div>

      {/* Desktop fullscreen modal — entire email thread + composer */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 hidden md:flex bg-white flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b bg-gradient-to-r from-amber-50 to-pink-50 shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-600" />
              <span className="font-semibold text-sm text-gray-800">Email Communications</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                {allMessages.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="p-1.5 rounded-md hover:bg-white/60 text-gray-600"
              title="Exit fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 lg:px-10 py-4 bg-gradient-to-b from-amber-50/30 to-pink-50/30" style={{ flex: "0 0 40%" }}>
            <div className="max-w-3xl mx-auto">
              {allMessages.map((m) => {
                const readBy = Array.isArray(m.read_by) ? m.read_by : [];
                const isUnread =
                  !!userEmail &&
                  m.direction === "inbound" &&
                  !String(m.id || "").startsWith("__") &&
                  !readBy.some((e) => (e || "").toLowerCase() === userEmail);
                return (
                  <EmailMessageItem
                    key={m.id}
                    message={m}
                    isHighlighted={highlightMessageId === m.id}
                    isUnread={isUnread}
                    onMarkRead={isUnread && markAsRead ? () => markAsRead(m.id) : undefined}
                    staffNameByEmail={staffNameByEmail}
                  />
                );
              })}
            </div>
          </div>
          <div className="border-t bg-white overflow-y-auto" style={{ flex: "0 0 60%" }}>
            <div className="max-w-3xl mx-auto h-full">
              <EmailComposer
                ticket={ticket}
                ticketType={ticketType}
                currentUser={currentUser}
                onSent={handleSent}
                onRequestFullscreen={() => setFullscreen(false)}
                isFullscreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Full-screen mobile popup for email composer */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-pink-50 shrink-0">
            <span className="font-semibold text-sm text-gray-800">Email Communications</span>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
            {/* Messages section - takes more space on mobile */}
            <div className="flex-1 p-3 bg-gradient-to-b from-amber-50/30 to-pink-50/30 overflow-y-auto">
              {allMessages.map((m) => {
                const readBy = Array.isArray(m.read_by) ? m.read_by : [];
                const isUnread =
                  !!userEmail &&
                  m.direction === "inbound" &&
                  !String(m.id || "").startsWith("__") &&
                  !readBy.some((e) => (e || "").toLowerCase() === userEmail);
                return (
                  <EmailMessageItem
                    key={m.id}
                    message={m}
                    isHighlighted={highlightMessageId === m.id}
                    isUnread={isUnread}
                    onMarkRead={isUnread && markAsRead ? () => markAsRead(m.id) : undefined}
                    staffNameByEmail={staffNameByEmail}
                  />
                );
              })}
            </div>
            {/* Composer section - shrinks on mobile */}
            <div className="shrink-0">
              <EmailComposer
                ticket={ticket}
                ticketType={ticketType}
                currentUser={currentUser}
                onSent={() => {
                  setComposerOpen(false);
                  handleSent();
                }}
                isMobileFullscreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}