import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft } from "lucide-react";

const CAPITAL_RANGES = ["Under $100K", "$100K - $250K", "$250K - $500K", "$500K - $1M", "$1M+"];
const TIMELINES = [
  "Ready now (0-3 months)",
  "Soon (3-6 months)",
  "Exploring (6-12 months)",
  "Just researching",
];

export default function FranchiseFunnelForm({ formData, onChange, onSubmit, isSubmitting }) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const canProceed = () => {
    if (step === 1) return formData.full_name && formData.email && formData.phone;
    if (step === 2) return formData.city;
    if (step === 3) return formData.investment_readiness && formData.timeline;
    return false;
  };

  const next = () => (step < totalSteps ? setStep(step + 1) : onSubmit());
  const back = () => setStep(Math.max(1, step - 1));

  const inputClass = "rounded-xl h-12 bg-white/70 border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20";
  const labelClass = "text-[#b67651] font-medium text-sm";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full transition-colors duration-300"
            style={{ background: s <= step ? "#f1889b" : "rgba(247,177,189,0.3)" }}
          />
        ))}
      </div>

      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium mb-2">
          STEP {step} OF {totalSteps}
        </p>
        <h3 className="text-2xl md:text-3xl font-light text-[#b67651]">
          {step === 1 && "Let's get acquainted"}
          {step === 2 && "Where are you planning?"}
          {step === 3 && "A few quick qualifiers"}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label className={labelClass}>Full Name *</Label>
                <Input
                  placeholder="Your name"
                  value={formData.full_name}
                  onChange={(e) => onChange("full_name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Email *</Label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Phone *</Label>
                <Input
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={formData.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label className={labelClass}>City / Preferred Territory *</Label>
              <Input
                placeholder="e.g. Toronto, ON"
                value={formData.city}
                onChange={(e) => onChange("city", e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-[#b67651]/60 pt-2">
                We offer exclusive, protected territories. Let us know where you'd like to open.
              </p>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className={labelClass}>Liquid Capital Available *</Label>
                <Select
                  value={formData.investment_readiness}
                  onValueChange={(v) => onChange("investment_readiness", v)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select a range" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPITAL_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Timeline *</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(v) => onChange("timeline", v)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="When would you like to start?" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={back}
            className="h-12 rounded-xl border-[#f7b1bd] text-[#b67651] hover:bg-[#fbe0e2]/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        )}
        <Button
          onClick={next}
          disabled={!canProceed() || isSubmitting}
          className="flex-1 h-12 rounded-xl text-white font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              {step === totalSteps ? "Submit & Book Discovery Call" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}