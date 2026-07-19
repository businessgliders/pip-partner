import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, LayoutDashboard, CalendarDays, Bell, ArrowRight, UserRound } from "lucide-react";
import { CRM } from "./crmTheme";

const ICON = "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png";
const RESTRICTED_EMAILS = ["info@pilatesinpinkstudio.com"];

const SLIDES = [
  {
    icon: Sparkles,
    title: "Welcome to the new PiP Partner",
    body: "The Application Board has been fully redesigned: a warm new look, a simpler sidebar, and everything organized around your leads.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard & Leads",
    body: "Your dashboard greets you with live metrics and notifications. Leads open inline with emails, attributed notes, and AI follow-up at a glance.",
  },
  {
    icon: CalendarDays,
    title: "Bookings & Tasks",
    body: "Bookings live on a calendar filtered by Franchise or Hiring. The new Tasks board gives you custom swimlanes with tasks linked to leads.",
  },
  {
    icon: Bell,
    title: "Smart email notifications",
    body: "When a lead replies, your team gets an email with a direct link into the conversation. Manage recipients under Settings · Notification preferences.",
  },
];

// One-time intro splash. Shown until the user taps "Got it" (persisted on their
// account). For restricted users it cannot be dismissed — they can only switch user.
export default function CrmWelcomeSplash({ user }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  const restricted = RESTRICTED_EMAILS.includes((user?.email || "").toLowerCase());

  if (dismissed || (!restricted && user?.crm_intro_seen)) return null;

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  const gotIt = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ crm_intro_seen: true });
      queryClient.invalidateQueries({ queryKey: ["crm-current-user"] });
    } finally {
      setDismissed(true);
    }
  };

  const switchUser = () => base44.auth.logout("/login");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 crm-root pip-fade-in" style={{ background: "rgba(42,26,31,0.55)" }}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden pip-pop-in text-center">
        <div className="pt-8 pb-6 px-7" style={{ background: "linear-gradient(180deg,#fbe0e2 0%,#ffffff 100%)" }}>
          <img src={ICON} alt="" className="w-14 h-14 mx-auto mb-3" />
          <div className="text-[10px] tracking-[0.25em] font-semibold" style={{ color: CRM.brown }}>
            PIP PARTNER · WHAT'S NEW
          </div>
        </div>
        <div className="px-7 pb-2 min-h-[170px]">
          <span className="w-11 h-11 rounded-full inline-flex items-center justify-center mb-3" style={{ background: CRM.blush }}>
            <Icon className="w-5 h-5" style={{ color: "#a34a5c" }} />
          </span>
          <h2 className="text-[17px] font-semibold mb-2" style={{ color: CRM.ink }}>{slide.title}</h2>
          <p className="text-[13px] leading-relaxed" style={{ color: CRM.sub }}>{slide.body}</p>
        </div>
        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 py-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                background: i === step ? "#f1889b" : "rgba(182,118,81,0.25)",
              }}
            />
          ))}
        </div>
        <div className="px-7 pb-7">
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="w-full h-11 rounded-full text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: CRM.accentSoft, color: "#5b3038" }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : restricted ? (
            <>
              <p className="text-[11px] mb-3" style={{ color: CRM.sub }}>
                This account doesn't have access to the Application Board at this time. Please sign in with a different user.
              </p>
              <button
                type="button"
                onClick={switchUser}
                className="w-full h-11 rounded-full text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: "#2a1a1f", color: "#fbe0e2" }}
              >
                <UserRound className="w-4 h-4" /> Switch user
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={gotIt}
              disabled={saving}
              className="w-full h-11 rounded-full text-[13px] font-semibold disabled:opacity-60"
              style={{ background: "#f6d75e", color: "#4a3a10" }}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}