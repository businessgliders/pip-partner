import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Inbox as InboxIcon,
  Bell,
  Users,
  Rocket,
} from "lucide-react";

const STORAGE_KEY = "pip-board-tutorial-seen-v1";

/** Returns true once the user has finished or skipped the walkthrough. */
export function hasSeenTutorial() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

// Each step: title, description, optional image URL. When `image` is empty,
// the visual placeholder uses the `icon` + `accent` gradient instead.
const STEPS = [
  {
    title: "Welcome to the Partner Board",
    description:
      "Every franchise inquiry, instructor application, and front desk submission lives here — one place to triage, reply, and track.",
    image: "",
    icon: Sparkles,
    accent: "from-pink-100 via-rose-50 to-amber-50",
  },
  {
    title: "Switch between programs",
    description:
      "Use the source tabs to jump between Franchise, Instructor, and Front Desk pipelines. On mobile, the same tabs sit in the bottom bar.",
    image: "",
    icon: Users,
    accent: "from-amber-100 via-orange-50 to-pink-50",
  },
  {
    title: "Inbox — your conversation hub",
    description:
      "Read every applicant thread inline, reply with templates or AI assist, and update statuses from the same panel — no context switching.",
    image: "",
    icon: InboxIcon,
    accent: "from-sky-100 via-blue-50 to-indigo-50",
  },
  {
    title: "Board — drag tickets through stages",
    description:
      "Switch to the Board view to drag applicants across columns. Manual order is remembered per column so urgent leads stay on top.",
    image: "",
    icon: LayoutGrid,
    accent: "from-emerald-100 via-teal-50 to-cyan-50",
  },
  {
    title: "Stay on top of new replies",
    description:
      "The bell shows unread messages across every pipeline. Click any notification to jump straight to that conversation.",
    image: "",
    icon: Bell,
    accent: "from-purple-100 via-fuchsia-50 to-pink-50",
  },
  {
    title: "You're all set",
    description:
      "That's the tour. Reach out any time you want to adjust how the board works for your team — and good luck onboarding your next partner.",
    image: "",
    icon: Rocket,
    accent: "from-rose-100 via-pink-100 to-amber-100",
  },
];

export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const handleClose = () => {
    markSeen();
    onClose?.();
  };

  const handleNext = () => {
    if (isLast) handleClose();
    else setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Frosted backdrop */}
        <motion.button
          type="button"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Close tutorial"
          className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-default"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/40"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/70 hover:bg-white text-slate-600 flex items-center justify-center backdrop-blur"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Visual area */}
          <div className={`relative aspect-[5/3] bg-gradient-to-br ${current.accent} overflow-hidden`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${step}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {current.image ? (
                  <img
                    src={current.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-20 w-20 rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center shadow-lg">
                      <Icon className="w-10 h-10 text-slate-700" strokeWidth={1.5} />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Step {step + 1} of {STEPS.length}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`txt-${step}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {current.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed min-h-[60px]">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center items-center gap-1.5 mt-5 mb-5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-pink-500"
                      : "w-1.5 bg-slate-200 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-colors ${
                    isLast
                      ? "bg-pink-500 hover:bg-pink-600 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isLast ? "Get Started" : "Next"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}