import React from "react";
import { motion } from "framer-motion";

const pillars = [
  { title: "Luxury", subtitle: "BRAND IDENTITY" },
  { title: "Proven", subtitle: "STUDIO MODEL" },
  { title: "Full", subtitle: "FRANCHISE SUPPORT" },
  { title: "Your", subtitle: "EXCLUSIVE TERRITORY" },
];

export default function PillarsSection() {
  return (
    <section className="py-8 md:py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center border-r last:border-r-0 border-[#f7b1bd]/40 px-2"
              >
                <h3 className="text-3xl md:text-4xl font-light italic text-[#b67651] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium">
                  {pillar.subtitle}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}