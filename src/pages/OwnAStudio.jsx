import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import HeroSection from "../components/franchise/HeroSection";
import BackToHome from "../components/BackToHome";
import AdminPadlock from "../components/AdminPadlock";
import PillarsSection from "../components/franchise/PillarsSection";
import OpportunitySection from "../components/franchise/OpportunitySection";
import IdealPartnerSection from "../components/franchise/IdealPartnerSection";
import FranchiseFunnelForm from "../components/franchise/FranchiseFunnelForm";
import SchedulePlaceholder from "../components/franchise/SchedulePlaceholder";
import LoadingTransition from "../components/franchise/LoadingTransition";
import ResumeInquiryDialog from "../components/franchise/ResumeInquiryDialog";
import FindApplicationDialog from "../components/franchise/FindApplicationDialog";
import Seo from "@/components/Seo";

// Wraps a promise so the UI never hangs forever if the network/backend stalls.
function withTimeout(promise, ms, message = "Request timed out") {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export default function OwnAStudio() {
  const [stage, setStage] = useState("form"); // form | loading | schedule | done | resumed
  const [inquiryId, setInquiryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [resumedInquiry, setResumedInquiry] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    available_capital: "",
    province: "",
    preferred_location: "",
    operation_style: "",
    ready_to_sign_nda: "",
    why_pilates_in_pink: "",
    business_experience: "",
  });
  const [resumeDialog, setResumeDialog] = useState({ open: false, email: "" });
  const [findDialogOpen, setFindDialogOpen] = useState(false);
  const formSectionRef = useRef(null);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleExistingEmailFound = (email) => {
    setResumeDialog({ open: true, email });
  };

  const handleResumeVerified = (inquiry) => {
    // Pre-fill the form data so SchedulePlaceholder + booking have everything they need
    setFormData((prev) => ({
      ...prev,
      first_name: inquiry.first_name || prev.first_name,
      last_name: inquiry.last_name || prev.last_name,
      email: inquiry.email || prev.email,
      phone: inquiry.phone || prev.phone,
      preferred_location: inquiry.preferred_location || prev.preferred_location,
      available_capital: inquiry.available_capital || prev.available_capital,
    }));
    setInquiryId(inquiry.id);
    setResumeDialog({ open: false, email: "" });

    // If the applicant already booked a call OR is past the "new" stage, they
    // shouldn't see the booking step again. Show a friendly status view that
    // displays their existing booking instead of the slot picker — this is the
    // primary defence against duplicate bookings on resumed sessions.
    const alreadyBooked = !!inquiry.scheduled_call_time;
    const alreadyProgressed = inquiry.status && inquiry.status !== "new";
    if (alreadyBooked || alreadyProgressed) {
      setResumedInquiry(inquiry);
      setStage("resumed");
    } else {
      setStage("schedule");
    }
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    setStage("loading");
    const record = await base44.entities.FranchiseInquiry.create({ ...formData, status: "new" });
    setInquiryId(record.id);

    // Notify owners immediately, even if user never picks a slot
    base44.functions.invoke("sendFranchiseInquiryEmail", {
      inquiryId: record.id,
      inquiryData: formData,
      scheduledTime: "",
      ownerOnly: true,
    });

    // small dramatic pause for the loading state
    setTimeout(() => {
      setIsSubmitting(false);
      setStage("schedule");
    }, 1600);
  };

  const handleScheduleConfirm = async (slot) => {
    // slot = { start: ISO, friendly: "Mon, Apr 22 at 10:00 AM", timeZone }
    setIsSubmitting(true);
    setBookingError(null);

    try {
      // 0) Re-check the inquiry record right before booking. If a call is
      //    already scheduled (e.g. a previous tab booked it, or the user
      //    refreshed after a successful booking), skip straight to "done"
      //    instead of creating a duplicate Cal.com booking.
      if (inquiryId) {
        try {
          const fresh = await base44.entities.FranchiseInquiry.get(inquiryId);
          if (fresh?.scheduled_call_time) {
            setStage("done");
            return;
          }
        } catch (_) {}
      }

      // 1) Book on Cal.com with a hard 25s timeout so the UI can never
      //    hang on "Confirming…" if the request stalls. The server also
      //    enforces idempotency — if the inquiry already has a scheduled
      //    call, it returns alreadyBooked:true without creating a duplicate.
      const bookRes = await withTimeout(
        base44.functions.invoke("bookCalEvent", {
          start: slot.start,
          timeZone: slot.timeZone,
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          email: formData.email,
          phone: formData.phone,
          notes: `Franchise inquiry — ${formData.preferred_location || ""} (${formData.available_capital || ""})`,
          inquiryId,
          friendlyTime: slot.friendly,
          boardKey: 'franchise',
        }),
        25000,
        "Booking is taking longer than expected"
      );

      const alreadyBooked = bookRes?.data?.alreadyBooked || bookRes?.alreadyBooked;

      // Inquiry record + status update is now performed server-side inside
      // bookCalEvent (the public applicant can't update the entity due to RLS).
      // Here we only fire the confirmation email — and only if we actually
      // created a new booking.
      if (inquiryId && !alreadyBooked) {
        base44.functions.invoke("sendFranchiseInquiryEmail", {
          inquiryId: inquiryId,
          inquiryData: formData,
          scheduledTime: slot.friendly,
        });
      }

      setStage("done");
    } catch (err) {
      console.error("bookCalEvent failed", err);
      setBookingError(
        "We couldn't book that slot. It may have just been taken, or the connection was interrupted. Please pick another time or try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
      <Seo
        title="Own a Studio | Pilates in Pink™"
        description="Become a Pilates in Pink™ franchise partner and bring luxury reformer pilates to your city. Book a private discovery call with our franchise team."
        path="/OwnAStudio"
        type="website"
      />
      <BackToHome />
      <AdminPadlock />
      <ResumeInquiryDialog
        open={resumeDialog.open}
        email={resumeDialog.email}
        onClose={() => setResumeDialog({ open: false, email: "" })}
        onVerified={handleResumeVerified}
      />
      <FindApplicationDialog
        open={findDialogOpen}
        onClose={() => setFindDialogOpen(false)}
        onFound={(email) => {
          setFindDialogOpen(false);
          setResumeDialog({ open: true, email });
        }}
      />
      <HeroSection onCTAClick={scrollToForm} />
      <PillarsSection />
      <OpportunitySection />
      <IdealPartnerSection />

      {/* Funnel Section */}
      <section ref={formSectionRef} className="py-10 md:py-14 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium mb-3">
              TAKE THE NEXT STEP
            </p>
            <h2 className="text-4xl md:text-5xl font-light text-[#b67651] mb-4">
              Let's <span className="italic">Get Started</span>
            </h2>
            <p className="text-[#b67651]/70 max-w-md mx-auto">
              Answer a few quick questions and we'll set up a private discovery call with our franchise team.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {stage === "form" && (
              <motion.div key="form" exit={{ opacity: 0 }}>
                <FranchiseFunnelForm
                  formData={formData}
                  onChange={handleChange}
                  onSubmit={handleFormSubmit}
                  isSubmitting={isSubmitting}
                  onExistingEmailFound={handleExistingEmailFound}
                />
                <p className="text-center text-sm text-[#b67651]/70 mt-5">
                  Already applied?{" "}
                  <button
                    type="button"
                    onClick={() => setFindDialogOpen(true)}
                    className="underline text-[#f1889b] hover:text-[#b67651] font-medium"
                  >
                    Find my application
                  </button>
                </p>
              </motion.div>
            )}
            {stage === "loading" && <LoadingTransition key="loading" />}
            {stage === "schedule" && (
              <SchedulePlaceholder
                key="schedule"
                inquiryId={inquiryId}
                onConfirm={handleScheduleConfirm}
                isSubmitting={isSubmitting}
                bookingError={bookingError}
                onClearBookingError={() => setBookingError(null)}
                boardKey="franchise"
              />
            )}
            {stage === "resumed" && resumedInquiry && (
              <motion.div
                key="resumed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-[#b67651]" />
                </motion.div>
                <h2 className="text-2xl font-light text-[#b67651] mb-3">
                  Welcome back, {resumedInquiry.first_name}
                </h2>
                {resumedInquiry.scheduled_call_time ? (
                  <>
                    <p className="text-[#b67651]/70 max-w-md mx-auto leading-relaxed mb-5">
                      Your discovery call is already booked for:
                    </p>
                    <div className="inline-block bg-[#fbe0e2]/60 border border-[#f1889b]/40 rounded-2xl px-6 py-4">
                      <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium mb-1">
                        YOUR CALL
                      </p>
                      <p className="text-lg text-[#b67651] font-medium">
                        {resumedInquiry.scheduled_call_time}
                      </p>
                    </div>
                    <p className="text-[#b67651]/60 text-sm mt-5 max-w-md mx-auto">
                      Check your inbox for the calendar invite. We can't wait to chat.
                    </p>
                  </>
                ) : (
                  <p className="text-[#b67651]/70 max-w-md mx-auto leading-relaxed">
                    Your application is already with our franchise team and is being reviewed. We'll be in touch by email with next steps shortly.
                  </p>
                )}
              </motion.div>
            )}
            {stage === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-[#b67651]" />
                </motion.div>
                <h2 className="text-2xl font-light text-[#b67651] mb-3">You're all set!</h2>
                <p className="text-[#b67651]/70 max-w-md mx-auto leading-relaxed">
                  Your discovery call is confirmed. Check your email for a calendar invite and next steps from our franchise team.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Curved top divider for footer */}
      <div className="relative -mb-px pointer-events-none block leading-[0]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="w-full h-16 md:h-24 block"
        >
          <path
            d="M0,120 L0,60 Q720,-20 1440,60 L1440,120 Z"
            fill="#2a1a1f"
          />
        </svg>
      </div>

      {/* Footer */}
      <footer className="bg-[#2a1a1f] text-white/80 py-14 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-center text-center md:text-left">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#f7b1bd] font-medium mb-3">EXPLORE</p>
            <ul className="space-y-1.5">
              <li>
                <a href="https://www.pilatesinpinkstudio.com/" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="https://www.pilatesinpinkstudio.com/classes" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">
                  Classes
                </a>
              </li>
              <li>
                <a href="https://www.pilatesinpinkstudio.com/memberships" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">
                  Memberships
                </a>
              </li>
            </ul>
          </div>
          <div className="text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink™"
              className="w-12 h-12 mx-auto mb-2 opacity-80"
            />
            <p className="text-xs tracking-[0.2em] text-white/60">PRETTY • POWERFUL • PILATES</p>
          </div>
          <div className="text-sm text-white/70 md:text-right">
            <p className="text-xs tracking-[0.2em] text-[#f7b1bd] font-medium mb-3">HQ</p>
            <p>6161 Mayfield Road, Unit #105</p>
            <p>Brampton, Ontario, Canada</p>
            <p className="text-white/50 text-xs mt-2">Canadian Owned & Operated</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-white/10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Pilates in Pink™ • All rights reserved
        </div>
      </footer>
    </div>
  );
}