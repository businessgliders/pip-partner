import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import HeroSection from "../components/franchise/HeroSection";
import PillarsSection from "../components/franchise/PillarsSection";
import OpportunitySection from "../components/franchise/OpportunitySection";
import IdealPartnerSection from "../components/franchise/IdealPartnerSection";
import FranchiseFunnelForm from "../components/franchise/FranchiseFunnelForm";
import SchedulePlaceholder from "../components/franchise/SchedulePlaceholder";
import LoadingTransition from "../components/franchise/LoadingTransition";

export default function OwnAStudio() {
  const [stage, setStage] = useState("form"); // form | loading | schedule | done
  const [inquiryId, setInquiryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const formSectionRef = useRef(null);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    setStage("loading");
    const record = await base44.entities.FranchiseInquiry.create({ ...formData, status: "new" });
    setInquiryId(record.id);
    // small dramatic pause for the loading state
    setTimeout(() => {
      setIsSubmitting(false);
      setStage("schedule");
    }, 1600);
  };

  const handleScheduleConfirm = async (slot) => {
    setIsSubmitting(true);
    if (inquiryId) {
      await base44.entities.FranchiseInquiry.update(inquiryId, {
        scheduled_call_time: slot,
        status: "scheduled",
      });
    }
    setIsSubmitting(false);
    setStage("done");
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
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
              Confidential <span className="italic">enquiries</span>
              <br /> welcome
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
                />
              </motion.div>
            )}
            {stage === "loading" && <LoadingTransition key="loading" />}
            {stage === "schedule" && (
              <SchedulePlaceholder
                key="schedule"
                onConfirm={handleScheduleConfirm}
                isSubmitting={isSubmitting}
              />
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

      {/* Footer */}
      <footer className="bg-[#2a1a1f] text-white/80 py-14 px-6 mt-6">
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