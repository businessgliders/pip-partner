import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import ImageSlider from "./ImageSlider";

const SLIDER_IMAGES = [
  "https://images.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/e8c634f7-4057-4c9e-b872-819b086d6aed/DSC00686.JPG",
  "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/9934f1ffa_DSC00890.png",
  "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/4838486f0_DSC00905.png",
];

const features = [
  { title: "Turnkey Studio Design", description: "Signature pink interiors & reformer layout" },
  { title: "Instructor Training", description: "Certified programming & education framework" },
  { title: "Technology & App", description: "Booking platform, app & membership tools" },
  { title: "Marketing Playbook", description: "Launch strategy & local campaign templates" },
  { title: "Exclusive Territory", description: "Protected franchise zone in your market" },
  { title: "Ongoing Support", description: "Operations guidance from day one" },
];

export default function OpportunitySection() {
  return (
    <section className="py-10 md:py-14 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/85 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-sm"
        >
          <p className="text-xs tracking-[0.2em] text-[#b67651] font-semibold mb-4">
            FRANCHISE OPPORTUNITY
          </p>
          <h2 className="text-4xl md:text-5xl font-light text-[#7a4a30] mb-5 leading-tight">
            Be the <span className="italic">pink</span>
            <br /> in your city
          </h2>
          <p className="text-[#5a3a28] leading-relaxed mb-7 text-base md:text-lg">
            Pilates in Pink™ is expanding across Canada. We're looking for passionate, driven partners ready to bring a premium wellness experience to their community — backed by a brand already capturing hearts.
          </p>

          <ul className="space-y-3.5">
            {features.map((feature, i) => (
              <motion.li
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f1889b] flex items-center justify-center mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-semibold text-[#7a4a30] text-base">{feature.title}</h4>
                  <p className="text-sm text-[#5a3a28]/80">{feature.description}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <ImageSlider
            images={SLIDER_IMAGES}
            className="rounded-3xl aspect-[4/5] shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#b67651]/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-white text-2xl md:text-3xl font-light italic tracking-wide">
                Reformer Pilates
              </p>
            </div>
          </ImageSlider>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm">
            <p className="text-4xl text-[#b67651]/40 font-serif leading-none mb-2">"</p>
            <p className="text-[#b67651] text-lg leading-relaxed italic font-light mb-4">
              I walked in expecting just a cute, Instagram-worthy studio — but I left completely impressed and obsessed.
            </p>
            <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium">
              — TATIANA, MEMBER
            </p>
            <div className="text-[#f1889b] mt-2">★ ★ ★ ★ ★</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}