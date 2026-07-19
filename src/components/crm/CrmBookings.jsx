import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Search, Video, CalendarDays, List } from "lucide-react";
import { getStatusLabel, displayName, BOARD_TYPES } from "@/components/board/boardConfig";
import CrmEmailDrawer from "./CrmEmailDrawer";
import CrmLeadDetailDrawer from "./CrmLeadDetailDrawer";
import CrmBookingsCalendar from "./CrmBookingsCalendar";
import { CRM, dotFor } from "./crmTheme";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

export default function CrmBookings({ currentUser }) {
  const [view, setView] = useState("calendar");
  const [tab, setTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [srcFilter, setSrcFilter] = useState("all"); // all | franchise | hiring
  const [emailTarget, setEmailTarget] = useState(null); // { ticket, entity }
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
  const { data: allTickets = [] } = useQuery({
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

  const rows = useMemo(() => {
    const now = Date.now();
    let list = bookings
      .filter((b) => b?.start)
      .map((b) => {
        const email = (b.emails || []).find((e) => ticketByEmail[e]) || (b.emails || [])[0] || "";
        const ticket = ticketByEmail[(email || "").toLowerCase()] || null;
        return { ...b, _email: email, _ticket: ticket, _ts: new Date(b.start).getTime() };
      });
    if (tab === "upcoming") list = list.filter((b) => b._ts >= now);
    if (tab === "past") list = list.filter((b) => b._ts < now);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((b) =>
        [b.title, b._email, b._ticket && displayName(b._ticket)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => (tab === "past" ? b._ts - a._ts : a._ts - b._ts));
  }, [bookings, ticketByEmail, tab, search]);

  // Calendar bookings filtered by source (Franchise / Hiring).
  const calendarBookings = useMemo(() => {
    if (srcFilter === "all") return bookings;
    return bookings.filter((b) => {
      const email = (b.emails || []).find((e) => ticketByEmail[(e || "").toLowerCase()]);
      const t = email ? ticketByEmail[email.toLowerCase()] : null;
      if (!t) return false;
      return srcFilter === "franchise"
        ? t._boardKey === "franchise"
        : t._boardKey === "instructor" || t._boardKey === "frontadmin";
    });
  }, [bookings, ticketByEmail, srcFilter]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* View toggle + tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-full self-start shrink-0 bg-white"
          style={{ border: "1px solid rgba(182,118,81,0.15)" }}
        >
          {[
            { key: "calendar", label: "Calendar", Icon: CalendarDays },
            { key: "list", label: "List", Icon: List },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all"
              style={view === key ? { background: CRM.accentSoft, color: "#5b3038" } : { color: CRM.sub }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        {view === "calendar" && (
          <div
            className="inline-flex items-center gap-0.5 p-1 rounded-full self-start shrink-0 bg-white"
            style={{ border: "1px solid rgba(182,118,81,0.15)" }}
          >
            {[
              { key: "all", label: "All" },
              { key: "franchise", label: "Franchise" },
              { key: "hiring", label: "Hiring" },
            ].map((f) => (
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
        )}
        <div className={`flex items-center gap-4 flex-1 ${view === "calendar" ? "hidden" : ""}`}>
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="pb-1.5 text-[13px] transition-colors"
                style={{
                  color: isActive ? CRM.ink : CRM.sub,
                  fontWeight: isActive ? 600 : 500,
                  borderBottom: isActive ? `2px solid ${CRM.accent}` : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className={`relative shrink-0 sm:w-56 ${view === "calendar" ? "hidden" : ""}`}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: CRM.sub }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-9 pl-9 pr-3 rounded-full bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-pink-200"
            style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.ink }}
          />
        </div>
      </div>

      {view === "calendar" ? (
        <div className="pb-10">
          <CrmBookingsCalendar
            bookings={calendarBookings}
            ticketByEmail={ticketByEmail}
            onSelect={(t) => setDetailTicket(t)}
          />
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div
            className="hidden md:grid items-center gap-3 px-5 pb-2 text-[11px] font-medium"
            style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)", color: CRM.sub }}
          >
            <span>Lead</span>
            <span>Meeting date</span>
            <span>Time</span>
            <span className="text-right pr-2">Status</span>
          </div>

          {isLoading ? (
            <div className="crm-card p-10 text-center text-sm" style={{ color: CRM.sub }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div className="crm-card p-10 text-center text-sm" style={{ color: CRM.sub }}>
              No {tab === "all" ? "" : tab + " "}bookings found.
            </div>
          ) : (
            <div className="space-y-2.5 pb-10">
              {rows.map((b, i) => {
                const t = b._ticket;
                const d = new Date(b.start);
                return (
                  <button
                    key={`${b.bookingId || b.uid || i}`}
                    type="button"
                    onClick={() => t && setEmailTarget({ ticket: t, entity: t._entity })}
                    className="w-full grid items-center gap-3 px-5 py-4 bg-white rounded-2xl text-left hover:bg-[#fdf8f4] transition-colors"
                    style={{
                      gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                      boxShadow: CRM.cardShadow,
                      border: CRM.cardBorder,
                    }}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <Video className="w-3.5 h-3.5 shrink-0" style={{ color: CRM.accent }} />
                        <span className="text-[13px] font-semibold truncate" style={{ color: CRM.ink }}>
                          {t ? displayName(t) : b.title || "Meeting"}
                        </span>
                      </span>
                      <span className="block text-[11px] truncate pl-5" style={{ color: CRM.sub }}>
                        {b._email}
                      </span>
                    </span>
                    <span className="text-[13px]" style={{ color: "#5c4a3f" }}>
                      {format(d, "EEE, MMM d, yyyy")}
                    </span>
                    <span className="text-[13px]" style={{ color: "#5c4a3f" }}>
                      {format(d, "h:mm a")}
                    </span>
                    <span className="flex justify-end">
                      {t ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ color: CRM.ink, border: "1px solid rgba(182,118,81,0.15)" }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: dotFor(t.status) }} />
                          {getStatusLabel(t._boardKey, t.status)}
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: CRM.sub }}>—</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {detailTicket && (
        <CrmLeadDetailDrawer
          ticket={detailTicket}
          board={BOARD_TYPES.find((b) => b.key === detailTicket._boardKey)}
          currentUser={currentUser}
          onClose={() => setDetailTicket(null)}
        />
      )}

      {emailTarget && (
        <CrmEmailDrawer
          ticket={emailTarget.ticket}
          ticketType={emailTarget.entity}
          currentUser={currentUser}
          onClose={() => setEmailTarget(null)}
        />
      )}
    </div>
  );
}