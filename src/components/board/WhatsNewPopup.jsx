import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, ChevronRight } from "lucide-react";

/**
 * "What's New" popup — paginated tour of the latest mobile changes. Cycles
 * through each slide via a "Next" button, then a final "Mark as read" button
 * dismisses the popup and stores a per-user flag so it never shows again for
 * that user (until RELEASE_KEY is bumped for the next release).
 */
const RELEASE_KEY = "v2026-07-06-mobile";
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

const SLIDES = [
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/6fd76ad56_generated_image.png",
    eyebrow: "Mobile",
    title: "New iOS-style tab bar",
    body: "Switch between Franchise, Instructor, Front Desk, and Alerts right from the bottom of the screen.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/d3e0999a0_generated_image.png",
    eyebrow: "Calendar",
    title: "Cleaner mobile calendar",
    body: "Meetings now appear as compact colored dots so nothing overflows, plus past meetings are back in the meetings tab.",
  },
  {
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/c904ebbe7_generated_image.png",
    eyebrow: "Inbox",
    title: "Sticky status filters",
    body: "The Upcoming pill stays pinned on the left while you scroll through the rest of your pipeline statuses.",
  },
];

export default function WhatsNewPopup({ userEmail, onClose }) {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  // Belt-and-suspenders: mark seen on unmount, so even a hard reload with the
  // popup mounted won't re-surface it next session.
  useEffect(() => () => markSeen(userEmail), [userEmail]);

  const handleClose = () => {
    markSeen(userEmail);
    setOpen(false);
    setTimeout(() => onClose && onClose(), 200);
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setIndex((i) => i + 1);
    }
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
              className="px-6 pt-5 pb-4 relative"
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
              <div className="flex items-center gap-2 text-white/90 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                What's New
              </div>
              <h2 className="text-white text-lg font-semibold leading-snug">
                Mobile updates
              </h2>
            </div>

            {/* Slide */}
            <div className="px-6 pt-5 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 overflow-hidden mb-4 flex items-center justify-center" style={{ height: 260 }}>
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-pink-600 mb-1">
                    {slide.eyebrow}
                  </div>
                  <h3 className="text-slate-900 text-base font-semibold mb-1.5">
                    {slide.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {slide.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 pb-3">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-pink-500" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={handleNext}
                className="w-full h-11 rounded-xl text-white text-sm font-medium transition flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(to bottom, #5a3a42, #2b1a1f)",
                }}
              >
                {isLast ? (
                  <>
                    <Check className="w-4 h-4" />
                    Mark as read
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}