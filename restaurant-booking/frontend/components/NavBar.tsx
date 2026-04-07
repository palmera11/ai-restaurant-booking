"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export function NavBar() {
  return (
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
            style={{ background: "var(--color-n-900)" }}
          >
            R
          </div>
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--color-n-900)" }}>
            Reserve
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/book"
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: "var(--color-n-600)" }}
          >
            Book a table
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: "var(--color-n-600)" }}
          >
            Dashboard
          </Link>
          <Link
            href="/book"
            className="ml-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
            style={{ background: "var(--color-n-900)" }}
          >
            Get started
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
