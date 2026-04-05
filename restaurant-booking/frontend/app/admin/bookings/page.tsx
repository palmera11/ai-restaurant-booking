"use client";
import { useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import BookingsTable from "@/components/admin/BookingsTable";

export default function BookingsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { bookings, loading, mutate } = useBookings(date);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm outline-none border bg-white/80"
          style={{ borderColor: "rgba(209,209,214,0.5)" }}
        />
      </div>
      <div className="glass-card overflow-hidden p-0" style={{ borderRadius: "20px" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--color-apple-gray1)" }}>Loading bookings…</div>
        ) : (
          <BookingsTable bookings={bookings} onCancelled={() => mutate()} />
        )}
      </div>
    </div>
  );
}
