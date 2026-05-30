import React, { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CHANGELOG_ENTRIES, LATEST_CHANGELOG_ID } from "@/lib/changelog";

export default function ChangelogPopup({ user }) {
  const [open, setOpen] = useState(false);
  const [lastReadId, setLastReadId] = useState(user?.last_read_changelog_id || null);
  const [marking, setMarking] = useState(false);

  // Auto-open once if user hasn't seen the latest entry
  useEffect(() => {
    if (!user) return;
    const stored = user.last_read_changelog_id || null;
    setLastReadId(stored);
    if (LATEST_CHANGELOG_ID && stored !== LATEST_CHANGELOG_ID) {
      // small delay so it doesn't fight other modals on load
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  const hasUnread = LATEST_CHANGELOG_ID && lastReadId !== LATEST_CHANGELOG_ID;

  const handleMarkRead = async () => {
    if (!LATEST_CHANGELOG_ID || !hasUnread) {
      setOpen(false);
      return;
    }
    setMarking(true);
    try {
      await base44.auth.updateMe({ last_read_changelog_id: LATEST_CHANGELOG_ID });
      setLastReadId(LATEST_CHANGELOG_ID);
    } finally {
      setMarking(false);
      setOpen(false);
    }
  };

  // Determine which entries are "new" relative to the user's last read
  const lastReadIdx = lastReadId
    ? CHANGELOG_ENTRIES.findIndex((e) => e.id === lastReadId)
    : -1;
  const isNew = (idx) => lastReadIdx === -1 || idx < lastReadIdx;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="What's new"
        className="relative h-10 w-10 lg:h-11 lg:w-11 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 hover:bg-white/80 shadow-lg flex items-center justify-center"
      >
        <Sparkles className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pink-500 border-2 border-white" />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-gradient-to-br from-pink-50 to-white relative">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-pink-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">What's new</h2>
                <p className="text-xs text-slate-500">Recent updates to the admin board</p>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
            {CHANGELOG_ENTRIES.slice(0, 3).map((entry, idx) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isNew(idx) ? "bg-pink-500" : "bg-slate-300"
                    }`}
                  />
                  {idx < Math.min(2, CHANGELOG_ENTRIES.length - 1) && (
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{entry.title}</h3>
                    {isNew(idx) && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{entry.date}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {entry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              {hasUnread ? "You have unread updates" : "All caught up"}
            </span>
            <button
              onClick={handleMarkRead}
              disabled={marking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              {marking ? "Saving..." : hasUnread ? "Mark as read" : "Close"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}