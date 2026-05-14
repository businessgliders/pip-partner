import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft } from "lucide-react";
import CityInput from "./CityInput";

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Northwest Territories",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

// Validates a North American phone number (10 digits after stripping formatting).
// Rejects obvious fakes like 1234567890, 0000000000, all-same digits, or sequential patterns.
const isValidPhone = (raw) => {
  if (!raw) return false;
  const digits = raw.replace(/\D/g, "");
  // Allow optional leading country code '1' → strip it
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return false;
  // Area code and exchange code must start with 2-9 (NANP rule)
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(local)) return false;
  // Reject all-same digits (e.g. 1111111111)
  if (/^(\d)\1+$/.test(local)) return false;
  // Reject ascending/descending sequences
  if (local === "1234567890" || local === "0123456789" || local === "9876543210") return false;
  return true;
};

const CAPITAL_RANGES = [
  "$150K - $200K",
  "$200K - $300K",
  "$300K+",
];

const OPERATION_STYLES = [
  "Owner-Operator (hands-on daily)",
  "Semi-Absentee (with a manager)",
  "Investor (fully managed)",
];

const NDA_OPTIONS = ["Yes", "No", "Need more info first"];

const WHY_OPTIONS = [
  "Passion for wellness & movement",
  "Love the brand & aesthetic",
  "Business opportunity",
  "Community impact",
  "Other",
];

export default function FranchiseFunnelForm({ formData, onChange, onSubmit, isSubmitting }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const canProceed = () => {
    if (step === 1) return formData.first_name && formData.last_name && formData.email && isValidPhone(formData.phone);
    if (step === 2) return formData.available_capital && formData.province && formData.preferred_location;
    if (step === 3) return formData.operation_style && formData.ready_to_sign_nda;
    if (step === 4) return (formData.why_pilates_in_pink || "").length > 0 && (formData.business_experience || "").trim().length >= 100;
    return false;
  };

  const next = () => (step < totalSteps ? setStep(step + 1) : onSubmit());
  const back = () => setStep(Math.max(1, step - 1));

  const inputClass = "rounded-xl h-12 bg-white/70 border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20";
  const labelClass = "text-[#b67651] font-medium text-sm";
  const hintClass = "text-xs text-[#b67651]/60";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const s = i + 1;
          return (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-colors duration-300"
              style={{ background: s <= step ? "#f1889b" : "rgba(247,177,189,0.3)" }}
            />
          );
        })}
      </div>

      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium mb-2">
          STEP {step} OF {totalSteps}
        </p>
        <h3 className="text-2xl md:text-3xl font-light text-[#b67651]">
          {step === 1 && "Let's get acquainted"}
          {step === 2 && "Investment & territory"}
          {step === 3 && "Operation & commitment"}
          {step === 4 && "A little about you"}
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
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>First Name *</Label>
                  <Input
                    placeholder="First name"
                    value={formData.first_name || ""}
                    onChange={(e) => onChange("first_name", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Last Name *</Label>
                  <Input
                    placeholder="Last name"
                    value={formData.last_name || ""}
                    onChange={(e) => onChange("last_name", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Email *</Label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email || ""}
                  onChange={(e) => onChange("email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Phone *</Label>
                <Input
                  type="tel"
                  placeholder="(416) 555-0142"
                  value={formData.phone || ""}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className={inputClass}
                />
                {formData.phone && !isValidPhone(formData.phone) && (
                  <p className="text-xs text-red-500">Please enter a valid North American phone number.</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className={labelClass}>Available Capital? *</Label>
                <p className={hintClass}>Local Currency (CAD)</p>
                <Select
                  value={formData.available_capital || ""}
                  onValueChange={(v) => onChange("available_capital", v)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPITAL_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>Area you'd love to have a Pilates in Pink? (Province) *</Label>
                <Select
                  value={formData.province || ""}
                  onValueChange={(v) => onChange("province", v)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>City in your Province *</Label>
                <p className={hintClass}>Please enter the Town/City</p>
                <CityInput
                  value={formData.preferred_location}
                  onChange={(v) => onChange("preferred_location", v)}
                  province={formData.province}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className={labelClass}>How would you like to operate your Pilates in Pink? *</Label>
                <Select
                  value={formData.operation_style || ""}
                  onValueChange={(v) => onChange("operation_style", v)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_STYLES.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>Ready to Sign the NDA? *</Label>
                <Select
                  value={formData.ready_to_sign_nda || ""}
                  onValueChange={(v) => onChange("ready_to_sign_nda", v)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {NDA_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label className={labelClass}>Why Pilates in Pink? * <span className="font-normal text-[#b67651]/60">(select all that apply)</span></Label>
                <div className="grid gap-2">
                  {WHY_OPTIONS.map((o) => {
                    const selected = (formData.why_pilates_in_pink || "").split(", ").filter(Boolean);
                    const isChecked = selected.includes(o);
                    const toggle = () => {
                      const next = isChecked ? selected.filter((s) => s !== o) : [...selected, o];
                      onChange("why_pilates_in_pink", next.join(", "));
                    };
                    return (
                      <label
                        key={o}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-[#fbe0e2]/60 border-[#f1889b]"
                            : "bg-white/70 border-[#f7b1bd]/50 hover:bg-white"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={toggle}
                          className="border-[#f1889b] data-[state=checked]:bg-[#f1889b] data-[state=checked]:border-[#f1889b]"
                        />
                        <span className="text-sm text-[#b67651]">{o}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>Business or Related Experience *</Label>
                <Textarea
                  placeholder="Tell us about your background, business ownership, leadership, or relevant industry experience..."
                  value={formData.business_experience || ""}
                  onChange={(e) => onChange("business_experience", e.target.value)}
                  className="rounded-xl bg-white/70 border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 min-h-[140px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className={`text-xs ${(formData.business_experience || "").trim().length >= 100 ? "text-[#b67651]/60" : "text-red-500"}`}>
                    {(formData.business_experience || "").trim().length} / 100
                  </p>
                </div>
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
            className="h-12 rounded-xl border-[#f7b1bd] text-[#b67651] hover:bg-[#fbe0e2]/50 px-3 sm:px-4"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
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
              {step === totalSteps ? "Book a Call" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      {step === totalSteps && (
        <p className={`${hintClass} mt-3 text-center`}>Minimum 100 characters for business experience</p>
      )}
    </div>
  );
}