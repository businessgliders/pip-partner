import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Lock } from "lucide-react";
import Seo from "@/components/Seo";

const INK = "#5b3a2e";
const BROWN = "#b67651";
const CREAM = "#f7f1e8";

const TILES = [
  {
    title: "Own a Studio",
    subtitle: "FRANCHISE OPPORTUNITY",
    description: "Become a Pilates in Pink™ franchise partner and bring luxury reformer pilates to your city.",
    href: "/OwnAStudio",
    image: null, // hero image carries this tile
  },
  {
    title: "Influencer Program",
    subtitle: "PARTNER WITH US",
    description: "Collaborate with Pilates in Pink™ as a brand ambassador and content creator.",
    href: "/Influencer",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/e135d00cf_generated_image.png",
  },
  {
    title: "Become an Instructor",
    subtitle: "TEACH WITH US",
    description: "Join our team of certified instructors and inspire a movement-driven community.",
    href: "/Instructor",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/2ee0f78cf_generated_image.png",
  },
  {
    title: "Front Desk Careers",
    subtitle: "JOIN OUR TEAM",
    description: "Be the first smile our members see. Apply to work at the front of our studios.",
    href: "/FrontAdmin",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/2fbc11db1_generated_image.png",
  },
];

const NAV = [
  { label: "About Us", href: "https://www.pilatesinpinkstudio.com", external: true },
  { label: "Careers", href: "#paths" },
  { label: "Franchise", href: "/OwnAStudio", route: true },
  { label: "Contact", href: "mailto:info@pilatesinpinkstudio.com" },
];

function NavLink({ item }) {
  const cls = "text-[11px] sm:text-xs font-medium tracking-[0.18em] uppercase hover:opacity-70 transition-opacity";
  if (item.route) return <Link to={item.href} className={cls} style={{ color: INK }}>{item.label}</Link>;
  return (
    <a
      href={item.href}
      className={cls}
      style={{ color: INK }}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {item.label}
    </a>
  );
}

function CardBody({ tile }) {
  return (
    <div className="p-6 md:p-7">
      <p className="text-[10px] md:text-[11px] tracking-[0.2em] font-semibold mb-2" style={{ color: BROWN }}>
        {tile.subtitle}
      </p>
      <h3 className="text-2xl md:text-[26px] font-normal mb-2.5 leading-tight" style={{ color: INK }}>
        {tile.title}
      </h3>
      <p className="text-sm md:text-[15px] leading-relaxed mb-4" style={{ color: "#7a5c4b" }}>
        {tile.description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all" style={{ color: BROWN }}>
        Explore <ArrowUpRight className="w-4 h-4" />
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative crm-root" style={{ background: CREAM }}>
      <Seo
        title="Find Your Place With Us | Pilates in Pink™"
        description="Pilates in Pink™ — luxury reformer pilates. Explore franchise ownership, instructor and front desk careers, and our influencer program."
        path="/"
      />

      {/* Kinetic grid hairlines */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block" aria-hidden="true">
        <div className="max-w-6xl mx-auto h-full relative">
          <div className="absolute top-0 bottom-0 left-1/4 w-px" style={{ background: "rgba(182,118,81,0.14)" }} />
          <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: "rgba(182,118,81,0.14)" }} />
          <div className="absolute top-0 bottom-0 left-3/4 w-px" style={{ background: "rgba(182,118,81,0.14)" }} />
        </div>
      </div>

      <div className="relative">
        {/* Top nav */}
        <header
          className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-6 py-6"
          style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 1.5rem)" }}
        >
          <nav className="flex items-center gap-5 md:gap-8 overflow-x-auto hide-scrollbar">
            {NAV.map((item) => <NavLink key={item.label} item={item} />)}
          </nav>
          <Link
            to="/ApplicationBoard"
            className="inline-flex items-center gap-1.5 shrink-0 ml-4 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.15em] uppercase text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "#f1889b" }}
          >
            Log In <Lock className="w-3 h-3" />
          </Link>
        </header>

        {/* Brand + heading */}
        <motion.section
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center px-6 pt-10 md:pt-16 pb-10 md:pb-14"
        >
          <img
            src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png"
            alt=""
            className="w-14 h-14 mx-auto mb-4 object-contain"
          />
          <p className="text-[17px] md:text-xl tracking-[0.35em] font-medium mb-10" style={{ color: BROWN }}>
            PILATES IN PINK™
          </p>

          <span
            className="inline-block px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.25em] text-white mb-5"
            style={{ background: "#f4a3b3" }}
          >
            WELCOME
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-[56px] font-light tracking-tight leading-[1.08] mb-4" style={{ color: INK }}>
            Find your <span className="italic">place</span> with us
          </h1>
          <p className="text-[15px] md:text-base max-w-md mx-auto leading-relaxed" style={{ color: "#7a5c4b" }}>
            Choose your path — whether you're investing, teaching, working, or partnering with the brand.
          </p>
        </motion.section>

        {/* Hero — Own a Studio */}
        <section className="max-w-6xl mx-auto px-5 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/OwnAStudio" className="group block">
              <div className="relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-500">
                <img
                  src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/8525e2e00_generated_image.png"
                  alt="Own a Studio"
                  className="w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[7/4] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </Link>
          </motion.div>
        </section>

        {/* Cards grid */}
        <section id="paths" className="max-w-6xl mx-auto px-5 md:px-6 pt-5 pb-16 grid grid-cols-1 md:grid-cols-2 gap-5">
          {TILES.map((tile, i) => (
            <motion.div
              key={tile.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
              className={tile.image ? "" : "md:self-start"}
            >
              <Link to={tile.href} className="group block h-full">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 h-full">
                  {tile.image && (
                    <div className="overflow-hidden">
                      <img
                        src={tile.image}
                        alt={tile.title}
                        className="w-full aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardBody tile={tile} />
                </div>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Footer */}
        <footer className="pb-8 text-center">
          <p className="text-[11px] tracking-[0.2em] font-semibold mb-4" style={{ color: INK }}>
            PRETTY • POWERFUL • PILATES
          </p>
          <div
            className="max-w-6xl mx-auto flex items-center justify-center gap-3 px-6 py-2 text-[10px]"
            style={{ color: "#96806f", borderTop: "1px solid rgba(182,118,81,0.12)", paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <Link to="/ApplicationBoard" className="underline hover:opacity-70">
              Staff Login
            </Link>
            <span>© Pilates in Pink™ Studio Inc.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}