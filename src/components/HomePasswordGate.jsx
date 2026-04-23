import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const PASSWORD = "pip6161";
const STORAGE_KEY = "pip_home_unlocked";

export default function HomePasswordGate({ children }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      setUnlocked(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch (_) {}
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) return children;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-10 w-full max-w-sm text-center"
      >
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
          alt="Pilates in Pink™"
          className="w-16 h-16 mx-auto mb-4"
        />
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png"
          alt="Pilates in Pink™"
          className="h-6 mx-auto mb-6"
        />

        <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#b67651]" />
        </div>

        <h2 className="text-xl font-light text-[#b67651] mb-1">Private Preview</h2>
        <p className="text-[#b67651]/60 text-sm mb-6">Enter the password to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
    </div>
  );
}