import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { X, CalendarDays } from "lucide-react";
import EmailThreadPanel from "@/components/email/EmailThreadPanel";
import FollowUpControl from "@/components/admin/FollowUpControl";
import FddCountdownPill from "@/components/board/FddCountdownPill";
import { displayName } from "@/components/board/boardConfig";
import { CRM } from "./crmTheme";

// Right-hand slide-in drawer hosting the full email thread + composer for a lead.
export default function CrmEmailDrawer({ ticket, ticketType, currentUser, onClose }) {
  // Cal.com meeting for this lead (shared cache with the Bookings page).
  const { data: bookings = [] } = useQuery({
    queryKey: ["crm-bookings-all"],
    queryFn: async () => {
      const resp = await base44.functions.invoke("getCalBookings", { range: "all" });
      return resp?.data?.bookingsList || [];
    },
    staleTime: 60000,
  });

  const meeting = useMemo(() => {
    const email = (ticket?.email || "").toLowerCase().trim();
    if (!email) return null;
    const mine = bookings.filter(
      (b) => b?.start && (b.emails || []).some((e) => (e || "").toLowerCase() === email)
    );
    if (!mine.length) return null;
    const now = Date.now();
    const upcoming = mine
      .filter((b) => new Date(b.start).getTime() >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    if (upcoming.length) return { ...upcoming[0], _past: false };
    const past = mine.sort((a, b) => new Date(b.start) - new Date(a.start));
    return { ...past[0], _past: true };
  }, [bookings, ticket?.email]);

  if (!ticket || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 crm-root">
      <div className="absolute inset-0 bg-black/30 pip-fade-in" onClick={onClose} />
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-white shadow-2xl flex flex-col pip-slide-in-right"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div
          className="flex items-center justify-between gap-2 px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(182,118,81,0.12)", background: CRM.blush }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: CRM.ink }}>
              {displayName(ticket)}
            </div>
            <div className="text-[11px] truncate" style={{ color: CRM.sub }}>
              {ticket.email}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {meeting && (
              <span
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                  meeting._past
                    ? "bg-white/70 text-stone-500"
                    : "bg-emerald-100 text-emerald-800"
                }`}
                title={meeting.title || "Cal.com meeting"}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{meeting._past ? "Met" : "Meeting"}</span>
                {format(new Date(meeting.start), "MMM d, h:mma").toLowerCase()}
              </span>
            )}
            {ticketType === "FranchiseInquiry" && <FddCountdownPill ticket={ticket} />}
            {/* Full labelled pill on md+, icon-only when the header is crowded on small screens */}
            <span className="hidden md:inline-flex">
              <FollowUpControl ticket={ticket} ticketType={ticketType} iconOnly withLabel />
            </span>
            <span className="md:hidden inline-flex">
              <FollowUpControl ticket={ticket} ticketType={ticketType} iconOnly />
            </span>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/60">
              <X className="w-5 h-5" style={{ color: CRM.ink }} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <EmailThreadPanel ticket={ticket} ticketType={ticketType} currentUser={currentUser} hideHeader />
        </div>
      </div>
    </div>,
    document.body
  );
}