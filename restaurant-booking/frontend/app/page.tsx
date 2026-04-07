"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import type { MouseEvent, ReactNode } from "react";

const BRAND = "#0d9488"; // teal-600
const BRAND_DARK = "#0f766e";
const BRAND_BG = "#042f2e"; // teal-950
const ACCENT = "#f59e0b"; // amber

const LOGOS = ["LAWRY'S", "HILTON", "AMAN", "NOBU", "HYATT", "HARD ROCK"];

const TABS = [
  {
    label: "Boost Bookings",
    title: "Branded booking journey",
    body: "Win your guests' hearts with an immersive branded booking experience on your homepage and social channels — all bookings consolidated in one dashboard.",
  },
  {
    label: "Enhance Operations",
    title: "Fill more seats",
    body: "Manage tables seamlessly and seat guests smarter with a real-time floor plan, drag-to-arrange tables, and live occupancy.",
  },
  {
    label: "Engage Guests",
    title: "Personal at scale",
    body: "Automated SMS, WhatsApp, and email touchpoints that feel handcrafted — reduce no-shows by up to 40%.",
  },
  {
    label: "Optimize Business",
    title: "Forecast revenue",
    body: "AI-powered analytics surface trends so you can staff smarter, price dynamically, and grow margin month over month.",
  },
];

const VALUE = [
  { icon: "♡", title: "Deliver exceptional guest experiences", body: "Memorable moments across every brand touchpoint." },
  { icon: "✦", title: "Automate your marketing", body: "Run successful campaigns to drive loyalty and repeat visits." },
  { icon: "▢", title: "Run on any device", body: "Use on PC, tablet, and mobile. No new hardware needed." },
  { icon: "▭", title: "Protect against cancellations", body: "Charge cancellation fees and reduce the impact of no-shows." },
  { icon: "↗", title: "Forecast your revenue", body: "Highlight revenue and guest trends with Mesa Insight." },
  { icon: "⚙", title: "Integrate everything", body: "POS, payments, phone IVR, CRM, brand app — all connected." },
];

