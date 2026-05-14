import React, { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail } from "lucide-react";
import EmailMessageItem from "./EmailMessageItem";
import EmailComposer from "./EmailComposer";
import { buildWelcomeHtml } from "./welcomeEmailHtml";

const STAFF_DOMAINS = ["pilatesinpinkstudio.com", "pilatesinpink.ca"];
const isStaff = (e) => !!e && STAFF_DOMAINS.some((d) => e.toLowerCase().endsWith(`@${d}`));

const PROGRAM_LABELS = {
  FranchiseInquiry: "Franchise Inquiry",
  InfluencerApplication: "Influencer Application",
  InstructorApplication: "Instructor Application",
  FrontAdminApplication: "Front Desk Application",
};

function buildIntakeSummary(ticket, ticketType) {
  const rows = [];
  const add = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:4px 0;vertical-align:top;font-size:13px;color:#334155;">${value}</td></tr>`
    );
  };

  // Contact (all ticket types)
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

export default function EmailThreadPanel({ ticket, ticketType, currentUser, highlightMessageId }) {
  const containerRef = useRef(null);

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

  // Filter out internal outbound notifications (sent to @staff domain)
  const visibleReal = useMemo(
    () =>
      messages.filter(
        (m) => !(m.direction === "outbound" && isStaff(m.to_email))
      ),
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
    sent_at: ticket?.created_date,
    send_status: "received",
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
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-pink-50">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-pink-600" />
          <span className="font-semibold text-sm text-gray-800">Email Communications</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
            {allMessages.length}
          </span>
        </div>
        <span className="text-xs text-gray-500 truncate max-w-[200px]">
          {ticket?.email || "—"}
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-amber-50/30 to-pink-50/30"
        style={{ maxHeight: 480 }}
      >
        {allMessages.map((m) => (
          <EmailMessageItem
            key={m.id}
            message={m}
            isHighlighted={highlightMessageId === m.id}
          />
        ))}
      </div>

      <EmailComposer
        ticket={ticket}
        ticketType={ticketType}
        currentUser={currentUser}
        onSent={handleSent}
      />
    </div>
  );
}