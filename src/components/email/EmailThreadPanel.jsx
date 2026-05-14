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
  const lines = [];
  if (ticket?.message) lines.push(ticket.message);
  if (ticket?.why_partner) lines.push(ticket.why_partner);
  if (ticket?.why_pilates_in_pink) lines.push(`Why: ${ticket.why_pilates_in_pink}`);
  if (ticket?.business_experience) lines.push(`Experience: ${ticket.business_experience}`);
  if (ticket?.preferred_location) lines.push(`Preferred location: ${ticket.preferred_location}`);
  if (ticket?.preferred_studio) lines.push(`Preferred studio: ${ticket.preferred_studio}`);
  if (ticket?.available_capital) lines.push(`Capital: ${ticket.available_capital}`);
  if (ticket?.instagram_handle) lines.push(`Instagram: @${ticket.instagram_handle}`);
  if (ticket?.tiktok_handle) lines.push(`TikTok: @${ticket.tiktok_handle}`);
  if (ticket?.follower_count) lines.push(`Followers: ${ticket.follower_count}`);
  if (ticket?.content_style) lines.push(`Content: ${ticket.content_style}`);
  if (ticket?.qualifications?.length) lines.push(`Qualifications: ${ticket.qualifications.join(", ")}`);
  return lines.length ? lines.map((l) => `<p>${l}</p>`).join("") : `<p><em>${PROGRAM_LABELS[ticketType]} submitted — no additional notes.</em></p>`;
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