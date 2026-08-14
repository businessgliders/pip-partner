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

  // All of this lead's Cal.com meetings, in line: happening now → upcoming
  // (soonest first) → past (most recent first, capped at 3 to avoid clutter).
  const meetings = useMemo(() => {
    const email = (ticket?.email || "").toLowerCase().trim();
    if (!email) return [];
    const mine = bookings.filter(
      (b) => b?.start && (b.emails || []).some((e) => (e || "").toLowerCase() === email)
    );
    const now = Date.now();
    const kind = (b) => {
      const start = new Date(b.start).getTime();
      const end = b.end ? new Date(b.end).getTime() : start + 60 * 60 * 1000;
      if (now >= start && now <= end) return "now";
      return start > now ? "upcoming" : "past";
    };
    const current = mine.filter((b) => kind(b) === "now");
    const upcoming = mine.filter((b) => kind(b) === "upcoming").sort((a, b) => new Date(a.start) - new Date(b.start));
    const past = mine.filter((b) => kind(b) === "past").sort((a, b) => new Date(b.start) - new Date(a.start)).slice(0, 3);
    return [
      ...current.map((b) => ({ ...b, _kind: "now" })),
      ...upcoming.map((b) => ({ ...b, _kind: "upcoming" })),
      ...past.map((b) => ({ ...b, _kind: "past" })),
    ];
  }, [bookings, ticket?.email]);

  const lead = { email: ticket?.email, name: displayName(ticket) };
  const PILL_STYLES = {
    now: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    upcoming: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    past: "bg-stone-100 text-stone-500 hover:bg-stone-200",
  };
  const PILL_LABELS = { now: "Now", upcoming: "Meeting", past: "Met" };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {board.key === "franchise" && <FddCountdownBadge ticketId={ticket.id} ticket={ticket} />}
      {meetings.length === 0 && (
        <BookingManagePopover meeting={null} boardKey={board.key} lead={lead}>
          <CalComLinkButton />
        </BookingManagePopover>
      )}
      {meetings.map((m) => (
        <BookingManagePopover key={m.uid || m.bookingId || m.start} meeting={m} boardKey={board.key} lead={lead}>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${PILL_STYLES[m._kind]}`}
            title={m.title || "Manage Cal.com booking"}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {PILL_LABELS[m._kind]} {format(new Date(m.start), "MMM d, h:mma").toLowerCase()}
          </button>
        </BookingManagePopover>
      ))}
      <FollowUpControl ticket={ticket} ticketType={board.entity} iconOnly withLabel />
    </div>
  );
}