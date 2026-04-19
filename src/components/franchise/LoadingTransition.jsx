import React from "react";
import { motion } from "framer-motion";

export default function LoadingTransition() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 md:p-16 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="w-14 h-14 mx-auto mb-6 border-4 rounded-full"
        style={{ borderColor: "rgba(247,177,189,0.3)", borderTopColor: "#f1889b" }}
      />
      <h3 className="text-2xl font-light text-[#b67651] mb-2">
        Reviewing your application...
      </h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[#b67651]/70 text-sm"
      >
        One moment while we prepare your next step
      </motion.p>
    </motion.div>
  );
}