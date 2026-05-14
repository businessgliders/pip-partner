import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, KeyRound } from "lucide-react";

// Two-step dialog:
//  step "ask"     → confirm they want to resume + send PIN to their inbox
//  step "verify"  → enter 6-digit PIN
export default function ResumeInquiryDialog({ open, email, onClose, onVerified }) {
  const [step, setStep] = useState("ask");
  const [pin, setPin] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep("ask");
      setPin("");
      setError("");
    }
  }, [open]);

  const handleSendCode = async () => {
    setIsSending(true);
    setError("");
    try {
      await base44.functions.invoke("checkInquiryByEmail", { email, sendPin: true });
      setStep("verify");
    } catch (_) {
      setError("Couldn't send the code. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsVerifying(true);
    setError("");
    try {
      const res = await base44.functions.invoke("verifyInquiryPin", { email, pin });
      const data = res?.data || res;
      if (data?.ok && data.inquiry) {
        onVerified(data.inquiry);
      } else {
        setError(data?.error || "Incorrect code");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Incorrect code";
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="rounded-3xl max-w-md bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-[#fbe0e2] flex items-center justify-center mx-auto mb-3">
            {step === "ask" ? (
              <Mail className="w-5 h-5 text-[#b67651]" />
            ) : (
              <KeyRound className="w-5 h-5 text-[#b67651]" />
            )}
          </div>
          <DialogTitle className="text-2xl font-light text-[#b67651] text-center">
            {step === "ask" ? "Welcome back" : "Enter your code"}
          </DialogTitle>
          <DialogDescription className="text-center text-[#b67651]/70 pt-2">
            {step === "ask" ? (
              <>We found a franchise application linked to <span className="font-medium">{email}</span>. Would you like to continue and book your discovery call?</>
            ) : (
              <>We sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it below to verify.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "ask" && (
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleSendCode}
              disabled={isSending}
              className="h-12 rounded-xl text-white font-medium hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
            >
              {isSending ? "Sending code…" : "Yes, send me a code"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-xl border-[#f7b1bd] text-[#b67651] hover:bg-[#fbe0e2]/50"
            >
              No, start a new application
            </Button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        )}

        {step === "verify" && (
          <div className="flex flex-col gap-3 mt-4">
            <Input
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              placeholder="123456"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-14 text-center text-2xl tracking-[0.5em] rounded-xl bg-white border-[#f7b1bd]/50 focus:border-[#f1889b]"
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button
              onClick={handleVerify}
              disabled={isVerifying || pin.length !== 6}
              className="h-12 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
            >
              {isVerifying ? "Verifying…" : "Verify & continue"}
            </Button>
            <button
              onClick={handleSendCode}
              disabled={isSending}
              className="text-sm text-[#b67651]/70 hover:text-[#b67651] underline disabled:opacity-50"
            >
              {isSending ? "Sending…" : "Resend code"}
            </button>
            <button
              onClick={onClose}
              className="text-sm text-[#b67651]/60 hover:text-[#b67651]"
            >
              Cancel and start a new application
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}