import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, subMonths, startOfMonth } from "date-fns";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Bot, FileSignature } from "lucide-react";
import { displayName, BOARD_TYPES } from "@/components/board/boardConfig";
import useReplyNotifications from "@/hooks/useReplyNotifications";
import CrmDashboardNotifications from "./CrmDashboardNotifications";
import CrmUpcomingBookingsWidget from "./CrmUpcomingBookingsWidget";
import CrmLeadDetailDrawer from "./CrmLeadDetailDrawer";
import CrmEmailDrawer from "./CrmEmailDrawer";
import CrmAiFollowUpsModal from "./CrmAiFollowUpsModal";
import CrmLeadsPieTile from "./CrmLeadsPieTile";
import { CRM } from "./crmTheme";

const groupOf = (boardKey) => (boardKey === "franchise" ? "franchise" : "hiring");

export default function CrmDashboard({ onNavigate, currentUser }) {
  const [detailTicket, setDetailTicket] = useState(null);
  const [emailTicket, setEmailTicket] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

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
  const { data: contracts = [] } = useQuery({
    queryKey: ["crm-contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 500),
  });
  // Shared notification feed (same source as the header bell + sidebar badges)
  const { notifications: replyNotifs } = useReplyNotifications();

  const fr = useMemo(() => franchise.filter((t) => !t.archived).map((t) => ({ ...t, _boardKey: "franchise" })), [franchise]);
  const ins = useMemo(() => instructor.filter((t) => !t.archived).map((t) => ({ ...t, _boardKey: "instructor" })), [instructor]);
  const fa = useMemo(() => frontadmin.filter((t) => !t.archived).map((t) => ({ ...t, _boardKey: "frontadmin" })), [frontadmin]);
  const all = useMemo(() => [...fr, ...ins, ...fa], [fr, ins, fa]);

  const ticketById = useMemo(() => {
    const map = {};
    all.forEach((t) => { map[t.id] = t; });
    return map;
  }, [all]);

  const ticketByEmail = useMemo(() => {
    const map = {};
    all.forEach((t) => {
      const key = (t.email || "").toLowerCase().trim();
      if (key && !map[key]) map[key] = t;
    });
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
  const recentReplies = replyNotifs.filter((n) => n.unread && n.ts >= cutoff);
  const notifRows = [
    { label: "New leads", items: newLeads.map(leadItem) },
    {
      label: "Unread replies (7 days)",
      items: recentReplies.map((n) => ({
        label: displayName(n.ticket),
        ticket: ticketById[n.ticket.id] || null,
        group: n.boardKey === "franchise" ? "franchise" : "hiring",
      })),
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

        {/* Column 2: total leads + follow-ups tile */}
        <div className="flex flex-col gap-4">
          <CrmLeadsPieTile
            counts={{ franchise: fr.length, instructor: ins.length, frontadmin: fa.length }}
            total={all.length}
            signed={signed}
            onClick={() => goToLeads("franchise")}
            onSelect={(key) => goToLeads(key)}
          />

          {/* Active AI follow-ups tile */}
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="relative overflow-hidden rounded-2xl p-5 text-left hover:brightness-[0.98] transition"
            style={{ background: "var(--tile-sage-bg)", boxShadow: CRM.cardShadow }}
          >
            <Bot className="absolute -right-2 -bottom-3 w-20 h-20 pointer-events-none" style={{ color: "var(--tile-sage-fg)", opacity: 0.12 }} />
            <div className="text-[10px] tracking-[0.12em] uppercase font-semibold flex items-center gap-1.5" style={{ color: "var(--tile-sage-fg)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: CRM.accent }} />
              Active AI follow-ups
            </div>
            <div className="text-3xl font-bold mt-1.5" style={{ color: CRM.ink }}>{activeFollowUps.length}</div>
          </button>
        </div>

        {/* Column 3: inquiries sparkline + meetings tile */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5 flex flex-col flex-1" style={{ background: "var(--tile-peach-bg)", boxShadow: CRM.cardShadow }}>
            <div className="text-[13px] font-semibold leading-tight" style={{ color: "var(--tile-peach-fg)" }}>
              Inquiries received
            </div>
            <div className="text-[10px] tracking-wider uppercase font-semibold mt-0.5" style={{ color: "var(--tile-peach-sub)" }}>
              Last 8 months
            </div>
            <div className="flex-1 min-h-[80px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <Area type="monotone" dataKey="count" stroke="#d97a4a" strokeWidth={1.5} fill="rgba(217,122,74,0.18)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-end justify-between mt-2 text-[9px] font-semibold" style={{ color: "var(--tile-peach-sub)" }}>
              <span>{sparkData[0]?.label}</span>
              <span>{sparkData[sparkData.length - 1]?.label}</span>
            </div>
          </div>

          {/* Contracts tile */}
          <button
            type="button"
            onClick={() => onNavigate("financials")}
            className="relative overflow-hidden rounded-2xl p-5 text-left hover:brightness-[0.98] transition"
            style={{ background: "var(--tile-pink-bg)", boxShadow: CRM.cardShadow }}
          >
            <FileSignature className="absolute -right-2 -bottom-3 w-20 h-20 pointer-events-none" style={{ color: "var(--tile-pink-fg)", opacity: 0.12 }} />
            <div className="text-[10px] tracking-[0.12em] uppercase font-semibold flex items-center gap-1.5" style={{ color: "var(--tile-pink-fg)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: CRM.accent }} />
              Contracts
            </div>
            <div className="text-3xl font-bold mt-1.5" style={{ color: CRM.ink }}>{contracts.length}</div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: "var(--tile-pink-fg)" }}>
              {contracts.filter((c) => c.status === "signed").length} signed
            </div>
          </button>
        </div>
      </div>

      {/* Row 2: upcoming bookings — calendar schedule view */}
      <CrmUpcomingBookingsWidget bookings={bookings} ticketByEmail={ticketByEmail} onNavigate={onNavigate} />

      {aiModalOpen && (
        <CrmAiFollowUpsModal
          leads={activeFollowUps}
          onOpenLead={(t) => { setAiModalOpen(false); setEmailTicket(t); }}
          onClose={() => setAiModalOpen(false)}
        />
      )}

      {emailTicket && (
        <CrmEmailDrawer
          ticket={emailTicket}
          ticketType={BOARD_TYPES.find((b) => b.key === emailTicket._boardKey)?.entity}
          currentUser={currentUser}
          onClose={() => setEmailTicket(null)}
        />
      )}

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