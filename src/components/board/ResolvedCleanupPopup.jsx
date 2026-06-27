import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import CleanupTicketRow from "./CleanupTicketRow";

const SPLASH_KEY = "pip_tidyup_splash_seen";

function daysSince(dateString) {
  if (!dateString) return 0;
  const d = new Date(dateString);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export default function ResolvedCleanupPopup({ open, onOpenChange, resolvedTickets, onMoveToClosed, skipSplash = false }) {
  const [showSplash, setShowSplash] = useState(() => !skipSplash && !localStorage.getItem(SPLASH_KEY));
  const [selectedIds, setSelectedIds] = useState([]);

  const eligible = useMemo(
    () => (resolvedTickets || []).filter((t) => daysSince(t.created_date) >= 10),
    [resolvedTickets]
  );

  useEffect(() => { if (open) setSelectedIds([]); }, [open]);

  const allSelected = eligible.length > 0 && selectedIds.length === eligible.length;
  const toggleAll = () => setSelectedIds(allSelected ? [] : eligible.map((t) => t.id));
  const toggleOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleConfirm = async () => {
    await onMoveToClosed?.(selectedIds);
    onOpenChange(false);
  };

  const continueFromSplash = () => {
    localStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-2xl border border-white/40">
        {showSplash ? (
          <div className="p-2 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">What is Tidy Up?</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              Tidy Up helps you bulk-close older applications that have been sitting in your Resolved/Approved column for more than 10 days. Keep your board lean and focused.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={continueFromSplash}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Mark as read
              </button>
              <button
                onClick={() => setShowSplash(false)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Tidy up older applications</h2>
            <p className="text-sm text-gray-500 mb-4">Select records older than 10 days to bulk-close.</p>

            {eligible.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Nothing to tidy yet — all your resolved applications are recent.
              </div>
            ) : (
              <>
                <label className="flex items-center gap-2 mb-3 text-sm text-gray-700">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  Select all ({eligible.length})
                </label>
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  {eligible.map((t) => (
                    <CleanupTicketRow
                      key={t.id}
                      ticket={t}
                      checked={selectedIds.includes(t.id)}
                      onChange={() => toggleOne(t.id)}
                    />
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    disabled={selectedIds.length === 0}
                    onClick={handleConfirm}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Move {selectedIds.length} to Closed
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}