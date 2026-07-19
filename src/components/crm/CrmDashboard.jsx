import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, subMonths, startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { displayName } from "@/components/board/boardConfig";
import CrmDashboardNotifications from "./CrmDashboardNotifications";
import { CRM } from "./crmTheme";

const DONUT_COLORS = ["#f1889b", "#f7b1bd", "#b67651"];

export default function CrmDashboard({ onNavigate }) {
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

  const fr = useMemo(() => franchise.filter((t) => !t.archived), [franchise]);
  const ins = useMemo(() => instructor.filter((t) => !t.archived), [instructor]);
  const fa = useMemo(() => frontadmin.filter((t) => !t.archived), [frontadmin]);
  const all = useMemo(() => [...fr, ...ins, ...fa], [fr, ins, fa]);

  // Franchise conversion: leads that made it past first contact.
  const converted = fr.filter((t) =>
    ["nda", "fdd", "signed", "site_selection", "lease", "build_out", "training"].includes(t.status)
  ).length;
  const conversion = fr.length ? Math.round((converted / fr.length) * 100) : 0;
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

  const donutData = [
    { name: "Franchising", value: fr.length },
    { name: "Instructor", value: ins.length },
    { name: "Front Desk", value: fa.length },
  ].filter((d) => d.value > 0);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => b?.start && new Date(b.start).getTime() >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);
  }, [bookings]);

  // Notifications derived from live data.
  const newLeads = all.filter((t) => ["new", "pending"].includes(t.status));
  const activeFollowUps = all.filter((t) => t.follow_up?.enabled);
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  const recentReplies = inboundEmails.filter(
    (m) => new Date(m.created_date).getTime() >= cutoff && !(m.read_by || []).length
  );
  const notifRows = [
    { label: "New leads", count: newLeads.length, items: newLeads.map((t) => displayName(t)) },
    { label: "Unread replies (7 days)", count: recentReplies.length, items: recentReplies.map((m) => m.from_name || m.from_email || m.subject) },
    { label: "Active follow-ups", count: activeFollowUps.length, items: activeFollowUps.map((t) => displayName(t)) },
  ];

  const goToLeads = (src) => onNavigate("leads", src);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">
      {/* Row 1: tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Middle stack: conversion + sparkline */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: "#e8e4d8", boxShadow: CRM.cardShadow }}>
            <div className="text-[10px] tracking-[0.12em] uppercase font-semibold flex items-center gap-1.5" style={{ color: "#6b6353" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: CRM.accent }} />
              Lead conversion <span className="text-[9px] px-1 py-px rounded bg-white/60">FRANCHISE</span>
            </div>
            <div className="text-4xl font-bold mt-1.5" style={{ color: CRM.ink }}>{conversion}%</div>
          </div>
          <div className="rounded-2xl p-5 flex-1" style={{ background: "#fbe9dc", boxShadow: CRM.cardShadow }}>
            <div className="text-[13px] font-semibold leading-tight" style={{ color: "#7a4a30" }}>
              Inquiries received
            </div>
            <div className="text-[10px] tracking-wider uppercase font-semibold mt-0.5" style={{ color: "#b08668" }}>
              Last 8 months
            </div>
            <div className="h-14 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <Area type="monotone" dataKey="count" stroke="#d97a4a" strokeWidth={1.5} fill="rgba(217,122,74,0.18)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Donut — source of leads */}
        <div className="crm-card p-5">
          <div className="text-[16px] font-semibold" style={{ color: CRM.ink }}>
            Source of <span className="px-2 py-0.5 rounded-full text-[13px]" style={{ background: CRM.blush }}>leads</span>
          </div>
          <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mt-0.5" style={{ color: CRM.sub }}>
            All time
          </div>
          <div className="h-44 relative mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius="62%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] tracking-[0.2em] uppercase font-semibold" style={{ color: CRM.sub }}>Total</span>
              <span className="text-2xl font-bold" style={{ color: CRM.ink }}>{all.length}</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-1">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-[12px]" style={{ color: CRM.ink }}>
                <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                {d.name}
                <span className="ml-auto font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: upcoming events + notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="crm-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fdf3d8" }}>
              <CalendarDays className="w-3.5 h-3.5" style={{ color: "#b8860b" }} />
            </span>
            <span className="text-[14px] font-semibold" style={{ color: CRM.ink }}>
              {upcoming.length} Upcoming {upcoming.length === 1 ? "event" : "events"}
            </span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[12px] py-3" style={{ color: CRM.sub }}>No upcoming meetings scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigate("bookings")}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left hover:bg-[#fdf8f4]"
                  style={{ border: "1px solid rgba(182,118,81,0.10)" }}
                >
                  <span className="text-[13px] font-medium truncate" style={{ color: CRM.ink }}>
                    {b.title || (b.emails || [])[0] || "Meeting"}
                  </span>
                  <span className="text-[12px] shrink-0 ml-3" style={{ color: CRM.sub }}>
                    {format(new Date(b.start), "MMM d, h:mma").toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <CrmDashboardNotifications rows={notifRows} />
      </div>
    </div>
  );
}