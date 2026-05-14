import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Inbox, Megaphone, FileText, PenLine } from "lucide-react";
import BackToHome from "../components/BackToHome";

const TILES = [
  {
    title: "Submissions",
    description: "Franchise, influencer, instructor & front desk applications",
    icon: Inbox,
    href: "/Settings/Submissions",
  },
  {
    title: "Marketing",
    description: "Campaign ad creatives",
    icon: Megaphone,
    href: "/Settings/Marketing",
  },
  {
    title: "Email Templates",
    description: "Reusable HTML templates with variables",
    icon: FileText,
    href: "/Settings/Templates",
  },
  {
    title: "My Signature",
    description: "Your personal HTML signature appended to outgoing emails",
    icon: PenLine,
    href: "/Settings/Signature",
  },
];

export default function AdminHome() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
      <BackToHome />

      <div className="max-w-5xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
            alt="Pilates in Pink™"
            className="w-16 h-16 mx-auto mb-4"
          />
          <p className="text-[11px] tracking-[0.25em] text-white/90 font-semibold mb-2">ADMIN</p>
          <h1 className="text-3xl md:text-4xl font-light text-white drop-shadow-sm">Settings</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TILES.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  to={tile.href}
                  className="group block bg-white/80 backdrop-blur-sm rounded-3xl p-10 md:p-12 text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#b67651]" strokeWidth={1.75} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#b67651] mb-1.5">{tile.title}</h3>
                  <p className="text-sm text-[#b67651]/70">{tile.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}