import React from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import BackToHome from "../components/BackToHome";

export default function AdminMarketing() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
      <BackToHome />

      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Megaphone className="w-6 h-6 text-[#b67651]" strokeWidth={1.75} />
          </div>
          <p className="text-[11px] tracking-[0.25em] text-white/90 font-semibold mb-2">ADMIN</p>
          <h1 className="text-3xl md:text-4xl font-light text-white drop-shadow-sm mb-3">Marketing</h1>
          <p className="text-[#b67651]">Placeholder — criteria coming soon.</p>
        </motion.div>
      </div>
    </div>
  );
}