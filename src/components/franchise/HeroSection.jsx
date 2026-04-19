import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function HeroSection({ onCTAClick }) {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-[#f1889b]/30 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
            alt="Pilates in Pink™"
            className="w-20 h-20 mx-auto mb-6"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png"
            alt="Pilates in Pink™"
            className="h-8 mx-auto mb-10"
          />

          <div className="inline-block px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm mb-8">
            <span className="text-xs font-medium tracking-[0.2em] text-[#b67651]">
              NOW FRANCHISING
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-light text-[#b67651] mb-6 tracking-tight leading-[1.05]">
            Own a studio where
            <br />
            <span className="italic font-light">strength</span> meets beauty
          </h1>
          <p className="text-lg md:text-xl text-[#b67651]/80 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Luxury Reformer Pilates. Pretty. Powerful. Profitable.
            <br />
            Join Canada's fastest-growing wellness brand.
          </p>

          <Button
            onClick={onCTAClick}
            className="h-14 px-10 rounded-xl text-white font-medium text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:scale-105"
            style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
          >
            Request Franchise Info →
          </Button>
        </motion.div>
      </div>
    </section>
  );
}