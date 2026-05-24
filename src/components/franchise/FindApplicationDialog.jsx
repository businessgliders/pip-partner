import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

const isEmailValid = (e) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Lightweight launcher: collects an email and checks if an existing franchise
// inquiry is on file. If found, hands off to ResumeInquiryDialog (sends PIN +
// verifies). If not found, shows a friendly message inline.
export default function FindApplicationDialog({ open, onClose, onFound }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | notfound
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setState("idle");
      setError("");
    }
  }, [open]);

  const handleSearch = async () => {
    const normalized = email.trim().toLowerCase();
    if (!isEmailValid(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setState("loading");
    try {
      const res = await base44.functions.invoke("checkInquiryByEmail", { email: normalized });
      const data = res?.data || res;
      if (data?.found) {
        onFound(normalized);
      } else {
        setState("notfound");
      }
    } catch (_) {
      setError("Something went wrong. Please try again.");
      setState("idle");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="rounded-3xl max-w-md bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-[#fbe0e2] flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-[#b67651]" />
          </div>
          <DialogTitle className="text-2xl font-light text-[#b67651] text-center">
            Find your application
          </DialogTitle>
          <DialogDescription className="text-center text-[#b67651]/70 pt-2">
            Enter the email you used to apply and we'll send you a secure code to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Input
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === "notfound") setState("idle"); }}
            onKeyDown={handleKeyDown}
            className="h-12 rounded-xl bg-white border-[#f7b1bd]/50 focus:border-[#f1889b]"
            autoFocus
          />
          {state === "notfound" && (
            <p className="text-sm text-[#b67651]/80 text-center">
              No application found for that email. Please start a new one below.
            </p>
          )}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button
            onClick={handleSearch}
            disabled={state === "loading" || !isEmailValid(email.trim())}
            className="h-12 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
          >
            {state === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching…
              </span>
            ) : (
              "Find my application"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 rounded-xl border-[#f7b1bd] text-[#b67651] hover:bg-[#fbe0e2]/50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}