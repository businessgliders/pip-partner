import React from "react";
import { motion } from "framer-motion";

const qualities = [
  "Passionate about wellness, movement & community building",
  "Entrepreneurial spirit with a love for premium customer experiences",
  "Committed to upholding the Pink standard of excellence & quality",
];

export default function IdealPartnerSection() {
  return (
    <section className="py-8 md:py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-10 md:p-14"
        >
          <h2 className="text-3xl md:text-4xl font-light italic text-[#b67651] mb-8 text-center">
            Our ideal franchise partner
          </h2>
          <ul className="space-y-4 max-w-2xl mx-auto">
            {qualities.map((quality, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-3 items-start"
              >
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#f1889b] mt-2" />
                <span className="text-[#b67651]/80 text-base md:text-lg leading-relaxed">
                  {quality}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}