import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, Plus } from "lucide-react";
import { CRM } from "../crmTheme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pick team members (and/or type emails) to add as guests on a booking.
export default function AddGuestsFlow({ booking, onConfirm, pending, error }) {
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState("");
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => (await base44.functions.invoke("listStaffMembers", {}))?.data?.members || [],
    staleTime: 5 * 60 * 1000,
  });

  const already = new Set([...(booking.emails || []), ...(booking.guests || []), ...(booking.hosts || []).map((h) => h.email)].map((e) => String(e).toLowerCase()));
  const toggle = (email) => setSelected((s) => (s.includes(email) ? s.filter((x) => x !== email) : [...s, email]));
  const addCustom = () => {
    const e = custom.trim().toLowerCase();
    if (EMAIL_RE.test(e) && !selected.includes(e)) setSelected((s) => [...s, e]);
    setCustom("");
  };

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: CRM.sub }}>Team members</p>
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-[14px]" style={{ color: CRM.sub }}><Loader2 className="w-4 h-4 animate-spin" /> Loading team…</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(182,118,81,0.14)" }}>
          {members.map((m) => {
            const email = String(m.email).toLowerCase();
            const on = selected.includes(email);
            const dis = already.has(email);
            return (
              <button key={email} type="button" disabled={dis} onClick={() => toggle(email)} className="w-full flex items-center gap-3 px-4 py-3 text-left disabled:opacity-50" style={{ borderBottom: "1px solid rgba(182,118,81,0.10)", background: "var(--crm-card-bg)" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: on ? CRM.ink : "transparent", border: on ? "none" : "1.5px solid rgba(182,118,81,0.35)" }}>
                  {on && <Check className="w-3 h-3" style={{ color: "var(--crm-page-bg)" }} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] truncate" style={{ color: CRM.ink }}>{m.full_name || email}</span>
                  <span className="block text-[12px] truncate" style={{ color: CRM.sub }}>{email}{dis ? " · already on booking" : ""}</span>
                </span>
              </button>
            );
          })}
          {!members.length && <p className="px-4 py-3 text-[14px]" style={{ color: CRM.sub }}>No team members found.</p>}
        </div>
      )}
      <p className="text-[12px] font-semibold uppercase tracking-wide mt-4 mb-2" style={{ color: CRM.sub }}>Other email</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="name@example.com"
          className="flex-1 h-11 px-4 rounded-2xl text-[15px] outline-none"
          style={{ border: "1px solid rgba(182,118,81,0.18)", color: CRM.ink }}
        />
        <button type="button" onClick={addCustom} disabled={!EMAIL_RE.test(custom.trim())} className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40" style={{ background: "var(--crm-blush)", color: CRM.ink }}>
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {selected.filter((e) => !members.some((m) => String(m.email).toLowerCase() === e)).map((e) => (
        <button key={e} type="button" onClick={() => toggle(e)} className="mt-2 mr-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[13px]" style={{ background: "var(--crm-blush)", color: CRM.ink }}>
          {e} ✕
        </button>
      ))}
      {error && <p className="mt-3 text-[13px]" style={{ color: "#e5484d" }}>{error}</p>}
      <button
        type="button"
        disabled={!selected.length || pending}
        onClick={() => onConfirm(selected)}
        className="mt-4 w-full h-12 rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: CRM.ink, color: "var(--crm-page-bg)" }}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />} Add {selected.length || ""} guest{selected.length === 1 ? "" : "s"}
      </button>
    </div>
  );
}