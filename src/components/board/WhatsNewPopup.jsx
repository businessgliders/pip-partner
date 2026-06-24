import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check } from "lucide-react";

/**
 * "What's New" popup — replaces the old onboarding Tutorial. Surfaces the
 * latest product changes on first load, then dismisses for that user.
 *
 * Persistence: per-user localStorage key suffixed with the user's email so
 * each staff member sees the popup once per release. Bump RELEASE_KEY when
 * publishing a new round of changes to re-surface the popup for everyone.
 */
const RELEASE_KEY = "v2026-06-24-statuses";
const STORAGE_PREFIX = "pip_whats_new_seen";

function storageKey(email) {
  return `${STORAGE_PREFIX}:${RELEASE_KEY}:${(email || "").toLowerCase()}`;
}

export function hasSeenWhatsNew(email) {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(storageKey(email)) === "1";
  } catch {
    return true;
  }
}

function markSeen(email) {
  try {
    window.localStorage.setItem(storageKey(email), "1");
  } catch {
    // ignore
  }
}

const HIGHLIGHTS = [
  {
    title: "New Step 1 statuses",
    body:
      "The franchise pipeline now uses New → Discovery → No Show → NDA → FDD → Signed. Old statuses (Scheduled, Discussion, Contacted, Qualified) were auto-migrated.",
  },
  {
    title: "Step 2 unchanged",
    body: "Site Selection → Lease → Build-Out → Training remain the same.",
  },
  {
    title: "Renamed: Not Interested",
    body: "\"Declined\" is now \"Not Interested\" everywhere.",
  },
  {
    title: "Cleaner status dropdown",
    body: "The status picker now groups options into Step 1 / Step 2 / Other columns for faster scanning.",
  },
];

export default function WhatsNewPopup({ userEmail, onClose }) {
  const [open, setOpen] = useState(true);

  // Belt-and-suspenders: if the user reloads with the popup still in the DOM
  // (e.g. error boundary kept it mounted), make sure the seen flag is set
  // when they finally close it. The parent also won't remount it next time.
  useEffect(() => () => markSeen(userEmail), [userEmail]);

  const handleClose = () => {
    markSeen(userEmail);
    setOpen(false);
    setTimeout(() => onClose && onClose(), 200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-5 relative"
              style={{
                background:
                  "linear-gradient(135deg, #f1889b 0%, #e26b85 100%)",
              }}
            >
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/85 hover:bg-white/15 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-white/90 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                What's New
              </div>
              <h2 className="text-white text-xl font-semibold leading-snug">
                Franchise pipeline updates
              </h2>
              <p className="text-white/85 text-sm mt-1">
                A few changes to how applications move through the board.
              </p>
            </div>

            {/* Highlights */}
            <div className="px-6 py-5 space-y-3.5">
              {HIGHLIGHTS.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {h.title}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {h.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={handleClose}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark as read
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}