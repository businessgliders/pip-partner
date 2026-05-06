import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Inbox, Megaphone } from "lucide-react";
import BackToHome from "../components/BackToHome";

const TILES = [
  {
    title: "Submissions",
    description: "Franchise, influencer, instructor & front desk applications",
    icon: Inbox,
    href: "/AdminDashboard/Submissions",
  },
  {
    title: "Marketing",
    description: "Coming soon",
    icon: Megaphone,
    href: "/AdminDashboard/Marketing",
  },
];

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-[#eef0e8]">
      <BackToHome />

      <div className="max-w-5xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-[11px] tracking-[0.25em] text-[#6b7d5b] font-semibold mb-2">ADMIN</p>
          <h1 className="text-3xl md:text-4xl font-light text-[#5b6e4b]">Dashboard</h1>
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
                  className="group block bg-[#f5f6ee] rounded-3xl p-10 md:p-12 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex justify-center mb-4">
                    <Icon className="w-9 h-9 text-[#5b6e4b]" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#5b6e4b] mb-1.5">{tile.title}</h3>
                  <p className="text-sm text-[#7a8a6a]">{tile.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}