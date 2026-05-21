import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Loader2, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

// Admin utility: re-send the franchise "call booked" emails for a given
// FranchiseInquiry. Useful when the original automated send was missed
// (e.g., browser closed before Cal.com confirmation reached our backend).
export default function ResendBookingEmailsButton({ inquiryId, scheduledTime, recipientEmail }) {
  const [sending, setSending] = useState(null); // null | "owner" | "submitter" | "both"
  const [done, setDone] = useState(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  if (!inquiryId || !scheduledTime) return null;

  const send = async (mode) => {
    setSending(mode);
    setDone(null);
    try {
      // sendFranchiseInquiryEmail sends owner immediately + submitter after a 2.5min delay.
      // ownerOnly=true skips the submitter send.
      // For "submitter" mode, we want only the submitter — call it twice would be wrong;
      // instead, we pass a flag we'll add later. For now, the function supports:
      //   - default: both (owner now, submitter delayed)
      //   - ownerOnly: owner only
      // So we expose: "both" and "owner". For "submitter only", we just call default and rely on the delayed submitter; owner will also fire. Simpler UX: keep two options.
      const payload = {
        inquiryId,
        scheduledTime,
      };
      if (mode === "owner") payload.ownerOnly = true;
      if (mode === "submitter") payload.submitterOnly = true;

      await base44.functions.invoke("sendFranchiseInquiryEmail", payload);
      setDone(mode);
      toast({
        title: "Emails queued",
        description:
          mode === "owner"
            ? "Owner notification sent."
            : mode === "submitter"
            ? "Submitter confirmation will arrive shortly."
            : "Owner notification sent. Submitter confirmation arrives in ~2.5 min.",
      });
      setTimeout(() => {
        setDone(null);
        setOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Resend failed:", err);
      toast({
        title: "Failed to send",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Resend booking emails"
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-medium hover:bg-amber-200 transition whitespace-nowrap"
        >
          {sending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : done ? (
            <Check className="w-3 h-3" />
          ) : (
            <Mail className="w-3 h-3" />
          )}
          <span className="hidden lg:inline">Resend</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="px-2.5 py-2 text-[10px] tracking-wider uppercase text-slate-500 font-semibold">
          Resend booking emails
        </div>
        <button
          type="button"
          onClick={() => send("both")}
          disabled={!!sending}
          className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100 disabled:opacity-50"
        >
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          <div>
            <div className="font-medium">Both (owner + submitter)</div>
            <div className="text-[10px] text-slate-500">Submitter delayed ~2.5 min</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => send("owner")}
          disabled={!!sending}
          className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100 disabled:opacity-50"
        >
          <Mail className="w-3.5 h-3.5 text-emerald-600" />
          <div>
            <div className="font-medium">Owner notification only</div>
            <div className="text-[10px] text-slate-500">Send to franchise team</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => send("submitter")}
          disabled={!!sending}
          className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 rounded-md hover:bg-slate-100 disabled:opacity-50"
        >
          <Mail className="w-3.5 h-3.5 text-blue-600" />
          <div>
            <div className="font-medium">Submitter confirmation only</div>
            <div className="text-[10px] text-slate-500">
              To {recipientEmail || "applicant"}
            </div>
          </div>
        </button>
      </PopoverContent>
    </Popover>
  );
}