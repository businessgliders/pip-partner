import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, ArrowRight, LogOut } from "lucide-react";

const RESTRICTED_EMAILS = ["info@pilatesinpinkstudio.com"];

const SLIDES = [
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/fb648300b_generated_image.png",
    title: "Welcome to the new PiP Partner",
    body: "The Application Board has been fully redesigned: a warm new look, a simpler sidebar, and a dashboard that greets you with live metrics and notifications.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/bd0d84591_generated_image.png",
    title: "Leads, reimagined",
    body: "Leads open inline with the full email conversation, attributed team notes, and AI follow-up progress visible at a glance.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/40602c002_generated_image.png",
    title: "Bookings & Tasks",
    body: "Bookings live on a calendar filtered by Franchise or Hiring, and the new Tasks board gives you custom swimlanes with tasks linked to leads.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/5a531a851_generated_image.png",
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 crm-root pip-fade-in bg-black/30 backdrop-blur-md">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl pip-pop-in text-center">
        {/* Hero image */}
        <div className="h-44 sm:h-52 w-full overflow-hidden bg-[#fbe0e2]">
          <img src={slide.image} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="px-8 pt-6 pb-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-[11px] font-semibold mb-3">
            <Sparkles className="w-3 h-3" /> NEW
          </span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h2>
          <p className="text-[13px] leading-relaxed text-gray-500 min-h-[60px]">{slide.body}</p>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 py-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                background: i === step ? "#e989a0" : "#f0dcd9",
              }}
            />
          ))}
        </div>

        <div className="px-8 pb-8 pt-2 flex items-center justify-center gap-3">
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="h-11 px-7 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 text-white"
              style={{ background: "#e989a0" }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : restricted ? (
            <button
              type="button"
              onClick={switchUser}
              className="h-11 px-6 rounded-full text-sm font-semibold inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" /> Switch account
            </button>
          ) : (
            <button
              type="button"
              onClick={gotIt}
              disabled={saving}
              className="h-11 px-8 rounded-full text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#e989a0" }}
            >
              Got it
            </button>
          )}
        </div>

        {restricted && isLast && (
          <p className="px-8 pb-6 -mt-4 text-[11px] text-gray-400">
            This account doesn't have access to the Application Board at this time.
          </p>
        )}
      </div>
    </div>
  );
}