import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BOARD_TYPES } from "@/components/board/boardConfig";
import CrmLeadDetailDrawer from "./CrmLeadDetailDrawer";
import CrmBookingsCalendar from "./CrmBookingsCalendar";
import { CRM } from "./crmTheme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "franchise", label: "Franchise" },
  { key: "hiring", label: "Hiring" },
];

export default function CrmBookings({ currentUser }) {
  const [srcFilter, setSrcFilter] = useState("all");
  const [detailTicket, setDetailTicket] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["crm-bookings-all"],
    queryFn: async () => {
      const resp = await base44.functions.invoke("getCalBookings", { range: "all" });
      return resp?.data?.bookingsList || [];
    },
    refetchInterval: 60000,
  });

  // Fetch all lead tickets so bookings can be paired to a lead + status.
  const { data: allTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["crm-bookings-tickets"],
    queryFn: async () => {
      const [fr, ins, fa] = await Promise.all([
        base44.entities.FranchiseInquiry.list("-created_date", 500),
        base44.entities.InstructorApplication.list("-created_date", 500),
        base44.entities.FrontAdminApplication.list("-created_date", 500),
      ]);
      return [
        ...fr.map((t) => ({ ...t, _entity: "FranchiseInquiry", _boardKey: "franchise" })),
        ...ins.map((t) => ({ ...t, _entity: "InstructorApplication", _boardKey: "instructor" })),
        ...fa.map((t) => ({ ...t, _entity: "FrontAdminApplication", _boardKey: "frontadmin" })),
      ];
    },
  });

  const ticketByEmail = useMemo(() => {
    const map = {};
    allTickets.forEach((t) => {
      const key = (t.email || "").toLowerCase().trim();
      if (key && !map[key]) map[key] = t;
    });
    return map;
  }, [allTickets]);

  // Calendar bookings filtered by source. Unmatched bookings (no lead found)
  // stay visible under Franchise so no meeting silently disappears.
  const calendarBookings = useMemo(() => {
    if (srcFilter === "all") return bookings;
    return bookings.filter((b) => {
      // The Cal event type is the source of truth (franchise vs hiring).
      if (b.source) return b.source === srcFilter;
      const email = (b.emails || []).find((e) => ticketByEmail[(e || "").toLowerCase()]);
      const t = email ? ticketByEmail[email.toLowerCase()] : null;
      if (!t) return srcFilter === "franchise";
      return srcFilter === "franchise"
        ? t._boardKey === "franchise"
        : t._boardKey === "instructor" || t._boardKey === "frontadmin";
    });
  }, [bookings, ticketByEmail, srcFilter]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Source filter */}
      <div className="mb-6">
        <div
          className="inline-flex items-center gap-0.5 p-1 rounded-full bg-white"
          style={{ border: "1px solid rgba(182,118,81,0.15)" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSrcFilter(f.key)}
              className="px-3 py-1 rounded-full text-[12px] font-medium transition-all"
              style={srcFilter === f.key ? { background: CRM.accentSoft, color: "#5b3038" } : { color: CRM.sub }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || ticketsLoading ? (
        <div className="crm-card p-10 text-center text-sm" style={{ color: CRM.sub }}>Loading…</div>
      ) : (
        <div className="pb-10">
          <CrmBookingsCalendar
            bookings={calendarBookings}
            ticketByEmail={ticketByEmail}
            onSelect={(t) => setDetailTicket(t)}
          />
        </div>
      )}

      {detailTicket && (
        <CrmLeadDetailDrawer
          ticket={detailTicket}
          board={BOARD_TYPES.find((b) => b.key === detailTicket._boardKey)}
          currentUser={currentUser}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </div>
  );
}