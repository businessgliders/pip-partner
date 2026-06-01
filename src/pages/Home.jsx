import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, Briefcase, Users, ClipboardList, Lock } from "lucide-react";
import AdminPadlock from "../components/AdminPadlock";

const TILES = [
  {
    title: "Own a Studio",
    subtitle: "FRANCHISE OPPORTUNITY",
    description: "Become a Pilates in Pink™ franchise partner and bring luxury reformer pilates to your city.",
    href: "/OwnAStudio",
    icon: Sparkles,
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/8525e2e00_generated_image.png",
  },
  {
    title: "Influencer Program",
    subtitle: "PARTNER WITH US",
    description: "Collaborate with Pilates in Pink™ as a brand ambassador and content creator.",
    href: "/Influencer",
    icon: Users,
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/e135d00cf_generated_image.png",
  },
  {
    title: "Become an Instructor",
    subtitle: "TEACH WITH US",
    description: "Join our team of certified instructors and inspire a movement-driven community.",
    href: "/Instructor",
    icon: Briefcase,
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/2ee0f78cf_generated_image.png",
  },
  {
    title: "Front Desk Careers",
    subtitle: "JOIN OUR TEAM",
    description: "Be the first smile our members see. Apply to work at the front of our studios.",
    href: "/FrontAdmin",
    icon: ClipboardList,
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/2fbc11db1_generated_image.png",
  },
];

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
      <AdminPadlock />

      {/* Header */}
      <section className="pt-20 pb-10 md:pt-28 md:pb-14 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-[#f1889b]/30 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-3xl mx-auto"
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
            alt="Pilates in Pink™"
            className="w-20 h-20 mx-auto mb-6"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png"
            alt="Pilates in Pink™"
            className="h-8 mx-auto mb-8"
          />

          <div className="inline-block px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm mb-6">
            <span className="text-xs font-medium tracking-[0.2em] text-[#b67651]">
              WELCOME
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-4 tracking-tight leading-[1.05] drop-shadow-sm">
            Find your <span className="italic">place</span> with us
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-xl mx-auto font-light leading-relaxed">
            Choose your path — whether you're investing, teaching, working, or partnering with the brand.
          </p>
        </motion.div>
      </section>

      {/* Tiles */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {TILES.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  to={tile.href}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={tile.image}
                        alt={tile.title}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${tile.locked ? "blur-md scale-110" : ""}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#b67651]/70 via-[#b67651]/10 to-transparent" />
                      {tile.locked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] tracking-[0.25em] font-semibold text-[#b67651] shadow-sm">
                            COMING SOON
                          </span>
                        </div>
                      )}
                      <div className="absolute top-5 left-5 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5 text-[#b67651]" />
                      </div>
                      <div className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:rotate-45">
                        {tile.locked ? (
                          <Lock className="w-5 h-5 text-[#b67651]" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-[#b67651]" />
                        )}
                      </div>
                    </div>

                    <div className="p-7 md:p-8">
                      <p className={`text-[10px] md:text-xs tracking-[0.2em] text-[#b67651]/70 font-semibold mb-2 ${tile.locked ? "blur-sm select-none" : ""}`}>
                        {tile.subtitle}
                      </p>
                      <h3 className={`text-2xl md:text-3xl font-light text-[#7a4a30] mb-3 leading-tight ${tile.locked ? "blur-sm select-none" : ""}`}>
                        {tile.title}
                      </h3>
                      <p className={`text-[#5a3a28]/80 text-sm md:text-base leading-relaxed mb-5 ${tile.locked ? "blur-sm select-none" : ""}`}>
                        {tile.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[#b67651] group-hover:gap-3 transition-all">
                        {tile.locked ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Enter Password
                          </>
                        ) : (
                          <>
                            Explore
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <p className="text-xs tracking-[0.2em] text-[#b67651]/60 font-medium">
            PRETTY • POWERFUL • PILATES
          </p>
        </div>
      </section>

    </div>
  );
}