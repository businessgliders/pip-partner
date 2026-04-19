import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import HlsVideoBackground from "./HlsVideoBackground";

export default function HeroSection({ onCTAClick }) {
  return (
    <section className="relative overflow-hidden pt-16 pb-16 md:pt-20 md:pb-20">
      <HlsVideoBackground src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8" />

      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-[#f1889b]/30 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 text-center" style={{ zIndex: 2 }}>
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

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-light text-[#b67651] mb-4 md:mb-6 tracking-tight leading-[1.05]">
            Own a studio where
            <br />
            <span className="italic font-light">strength</span> meets beauty
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-[#b67651]/80 max-w-2xl mx-auto font-light leading-relaxed mb-6 md:mb-10">
            Luxury Reformer Pilates. Pretty. Powerful. Profitable.
            <br />
            Join Canada's fastest-growing wellness brand.
          </p>

          <Button
            onClick={onCTAClick}
            className="h-14 px-10 rounded-xl text-white font-medium text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:scale-105"
            style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
          >
            Apply Now →
          </Button>
        </motion.div>
      </div>
    </section>
  );
}