import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, subMonths, startOfMonth } from "date-fns";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { displayName, BOARD_TYPES } from "@/components/board/boardConfig";
import CrmDashboardNotifications from "./CrmDashboardNotifications";
import CrmUpcomingBookingsWidget from "./CrmUpcomingBookingsWidget";
import CrmLeadDetailDrawer from "./CrmLeadDetailDrawer";
import { CRM } from "./crmTheme";

const groupOf = (boardKey) => (boardKey === "franchise" ? "franchise" : "hiring");

export default function CrmDashboard({ onNavigate, currentUser }) {
  const [detailTicket, setDetailTicket] = useState(null);

  const { data: franchise = [] } = useQuery({
    queryKey: ["crm-leads", "FranchiseInquiry"],
    queryFn: () => base44.entities.FranchiseInquiry.list("-created_date", 500),
  });
  const { data: instructor = [] } = useQuery({
    queryKey: ["crm-leads", "InstructorApplication"],
    queryFn: () => base44.entities.InstructorApplication.list("-created_date", 500),
  });
  const { data: frontadmin = [] } = useQuery({
    queryKey: ["crm-leads", "FrontAdminApplication"],
    queryFn: () => base44.entities.FrontAdminApplication.list("-created_date", 500),
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["crm-bookings-all"],
    queryFn: async () => {
      const resp = await base44.functions.invoke("getCalBookings", { range: "all" });
      return resp?.data?.bookingsList || [];
    },
  });
  const { data: inboundEmails = [] } = useQuery({
    queryKey: ["crm-inbound-emails"],
    queryFn: () => base44.entities.EmailMessage.filter({ direction: "inbound" }, "-created_date", 200),
  });

  const fr = useMemo(() => franchise.filter((t) => !t.archived).map((t) => ({ ...t, _boardKey: "franchise" })), [franchise]);
  const ins = useMemo(() => instructor.filter((t) => !t.archived).map((t) => ({ ...t, _boardKey: "instructor" })), [instructor]);
  const fa = useMemo(() => frontadmin.filter((t) => !t.archived).map((t) => ({ ...t, _boardKey: "frontadmin" })), [frontadmin]);
  const all = useMemo(() => [...fr, ...ins, ...fa], [fr, ins, fa]);

  const ticketById = useMemo(() => {
    const map = {};
    all.forEach((t) => { map[t.id] = t; });
    return map;
  }, [all]);

  const signed = fr.filter((t) =>
    ["signed", "site_selection", "lease", "build_out", "training"].includes(t.status)
  ).length;

  // Inquiries sparkline — last 8 months.
  const sparkData = useMemo(() => {
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const m = startOfMonth(subMonths(new Date(), i));
      months.push({ key: format(m, "yyyy-MM"), label: format(m, "MMM"), count: 0 });
    }
    all.forEach((t) => {
      if (!t.created_date) return;
      const key = format(new Date(t.created_date), "yyyy-MM");
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.count += 1;
    });
    return months;
  }, [all]);

  // Notifications derived from live data — items carry the ticket for
  // click-through and a group ("franchise"/"hiring") for the filter.
  const leadItem = (t) => ({ label: displayName(t), ticket: t, group: groupOf(t._boardKey) });
  const newLeads = all.filter((t) => ["new", "pending"].includes(t.status));
  const activeFollowUps = all.filter((t) => t.follow_up?.enabled);
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  const recentReplies = inboundEmails.filter(
    (m) => new Date(m.created_date).getTime() >= cutoff && !(m.read_by || []).length
  );
  const notifRows = [
    { label: "New leads", items: newLeads.map(leadItem) },
    {
      label: "Unread replies (7 days)",
      items: recentReplies.map((m) => {
        const t = ticketById[m.ticket_id] || null;
        return {
          label: m.from_name || m.from_email || m.subject,
          ticket: t,
          group: m.ticket_type === "FranchiseInquiry" ? "franchise" : "hiring",
        };
      }),
    },
    { label: "Active follow-ups", items: activeFollowUps.map(leadItem) },
  ];

  const goToLeads = (src) => onNavigate("leads", src);
  const detailBoard = detailTicket ? BOARD_TYPES.find((b) => b.key === detailTicket._boardKey) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">
      {/* Row 1: notifications first, then stats tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CrmDashboardNotifications rows={notifRows} onOpenItem={(t) => setDetailTicket(t)} />

        {/* Big pink tile — total leads */}
        <button
          type="button"
          onClick={() => goToLeads("franchise")}
          className="rounded-2xl p-5 text-left flex flex-col"
          style={{ background: CRM.accentSoft, boxShadow: CRM.cardShadow }}
        >
          <span className="text-[12px] font-semibold" style={{ color: "#5b3038" }}>
            Total leads <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/50 ml-1 align-middle">ALL TIME</span>
          </span>
          <span className="text-4xl font-bold mt-2" style={{ color: "#3d1f26" }}>{all.length}</span>
          <div className="mt-4 space-y-1.5 text-[12px]" style={{ color: "#5b3038" }}>
            <div className="flex justify-between"><span>Franchising</span><strong>{fr.length}</strong></div>
            <div className="flex justify-between"><span>Instructor</span><strong>{ins.length}</strong></div>
            <div className="flex justify-between"><span>Front Desk</span><strong>{fa.length}</strong></div>
          </div>
          <div className="mt-auto pt-5">
            <div className="text-[10px] tracking-[0.15em] uppercase font-semibold opacity-70" style={{ color: "#5b3038" }}>
              Signed franchises
            </div>
            <div className="text-xl font-bold" style={{ color: "#3d1f26" }}>{signed}</div>
          </div>
        </button>

        {/* Inquiries received sparkline */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: "#fbe9dc", boxShadow: CRM.cardShadow }}>
          <div className="text-[13px] font-semibold leading-tight" style={{ color: "#7a4a30" }}>
            Inquiries received
          </div>
          <div className="text-[10px] tracking-wider uppercase font-semibold mt-0.5" style={{ color: "#b08668" }}>
            Last 8 months
          </div>
          <div className="flex-1 min-h-[80px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Area type="monotone" dataKey="count" stroke="#d97a4a" strokeWidth={1.5} fill="rgba(217,122,74,0.18)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-end justify-between mt-2 text-[9px] font-semibold" style={{ color: "#b08668" }}>
            <span>{sparkData[0]?.label}</span>
            <span>{sparkData[sparkData.length - 1]?.label}</span>
          </div>
        </div>
      </div>

      {/* Row 2: upcoming bookings — calendar-style widget */}
      <CrmUpcomingBookingsWidget bookings={bookings} onNavigate={onNavigate} />

      {detailTicket && detailBoard && (
        <CrmLeadDetailDrawer
          ticket={detailTicket}
          board={detailBoard}
          currentUser={currentUser}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </div>
  );
}