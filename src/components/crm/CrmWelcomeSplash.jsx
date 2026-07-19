import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight, LogOut, X } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const RESTRICTED_EMAILS = ["info@pilatesinpinkstudio.com"];

const SLIDES = [
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/fb648300b_generated_image.png",
    title: "New look. Same PiP Partner.",
    body: "The Application Board has been fully redesigned: a warm new look, a simpler sidebar, and a dashboard that greets you with live metrics and notifications.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/bd0d84591_generated_image.png",
    title: "Leads, reimagined",
    body: "Leads open inline with the full email conversation, attributed team notes, and AI follow-up progress visible at a glance.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/40602c002_generated_image.png",
    title: "Meetings & Tasks",
    body: "Meetings live on a calendar filtered by Franchise or Hiring, and the new Tasks board gives you custom swimlanes with tasks linked to leads.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/5a531a851_generated_image.png",
    title: "Smart email notifications",
    body: "When a lead replies, your team gets an email with a direct link into the conversation. Manage recipients under Settings · Notification preferences.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/91a79cbd4_generated_image.png",
    title: "Introducing Contracts",
    body: "A new Contracts hub in the sidebar. Contract-ready leads get their own Google Drive folder where you can upload agreements and track them as Draft, Sent or Signed.",
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
  const show = !(dismissed || (!restricted && user?.crm_intro_seen_v2));
  useLockBodyScroll(show);

  if (!show) return null;

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const gotIt = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ crm_intro_seen_v2: true });
      queryClient.invalidateQueries({ queryKey: ["crm-current-user"] });
    } finally {
      setDismissed(true);
    }
  };

  const switchUser = () => base44.auth.logout("/login");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 crm-root pip-fade-in bg-black/30 backdrop-blur-md">
      <div className="relative bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl pip-pop-in text-left">
        {/* Close */}
        {!restricted && (
          <button
            type="button"
            onClick={gotIt}
            disabled={saving}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}

        {/* Hero image */}
        <div className="h-56 sm:h-64 w-full overflow-hidden bg-[#fbe0e2]">
          <img src={slide.image} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="px-8 pt-7 pb-8">
          <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900 mb-3">
            {slide.title}
          </h2>
          <p className="text-[14px] leading-relaxed text-gray-600 min-h-[63px]">{slide.body}</p>

          <div className="mt-7 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 18 : 6,
                    height: 6,
                    background: i === step ? "#111827" : "#e5e7eb",
                  }}
                />
              ))}
            </div>

            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 text-white bg-gray-900 hover:bg-black"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : restricted ? (
              <button
                type="button"
                onClick={switchUser}
                className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" /> Switch account
              </button>
            ) : (
              <button
                type="button"
                onClick={gotIt}
                disabled={saving}
                className="h-10 px-6 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-black disabled:opacity-60"
              >
                Got it
              </button>
            )}
          </div>

          {restricted && isLast && (
            <p className="pt-4 text-[11px] text-gray-400">
              This account doesn't have access to the Application Board at this time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}