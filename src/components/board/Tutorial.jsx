import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const TUTORIAL_STORAGE_KEY_BASE = "pip_partner_tutorial_seen_v1";

function keyFor(userEmail) {
  const suffix = (userEmail || "").toLowerCase().trim();
  return suffix ? `${TUTORIAL_STORAGE_KEY_BASE}:${suffix}` : TUTORIAL_STORAGE_KEY_BASE;
}

export function hasSeenTutorial(userEmail) {
  try {
    return localStorage.getItem(keyFor(userEmail)) === "true";
  } catch {
    return false;
  }
}

export function markTutorialSeen(userEmail) {
  try {
    localStorage.setItem(keyFor(userEmail), "true");
  } catch {
    /* noop */
  }
}

// Edit these freely. `image` is optional — when null, a soft numbered placeholder is shown.
const STEPS = [
  {
    title: "Welcome to PIP Partner",
    text: "Your hub for managing franchise, instructor, and front desk applications — all in one place.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/afcf5b713_generated_image.png",
  },
  {
    title: "Switch between sources",
    text: "Use the tabs at the top (or the bottom bar on mobile) to flip between Franchise, Instructor, and Front Desk applications.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/dfcdc0f97_generated_image.png",
  },
  {
    title: "Inbox view",
    text: "Read conversations, reply to applicants, and update statuses without ever leaving the page.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/c6fd796ff_generated_image.png",
  },
  {
    title: "Board, Calendar & Map",
    text: "Track applications as a Kanban board, see upcoming meetings on the calendar, or spot leads on the map.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/91d5cd6fe_generated_image.png",
  },
  {
    title: "Notifications & search",
    text: "The bell flags new replies. The search icon helps you find any applicant in seconds.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/20bb8a72d_generated_image.png",
  },
  {
    title: "You're all set",
    text: "Click Get Started to dive in. You can revisit any time from your account menu.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/5a1dde34f_generated_image.png",
  },
];

export default function Tutorial({ onClose, userEmail }) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === total - 1;

  const close = () => {
    markTutorialSeen(userEmail);
    onClose?.();
  };
  const next = () => (isLast ? close() : setStep((s) => s + 1));
  const back = () => !isFirst && setStep((s) => s - 1);

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={close}
        />

        <motion.div
          className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 w-full max-w-md overflow-hidden"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 z-10"
            aria-label="Close tutorial"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image / illustration area */}
          <div className="h-44 sm:h-48 bg-gradient-to-br from-pink-100 via-amber-50 to-rose-100 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${step}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {current.image ? (
                  <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-7xl font-light text-pink-300/70 select-none">
                    {step + 1}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text */}
          <div className="px-6 pt-5 pb-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={`txt-${step}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {current.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed min-h-[60px]">
                  {current.text}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="px-6 pb-2 flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-pink-500"
                    : i < step
                      ? "w-1.5 bg-pink-300"
                      : "w-1.5 bg-slate-200"
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="px-6 pb-5 pt-3 flex items-center justify-between gap-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Skip
              </button>
            )}

            <span className="text-[11px] text-slate-400 font-medium tabular-nums">
              Step {step + 1} of {total}
            </span>

            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 rounded-lg shadow-sm transition-colors"
            >
              {isLast ? (
                "Get Started"
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}