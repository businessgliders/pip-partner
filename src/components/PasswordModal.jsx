import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, X } from "lucide-react";

const PASSWORD = "pip6161";
const STORAGE_KEY = "pip_home_unlocked";

export default function PasswordModal({ open, onClose, onSuccess }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch (_) {}
      setInput("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#b67651]/60 hover:bg-[#fbe0e2]/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#b67651]" />
            </div>

            <h2 className="text-xl font-light text-[#b67651] mb-1">Private Access</h2>
            <p className="text-[#b67651]/60 text-sm mb-6">Enter the password to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                className={`rounded-xl h-12 bg-white/50 text-center tracking-widest border-[#f7b1bd]/50 focus:border-[#f1889b] ${error ? "border-red-400" : ""}`}
              />
              {error && (
                <p className="text-red-400 text-sm">Incorrect password. Please try again.</p>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-white font-medium transition-all duration-300 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
              >
                Enter
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}