const STATS = [
  { value: "10,000+", label: "restaurants worldwide" },
  { value: "1B+", label: "diners seated" },
  { value: "99.9%", label: "platform uptime" },
  { value: "40%", label: "fewer no-shows" },
];

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-60, 60], [10, -10]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [-60, 60], [-10, 10]), { stiffness: 200, damping: 18 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left - r.width / 2);
    y.set(e.clientY - r.top - r.height / 2);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PhoneMockup() {
  return (
    <TiltCard className="relative w-[260px] h-[520px]">
      <div
        className="absolute inset-0 rounded-[40px] p-3"
        style={{
          background: "linear-gradient(145deg, #1f2937, #0f172a)",
          boxShadow: "0 40px 80px -20px rgba(13,148,136,0.5), 0 20px 40px -10px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.06)",
          transform: "translateZ(40px)",
        }}
      >
        <div className="w-full h-full rounded-[30px] bg-white p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="text-[11px] font-semibold" style={{ color: BRAND }}>Mesa</div>
            <div className="w-2 h-2 rounded-full" style={{ background: BRAND }} />
          </div>
          <div className="text-[18px] font-bold mb-4" style={{ color: "#0f172a" }}>Reserve a table</div>
          {[
            { l: "Date", v: "Fri 24 May" },
            { l: "Time", v: "19:30" },
            { l: "Guests", v: "2 people" },
            { l: "Seating", v: "Indoor" },
          ].map((r) => (
            <div key={r.l} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <span className="text-[11px]" style={{ color: "#64748b" }}>{r.l}</span>
              <span className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>{r.v}</span>
            </div>
          ))}
          <div className="flex-1" />
          <button
            className="w-full py-3 rounded-xl text-[12px] font-semibold text-white"
            style={{ background: BRAND }}
          >
            Find availability
          </button>
          <div className="text-center text-[9px] mt-2" style={{ color: "#94a3b8" }}>Powered by Mesa</div>
        </div>
      </div>
    </TiltCard>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <NavBar />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: BRAND_BG }}>
        <motion.div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${BRAND}40, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${ACCENT}30, transparent 70%)` }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-24 grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-6 backdrop-blur"
              style={{ background: "rgba(255,255,255,0.1)", color: "#5eead4", border: "1px solid rgba(94,234,212,0.3)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#5eead4" }} />
              The reservation OS for modern restaurants
            </div>
            <h1
              className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold mb-6 text-white"
              style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Dining,<br />
              <span style={{ background: `linear-gradient(135deg, #5eead4, ${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                reimagined.
              </span>
            </h1>
            <p className="text-[17px] mb-8 max-w-md" style={{ color: "#a7f3d0", lineHeight: 1.6 }}>
              Mesa elevates the dining experience. Drive guest loyalty and grow revenue from one beautifully simple platform.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-semibold text-white transition-transform hover:scale-105"
                style={{ background: BRAND, boxShadow: `0 12px 30px -8px ${BRAND}` }}
              >
                Get a free demo
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-semibold transition-all hover:bg-white/10"
                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                See it in action
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center md:justify-end"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <PhoneMockup />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LOGO STRIP */}
      <section className="bg-white py-10" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-[11px] uppercase tracking-widest font-semibold mb-6" style={{ color: "#64748b" }}>
            Trusted by world-class hospitality
          </p>
          <div className="flex items-center justify-center gap-x-12 gap-y-4 flex-wrap">
            {LOGOS.map((l) => (
              <div key={l} className="text-[14px] font-bold tracking-wider" style={{ color: "#94a3b8" }}>{l}</div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIGHT BANNER */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto rounded-3xl p-10 md:p-14 grid md:grid-cols-2 gap-8 items-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND_BG})` }}
        >
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT}40, transparent 70%)` }}
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ lineHeight: 1.15 }}>
              Delight your guests with unforgettable experiences
            </h2>
            <p className="text-[15px] mb-6" style={{ color: "#a7f3d0" }}>
              Mesa empowers restaurants like yours with tools to create magical moments and build a thriving business.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold bg-white"
              style={{ color: BRAND_DARK }}
            >
              Request a free demo
            </Link>
          </div>
          <div className="relative flex justify-center">
            <PhoneMockup />
          </div>
        </motion.div>
      </section>

      {/* TABS / FEATURES */}
      <section className="py-20 px-6" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center mb-12 text-[13px] font-semibold">
            {TABS.map((t, i) => (
              <span
                key={t.label}
                style={{ color: i === 0 ? BRAND : "#64748b", borderBottom: i === 0 ? `2px solid ${BRAND}` : "none", paddingBottom: 4 }}
              >
                {t.label}
              </span>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <PhoneMockup />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-[13px] font-semibold mb-2" style={{ color: BRAND }}>Boost Bookings</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0f172a", lineHeight: 1.15 }}>
                Branded booking journey
              </h2>
              <p className="text-[15px]" style={{ color: "#475569", lineHeight: 1.7 }}>
                Win your guests' hearts with an immersive branded booking experience on your homepage and social channels.
                Consolidate bookings from every channel in one dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALUE GRID */}
      <section className="py-20 px-6" style={{ background: BRAND_BG }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Unparalleled value in hospitality</h2>
            <p className="text-[15px] max-w-xl" style={{ color: "#a7f3d0" }}>
              Mesa fits any business in the industry — from large hotels to neighborhood bistros — with the tools to drive long-term success.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
            {VALUE.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <TiltCard className="rounded-2xl p-6 h-full" >
                  <div
                    className="rounded-2xl p-6 h-full"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold mb-4"
                      style={{ background: `${BRAND}30`, color: "#5eead4" }}
                    >
                      {v.icon}
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-2">{v.title}</h3>
                    <p className="text-[13px]" style={{ color: "#a7f3d0", lineHeight: 1.6 }}>{v.body}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0f172a", lineHeight: 1.15 }}>
              We empower worldwide hospitality
            </h2>
            <p className="text-[15px] mb-8" style={{ color: "#475569", lineHeight: 1.7 }}>
              Mesa is trusted by the best players in the industry. We solve the hard operational problems so you can focus on creativity, guests, and revenue.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold" style={{ color: BRAND }}>{s.value}</div>
                  <div className="text-[12px] mt-1" style={{ color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex justify-center relative"
          >
            <div
              className="absolute inset-0 rounded-full m-auto w-[400px] h-[400px]"
              style={{ background: `radial-gradient(circle, ${BRAND}20, transparent 70%)` }}
            />
            <div className="relative">
              <PhoneMockup />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
            style={{ lineHeight: 1.1 }}
          >
            Ready to fill every seat?
          </motion.h2>
          <p className="text-[16px] mb-8" style={{ color: "#a7f3d0" }}>
            Get started in minutes. No credit card required.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold bg-white transition-transform hover:scale-105"
            style={{ color: BRAND_DARK, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
          >
            Start with Mesa
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white" style={{ borderTop: "1px solid #e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: BRAND }}
            >
              M
            </div>
            <span className="text-[14px] font-bold" style={{ color: "#0f172a" }}>Mesa</span>
          </div>
          <p className="text-[12px]" style={{ color: "#94a3b8" }}>
            &copy; {new Date().getFullYear()} Mesa. Dining, reimagined.
          </p>
        </div>
      </footer>
    </div>
  );
}
