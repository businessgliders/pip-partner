import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Megaphone, ArrowUpRight, Lock } from "lucide-react";
import BackToHome from "../components/BackToHome";
import { CAMPAIGNS } from "../components/marketing/adFormats";

export default function AdminMarketing() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
      <BackToHome to="/Settings" label="Settings" />

      <div className="max-w-5xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Megaphone className="w-6 h-6 text-[#b67651]" strokeWidth={1.75} />
          </div>
          <p className="text-[11px] tracking-[0.25em] text-white/90 font-semibold mb-2">ADMIN</p>
          <h1 className="text-3xl md:text-4xl font-light text-white drop-shadow-sm">Marketing</h1>
          <p className="text-white/90 mt-2 text-sm">Ad creatives — choose a campaign</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CAMPAIGNS.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {c.available ? (
                <Link
                  to={`/Settings/Marketing/${c.slug}`}
                  className="group block bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#b67651]/70 via-[#b67651]/10 to-transparent" />
                    <div className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="w-5 h-5 text-[#b67651]" />
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="text-[10px] tracking-[0.2em] text-[#b67651]/70 font-semibold mb-2">{c.subtitle}</p>
                    <h3 className="text-2xl font-light text-[#7a4a30] mb-2">{c.title}</h3>
                    <p className="text-[#5a3a28]/80 text-sm leading-relaxed">{c.description}</p>
                  </div>
                </Link>
              ) : (
                <div className="block bg-white/60 rounded-3xl overflow-hidden shadow-sm relative">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div className="absolute inset-0 bg-[#fbe0e2]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-4 py-1.5 rounded-full bg-white/90 text-[10px] tracking-[0.25em] font-semibold text-[#b67651] shadow-sm">COMING SOON</span>
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="text-[10px] tracking-[0.2em] text-[#b67651]/70 font-semibold mb-2">{c.subtitle}</p>
                    <h3 className="text-2xl font-light text-[#7a4a30] mb-2 flex items-center gap-2">
                      {c.title} <Lock className="w-4 h-4" />
                    </h3>
                    <p className="text-[#5a3a28]/80 text-sm leading-relaxed">{c.description}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}