import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BOARD_TYPES } from "@/components/board/boardConfig";
import CrmLeadDetailDrawer from "./CrmLeadDetailDrawer";
import CrmBookingsCalendar from "./CrmBookingsCalendar";
import CrmBookingsList from "./bookings/CrmBookingsList";
import { CalendarDays, List } from "lucide-react";
import { CRM } from "./crmTheme";

// Desktop (lg+) can switch between the calendar grid and the Cal.com-style
// list; below lg the list is the only view.
function useIsDesktop() {
  const [is, setIs] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const fn = () => setIs(mql.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, []);
  return is;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "franchise", label: "Franchise" },
  { key: "hiring", label: "Hiring" },
];

export default function CrmBookings({ currentUser }) {
  const [srcFilter, setSrcFilter] = useState("all");
  const [detailTicket, setDetailTicket] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const isDesktop = useIsDesktop();
  const showList = !isDesktop || viewMode === "list";

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
    const live = bookings.filter((b) => String(b.status || "").toLowerCase() !== "cancelled");
    if (srcFilter === "all") return live;
    return live.filter((b) => {
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

  const viewToggle = isDesktop && (
    <div
      className="inline-flex items-center gap-0.5 p-1 rounded-full bg-white"
      style={{ border: "1px solid rgba(182,118,81,0.15)" }}
    >
      {[{ key: "calendar", label: "Calendar", Icon: CalendarDays }, { key: "list", label: "List", Icon: List }].map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setViewMode(key)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all"
          style={viewMode === key ? { background: CRM.accentSoft, color: "#5b3038" } : { color: CRM.sub }}
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </div>
  );

  if (showList) {
    return (
      <div className="max-w-5xl mx-auto">
        {viewToggle && <div className="mb-4 flex justify-end">{viewToggle}</div>}
        <CrmBookingsList
          bookings={bookings}
          ticketByEmail={ticketByEmail}
          isLoading={isLoading || ticketsLoading}
          onOpenLead={(t) => setDetailTicket(t)}
        />
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Source filter + view toggle */}
      <div className="mb-6 flex items-center justify-between gap-3">
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
        {viewToggle}
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