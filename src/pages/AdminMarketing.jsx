import React from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import BackToHome from "../components/BackToHome";

export default function AdminMarketing() {
  return (
    <div className="min-h-screen bg-[#eef0e8]">
      <BackToHome />

      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-14 h-14 rounded-full bg-[#f5f6ee] flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Megaphone className="w-6 h-6 text-[#5b6e4b]" strokeWidth={1.75} />
          </div>
          <p className="text-[11px] tracking-[0.25em] text-[#6b7d5b] font-semibold mb-2">ADMIN</p>
          <h1 className="text-3xl md:text-4xl font-light text-[#5b6e4b] mb-3">Marketing</h1>
          <p className="text-[#7a8a6a]">Placeholder — criteria coming soon.</p>
        </motion.div>
      </div>
    </div>
  );
}