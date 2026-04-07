"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSending(true);
    try {
      const r = await fetch("http://localhost:8000/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error(await r.text());
      setDone(true);
    } catch (e: any) {
      setErr("Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      setErr(null);
      setForm({ name: "", business: "", email: "", phone: "", message: "" });
    }, 250);
  }

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 glass"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "#f97316" }}
            >
              M
            </div>
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--color-n-900)" }}>
              Mesa
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/login"
              className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={{ color: "var(--color-n-600)" }}
            >
              Sign in
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="ml-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              style={{ background: "#f97316" }}
            >
              Get started
            </button>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.5)" }}
            onClick={close}
          >
            <motion.form
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submit}
              className="bg-white rounded-3xl p-7 w-full max-w-md relative"
              style={{ boxShadow: "0 40px 80px -20px rgba(15,23,42,0.4)" }}
            >
              <button
                type="button"
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5"
                aria-label="Close"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="#475569" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>

              {done ? (
                <div className="text-center py-6">
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "#f9731620" }}
                  >
                    <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>Thanks, we'll be in touch!</h3>
                  <p className="text-[14px]" style={{ color: "#64748b" }}>
                    Our team will reach out within one business day.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-6 px-5 py-2 rounded-full text-[13px] font-semibold text-white"
                    style={{ background: "#f97316" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-1" style={{ color: "#0f172a" }}>Let's get you started</h3>
                  <p className="text-[13px] mb-5" style={{ color: "#64748b" }}>
                    Tell us a bit about your restaurant and we'll be in touch.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: "#64748b" }}>Your name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-[13px]"
                        style={{ border: "1px solid #e2e8f0" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: "#64748b" }}>Business</label>
                      <input
                        required
                        value={form.business}
                        onChange={(e) => setForm({ ...form, business: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-[13px]"
                        style={{ border: "1px solid #e2e8f0" }}
                      />
                    </div>
                  </div>

                  <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: "#64748b" }}>Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] mb-3"
                    style={{ border: "1px solid #e2e8f0" }}
                  />

                  <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: "#64748b" }}>Phone</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 rounded-lg text-[13px] mb-3"
                    style={{ border: "1px solid #e2e8f0" }}
                  />

                  <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: "#64748b" }}>What are you looking for? (optional)</label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] mb-4 resize-none"
                    style={{ border: "1px solid #e2e8f0" }}
                  />

                  {err && <div className="text-[12px] text-red-600 mb-3">{err}</div>}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 rounded-full text-[14px] font-semibold text-white transition-transform hover:scale-[1.02]"
                    style={{ background: "#f97316", opacity: sending ? 0.6 : 1 }}
                  >
                    {sending ? "Sending..." : "Request a demo"}
                  </button>
                </>
              )}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
