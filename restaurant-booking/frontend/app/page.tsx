"use client";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import type { MouseEvent, ReactNode } from "react";

const BRAND = "#f97316"; // orange-500
const BRAND_DARK = "#ea580c"; // orange-600
const BRAND_BG = "#1c1917"; // stone-900
const ACCENT = "#fbbf24"; // amber-400

const LOGOS = ["LAWRY'S", "HILTON", "AMAN", "NOBU", "HYATT", "HARD ROCK", "RITZ", "FOUR SEASONS", "MARRIOTT"];

const IMG = {
  hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop",
  diners: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1000&q=80&auto=format&fit=crop",
  chef: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1000&q=80&auto=format&fit=crop",
  bar: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1000&q=80&auto=format&fit=crop",
  table: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=1000&q=80&auto=format&fit=crop",
  cheers: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1000&q=80&auto=format&fit=crop",
  interior: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1000&q=80&auto=format&fit=crop",
};

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

const TESTIMONIALS = [
  {
    quote: "Mesa cut our no-shows by half in the first month. The team actually enjoys using it.",
    name: "Sofia Marín",
    role: "GM, La Brasería",
    initials: "SM",
  },
  {
    quote: "We used to juggle three apps. Now everything from bookings to payments lives in one place.",
    name: "Hiroshi Tanaka",
    role: "Owner, Kaisen Sushi",
    initials: "HT",
  },
  {
    quote: "The floor plan view is a game-changer for the host stand on a Friday night.",
    name: "Amelia Brown",
    role: "Director, Ember & Oak",
    initials: "AB",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    desc: "Perfect for single-location restaurants.",
    features: ["Online bookings", "SMS reminders", "Basic floor plan", "Up to 2 staff seats"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$129",
    period: "/mo",
    desc: "For ambitious restaurants ready to scale.",
    features: ["Everything in Starter", "WhatsApp + Voice AI", "Drag-to-edit floor plan", "Guest CRM", "Unlimited staff"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Multi-location groups and hotel chains.",
    features: ["Everything in Growth", "Multi-venue dashboard", "POS & PMS integrations", "Dedicated CSM", "SLA + SSO"],
    cta: "Talk to sales",
    highlight: false,
  },
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

type ChatMsg = { role: "user" | "assistant"; content: string };

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setText("");
    setSending(true);
    try {
      const r = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await r.json();
      const reply = data?.reply ?? "Sorry, I'm having trouble right now.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I'm having trouble right now." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white"
        style={{
          background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
          boxShadow: `0 12px 30px -8px ${BRAND}, 0 0 0 4px rgba(13,148,136,0.15)`,
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
        ) : (
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-3rem)] rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)",
              boxShadow: "0 30px 70px -20px rgba(15,23,42,0.4), 0 0 0 1px rgba(15,23,42,0.05)",
            }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}
                >
                  M
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5"
                  aria-label="Close"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="#475569" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>

              <h3 className="text-[18px] font-bold mb-3" style={{ color: "#0f172a" }}>Mesa</h3>
              <p className="text-[14px] mb-2" style={{ color: "#0f172a" }}>Hi, I'm Mia 👋</p>
              {messages.length === 0 && (
                <>
                  <p className="text-[14px] mb-3" style={{ color: "#334155", lineHeight: 1.55 }}>
                    Mesa helps restaurants increase reservations and turn first-time diners into regulars.
                  </p>
                  <p className="text-[14px] mb-5" style={{ color: "#0f172a", fontWeight: 500 }}>
                    What brought you here today?
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[13px] font-semibold mb-4"
                    style={{ border: "1.5px solid #0f172a", color: "#0f172a", background: "transparent" }}
                  >
                    Schedule a demo
                  </Link>
                </>
              )}

              {messages.length > 0 && (
                <div className="max-h-[260px] overflow-y-auto mb-4 space-y-2 pr-1">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className="text-[13px] px-3 py-2 rounded-2xl max-w-[85%]"
                      style={
                        m.role === "user"
                          ? { background: BRAND, color: "#fff", marginLeft: "auto", borderBottomRightRadius: 4 }
                          : { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", borderBottomLeftRadius: 4 }
                      }
                    >
                      {m.content}
                    </div>
                  ))}
                  {sending && (
                    <div className="text-[12px] italic" style={{ color: "#94a3b8" }}>Mia is typing…</div>
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white"
                style={{ border: "1px solid #cbd5e1" }}
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ask anything…"
                  className="flex-1 bg-transparent text-[13px] outline-none"
                  style={{ color: "#0f172a" }}
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-opacity"
                  style={{ background: BRAND, opacity: sending || !text.trim() ? 0.4 : 1 }}
                  aria-label="Send"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </form>

              <p className="text-[10px] mt-3 text-center" style={{ color: "#94a3b8" }}>
                Mesa Assistant. By chatting you agree this conversation may be recorded.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

function SmarterDecisions() {
  const meals = [
    { label: "Brk", val: 22, color: "#fb7185" },
    { label: "Brunch", val: 32, color: "#22c55e" },
    { label: "Lunch", val: 38, color: "#a855f7" },
    { label: "Tea", val: 47, color: "#3b82f6" },
    { label: "Dinner", val: 28, color: "#facc15" },
  ];
  const peak = 50;
  const points = [
    [40, 30, 30], [55, 25, 20], [35, 40, 25], [50, 30, 20],
    [60, 25, 15], [45, 35, 20], [30, 45, 25], [50, 30, 20],
    [40, 35, 25], [55, 30, 15], [35, 40, 25], [45, 35, 20],
  ];
  const W = 520, H = 180;
  const stepX = W / (points.length - 1);
  function area(i0: number) {
    const top = points.map((p, i) => {
      const sum = p.slice(0, i0 + 1).reduce((a, b) => a + b, 0);
      return `${i * stepX},${H - (sum / 100) * H}`;
    });
    const baseLine = i0 === 0
      ? points.map((_, i) => `${i * stepX},${H}`).reverse()
      : points.map((p, i) => {
          const sum = p.slice(0, i0).reduce((a, b) => a + b, 0);
          return `${i * stepX},${H - (sum / 100) * H}`;
        }).reverse();
    return `M${top.join(" L")} L${baseLine.join(" L")} Z`;
  }

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="relative h-[520px] flex items-center justify-center">
          <div className="absolute rounded-full" style={{ width: 440, height: 440, border: `3px solid ${BRAND_DARK}`, top: 40, left: 30 }} />
          <div className="absolute rounded-full" style={{ width: 440, height: 440, border: `3px solid ${BRAND}`, borderRightColor: "transparent", borderBottomColor: "transparent", top: 0, left: 60, transform: "rotate(35deg)" }} />

          <motion.div
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute bg-white rounded-2xl p-5"
            style={{ top: 50, left: 40, width: 360, boxShadow: "0 24px 48px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Avg Revenue (USD) per POS Pax by Meal</h4>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#f1f5f9", color: "#64748b" }}>?</div>
            </div>
            <div className="flex items-end gap-3 h-36 pl-8 relative">
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px]" style={{ color: "#94a3b8" }}>
                <span>$45</span><span>$30</span><span>$15</span><span>$0</span>
              </div>
              {meals.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(m.val / peak) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-1 rounded-t-md"
                  style={{ background: m.color, minHeight: 6 }}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="absolute bg-white rounded-2xl p-5"
            style={{ bottom: 30, right: 30, width: 360, boxShadow: "0 24px 48px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.05)" }}
          >
            <h4 className="text-[13px] font-semibold mb-2" style={{ color: "#0f172a" }}>Percentage of Total Revenue by Meal</h4>
            <div className="flex items-center gap-3 mb-3 text-[10px]" style={{ color: "#475569" }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#fb7185" }} /> Breakfast</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} /> Dinner</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#a855f7" }} /> Lunch</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32">
              <motion.path d={area(0)} fill="#fb7185" initial={{ opacity: 0 }} whileInView={{ opacity: 0.85 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} />
              <motion.path d={area(1)} fill="#a855f7" initial={{ opacity: 0 }} whileInView={{ opacity: 0.8 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.55 }} />
              <motion.path d={area(2)} fill="#3b82f6" initial={{ opacity: 0 }} whileInView={{ opacity: 0.8 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.7 }} />
            </svg>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-4"
        >
          <div className="text-[13px] font-semibold mb-3" style={{ color: BRAND }}>Optimize Business</div>
          <h2 className="text-5xl font-bold tracking-tight mb-5 leading-[1.05]" style={{ color: "#0f172a" }}>
            Make smarter<br />decisions
          </h2>
          <p className="text-[16px] leading-relaxed" style={{ color: "#475569" }}>
            Discover trends in your business and get a holistic view of your operations to eliminate bottlenecks. Reduce inefficiencies while optimizing performance across your entire restaurant group.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <NavBar />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: BRAND_BG }}>
        <img
          src={IMG.hero}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${BRAND_BG}ee 0%, ${BRAND_BG}cc 50%, ${BRAND_DARK}aa 100%)` }}
        />
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
              style={{ background: "rgba(255,255,255,0.1)", color: "#fed7aa", border: "1px solid rgba(254,215,170,0.3)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#fed7aa" }} />
              The reservation OS for modern restaurants
            </div>
            <h1
              className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold mb-6 text-white"
              style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Dining,<br />
              <span style={{ background: `linear-gradient(135deg, #fed7aa, ${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                reimagined.
              </span>
            </h1>
            <p className="text-[17px] mb-8 max-w-md" style={{ color: "#fed7aa", lineHeight: 1.6 }}>
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
                href="/admin/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-semibold transition-all hover:bg-white/10"
                style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                Sign in
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

      {/* LOGO STRIP — marquee */}
      <section className="bg-white py-12" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <p className="text-center text-[11px] uppercase tracking-widest font-semibold mb-8" style={{ color: "#64748b" }}>
          Trusted by world-class hospitality
        </p>
        <div className="relative overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)" }}>
          <motion.div
            className="flex gap-16 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <div key={i} className="text-[18px] font-bold tracking-wider flex-shrink-0" style={{ color: "#94a3b8" }}>
                {l}
              </div>
            ))}
          </motion.div>
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
            <p className="text-[15px] mb-6" style={{ color: "#fed7aa" }}>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <img
              src={IMG.cheers}
              alt="Happy diners cheering at a restaurant"
              className="rounded-2xl w-full h-[340px] object-cover"
              style={{ boxShadow: `0 30px 60px -20px rgba(0,0,0,0.5)` }}
            />
          </motion.div>
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
              className="relative"
            >
              <img
                src={IMG.chef}
                alt="Chef plating a dish"
                className="rounded-2xl w-full h-[420px] object-cover"
                style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.3)" }}
              />
              <motion.img
                src={IMG.table}
                alt="Elegant table setting"
                className="absolute -bottom-8 -right-8 w-40 h-40 rounded-2xl object-cover hidden md:block"
                style={{ border: "6px solid #fff", boxShadow: "0 20px 40px -10px rgba(15,23,42,0.3)" }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
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
            <p className="text-[15px] max-w-xl" style={{ color: "#fed7aa" }}>
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
                      style={{ background: `${BRAND}30`, color: "#fed7aa" }}
                    >
                      {v.icon}
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-2">{v.title}</h3>
                    <p className="text-[13px]" style={{ color: "#fed7aa", lineHeight: 1.6 }}>{v.body}</p>
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
            className="relative grid grid-cols-2 gap-3"
          >
            <motion.img
              src={IMG.diners}
              alt="Friends dining"
              className="rounded-2xl w-full h-[200px] object-cover"
              style={{ boxShadow: "0 20px 40px -16px rgba(15,23,42,0.3)" }}
              whileHover={{ scale: 1.03 }}
            />
            <motion.img
              src={IMG.bar}
              alt="Bartender pouring a drink"
              className="rounded-2xl w-full h-[200px] object-cover mt-8"
              style={{ boxShadow: "0 20px 40px -16px rgba(15,23,42,0.3)" }}
              whileHover={{ scale: 1.03 }}
            />
            <motion.img
              src={IMG.interior}
              alt="Restaurant interior"
              className="rounded-2xl w-full h-[200px] object-cover -mt-4"
              style={{ boxShadow: "0 20px 40px -16px rgba(15,23,42,0.3)" }}
              whileHover={{ scale: 1.03 }}
            />
            <motion.img
              src={IMG.table}
              alt="Elegant table setting"
              className="rounded-2xl w-full h-[200px] object-cover mt-4"
              style={{ boxShadow: "0 20px 40px -16px rgba(15,23,42,0.3)" }}
              whileHover={{ scale: 1.03 }}
            />
          </motion.div>
        </div>
      </section>

      {/* IMAGE GALLERY — parallax scroll */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
              Built for moments that matter.
            </h2>
            <p className="text-[16px] max-w-xl mx-auto" style={{ color: "#64748b" }}>
              From the first reservation to the final goodbye — Mesa powers every step of the guest journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <motion.img
              src={IMG.diners}
              alt="Friends celebrating at dinner"
              className="col-span-7 row-span-2 rounded-3xl w-full h-[420px] object-cover"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.25)" }}
            />
            <motion.img
              src={IMG.chef}
              alt="Chef at work"
              className="col-span-5 rounded-3xl w-full h-[200px] object-cover"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.25)" }}
            />
            <motion.img
              src={IMG.bar}
              alt="Bar service"
              className="col-span-5 rounded-3xl w-full h-[200px] object-cover"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.25)" }}
            />
            <motion.img
              src={IMG.interior}
              alt="Restaurant interior"
              className="col-span-4 rounded-3xl w-full h-[260px] object-cover"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.25)" }}
            />
            <motion.img
              src={IMG.cheers}
              alt="Cheers"
              className="col-span-4 rounded-3xl w-full h-[260px] object-cover"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.25)" }}
            />
            <motion.img
              src={IMG.table}
              alt="Table setting"
              className="col-span-4 rounded-3xl w-full h-[260px] object-cover"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ boxShadow: "0 30px 60px -20px rgba(15,23,42,0.25)" }}
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0f172a" }}>
              Loved by hospitality leaders
            </h2>
            <p className="text-[15px]" style={{ color: "#64748b" }}>
              Real words from restaurants using Mesa every night.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <TiltCard className="h-full">
                  <div
                    className="rounded-2xl p-7 h-full bg-white"
                    style={{
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 20px 40px -20px rgba(15,23,42,0.15)",
                    }}
                  >
                    <div className="text-3xl mb-3" style={{ color: BRAND }}>“</div>
                    <p className="text-[14px] mb-6" style={{ color: "#334155", lineHeight: 1.65 }}>
                      {t.quote}
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                        style={{ background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})` }}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>{t.name}</div>
                        <div className="text-[11px]" style={{ color: "#94a3b8" }}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SMARTER DECISIONS */}
      <SmarterDecisions />

      {/* PRICING */}
      <section className="py-20 px-6" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="text-[12px] uppercase tracking-widest font-semibold mb-2" style={{ color: BRAND }}>
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0f172a" }}>
              Simple plans that scale with you
            </h2>
            <p className="text-[15px]" style={{ color: "#64748b" }}>
              No setup fees. Cancel anytime. 14-day free trial on every plan.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
            {PLANS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <TiltCard className="h-full">
                  <div
                    className="rounded-2xl p-7 h-full flex flex-col relative"
                    style={{
                      background: p.highlight ? `linear-gradient(160deg, ${BRAND_DARK}, ${BRAND_BG})` : "#fff",
                      border: p.highlight ? "1px solid rgba(254,215,170,0.3)" : "1px solid #e2e8f0",
                      boxShadow: p.highlight
                        ? `0 30px 60px -20px ${BRAND}80`
                        : "0 1px 2px rgba(15,23,42,0.04), 0 20px 40px -20px rgba(15,23,42,0.15)",
                    }}
                  >
                    {p.highlight && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: ACCENT }}
                      >
                        Most popular
                      </div>
                    )}
                    <div
                      className="text-[12px] uppercase tracking-wider font-semibold mb-2"
                      style={{ color: p.highlight ? "#fed7aa" : BRAND }}
                    >
                      {p.name}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span
                        className="text-4xl font-bold"
                        style={{ color: p.highlight ? "#fff" : "#0f172a" }}
                      >
                        {p.price}
                      </span>
                      <span className="text-[13px]" style={{ color: p.highlight ? "#fed7aa" : "#64748b" }}>
                        {p.period}
                      </span>
                    </div>
                    <p
                      className="text-[13px] mb-6"
                      style={{ color: p.highlight ? "#fed7aa" : "#64748b" }}
                    >
                      {p.desc}
                    </p>
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-[13px]"
                          style={{ color: p.highlight ? "#e2e8f0" : "#334155" }}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke={p.highlight ? "#fed7aa" : BRAND}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/book"
                      className="w-full inline-flex items-center justify-center py-3 rounded-full text-[13px] font-semibold transition-transform hover:scale-105"
                      style={{
                        background: p.highlight ? "#fff" : BRAND,
                        color: p.highlight ? BRAND_DARK : "#fff",
                      }}
                    >
                      {p.cta}
                    </Link>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
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
          <p className="text-[16px] mb-8" style={{ color: "#fed7aa" }}>
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

      <ChatBot />
    </div>
  );
}
