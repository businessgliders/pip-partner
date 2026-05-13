import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import CleanupTicketRow from "./CleanupTicketRow";

const SPLASH_KEY = "pip_tidyup_splash_seen";

function daysSince(dateString) {
  if (!dateString) return 0;
  const iso = /Z|[+-]\d\d:?\d\d$/.test(dateString) ? dateString : dateString + "Z";
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function ResolvedCleanupPopup({ open, onOpenChange, resolvedTickets, onMoveToClosed, closedStatusLabel = "Closed" }) {
  const [step, setStep] = useState(() => (localStorage.getItem(SPLASH_KEY) ? "select" : "splash"));
  const eligible = (resolvedTickets || []).filter((t) => daysSince(t.created_date) >= 10);
  const [selected, setSelected] = useState(new Set());

  const toggleAll = () => {
    if (selected.size === eligible.length) setSelected(new Set());
    else setSelected(new Set(eligible.map((t) => t.id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleContinue = () => {
    localStorage.setItem(SPLASH_KEY, "1");
    setStep("select");
  };

  const handleConfirm = async () => {
    await onMoveToClosed(Array.from(selected));
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg backdrop-blur-2xl bg-white/95 border-white/40">
        {step === "splash" ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">What is Tidy Up?</h2>
            <p className="text-sm text-gray-600 mb-6">
              Keep your board fresh. Resolved applications older than 10 days can be bulk-moved to {closedStatusLabel} to make room for what matters now.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleContinue}>Mark as read</Button>
              <Button onClick={handleContinue} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">Continue</Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Tidy Up Resolved</h2>
            <p className="text-xs text-gray-500 mb-4">{eligible.length} application{eligible.length === 1 ? "" : "s"} older than 10 days</p>

            {eligible.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">Nothing to tidy up right now ✨</div>
            ) : (
              <>
                <label className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={selected.size === eligible.length && eligible.length > 0}
                    onChange={toggleAll}
                  />
                  Select all
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {eligible.map((t) => (
                    <CleanupTicketRow key={t.id} ticket={t} selected={selected.has(t.id)} onToggle={() => toggleOne(t.id)} />
                  ))}
                </div>
                <Button
                  disabled={selected.size === 0}
                  onClick={handleConfirm}
                  className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white disabled:opacity-50"
                >
                  Move {selected.size} to {closedStatusLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}