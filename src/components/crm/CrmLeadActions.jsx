import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { displayName } from "@/components/board/boardConfig";
import FddCountdownBadge from "@/components/admin/FddCountdownBadge";
import FollowUpControl from "@/components/admin/FollowUpControl";
import BookingManagePopover from "./BookingManagePopover";
import CalComLinkButton from "./CalComLinkButton";

// Row of lead "function" pills — FDD timer, Cal.com meeting, AI follow-up.
export default function CrmLeadActions({ ticket, board }) {
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {board.key === "franchise" && <FddCountdownBadge ticketId={ticket.id} ticket={ticket} />}
      {!meeting && (
        <BookingManagePopover
          meeting={null}
          boardKey={board.key}
          lead={{ email: ticket?.email, name: displayName(ticket) }}
        >
          <CalComLinkButton />
        </BookingManagePopover>
      )}
      {meeting && (
        <BookingManagePopover meeting={meeting} boardKey={board.key}>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
              meeting._past ? "bg-stone-100 text-stone-500 hover:bg-stone-200" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            }`}
            title={meeting.title || "Manage Cal.com booking"}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {meeting._past ? "Met" : "Meeting"} {format(new Date(meeting.start), "MMM d, h:mma").toLowerCase()}
          </button>
        </BookingManagePopover>
      )}
      <FollowUpControl ticket={ticket} ticketType={board.entity} iconOnly withLabel />
    </div>
  );
}