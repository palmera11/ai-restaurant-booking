"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { StepDatePicker } from "./StepDatePicker";
import { StepTablePicker } from "./StepTablePicker";
import { StepGuestDetails } from "./StepGuestDetails";
import { StepConfirm } from "./StepConfirm";
import { useBooking } from "@/hooks/useBooking";
import type { TableSlotOut, SlotOut } from "@/lib/types";

const STEPS = ["Date & Guests", "Table & Time", "Your details", "Confirm"];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -30 : 30, opacity: 0 }),
};

interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  special_requests: string;
}

export function BookingFlow() {
  const router = useRouter();
  const { submitBooking, loading, error } = useBooking();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [table, setTable] = useState<TableSlotOut | null>(null);
  const [slot, setSlot] = useState<SlotOut | null>(null);
  const [guest, setGuest] = useState<GuestDetails>({ name: "", phone: "", email: "", special_requests: "" });

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function canAdvance() {
    if (step === 0) return !!date;
    if (step === 1) return !!table && !!slot;
    if (step === 2) return !!guest.name && !!guest.phone;
    return true;
  }

  async function handleConfirm() {
    if (!table || !slot) return;
    const result = await submitBooking({
      table_id: table.table_id,
      slot_date: date,
      slot_start_time: slot.start_time,
      party_size: partySize,
      booked_via: "web",
      guest_name: guest.name,
      guest_phone: guest.phone,
      guest_email: guest.email || undefined,
      special_requests: guest.special_requests || undefined,
    });
    if (result) {
      const suffix = result.notification_sent === false ? "?notif_warn=1" : "";
      router.push(`/confirmation/${result.confirmation_code}${suffix}`);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-n-100)" }}>
      <div className="max-w-xl mx-auto px-4 pt-10 pb-16">
        {/* Restaurant header card */}
        <div
          className="bg-white rounded-t-2xl p-6 flex items-center gap-4"
          style={{ border: "1px solid var(--color-n-200)", borderBottom: "none" }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: "var(--color-n-900)" }}
          >
            M
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--color-n-500)" }}>
              Reservation at
            </div>
            <h1 className="text-lg font-semibold truncate" style={{ color: "var(--color-n-900)" }}>
              Mesa Restaurant
            </h1>
            <div className="text-[12px]" style={{ color: "var(--color-n-500)" }}>
              Fine dining · Open today
            </div>
          </div>
        </div>

        {/* Step tabs */}
        <div
          className="bg-white flex"
          style={{ borderLeft: "1px solid var(--color-n-200)", borderRight: "1px solid var(--color-n-200)" }}
        >
          {STEPS.map((label, i) => (
            <div
              key={label}
              className="flex-1 text-center py-3 text-[11px] font-medium uppercase tracking-wider transition-colors"
              style={{
                color: i === step ? "var(--color-n-900)" : "var(--color-n-400)",
                borderBottom: i === step ? "2px solid var(--color-n-900)" : "2px solid var(--color-n-200)",
              }}
            >
              <span className="hidden sm:inline">{i + 1}. {label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
          ))}
        </div>

      {/* Step content */}
      <div
        className="bg-white rounded-b-2xl p-6 mb-5 overflow-hidden"
        style={{ border: "1px solid var(--color-n-200)", borderTop: "none" }}
      >
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-n-900)" }}>{STEPS[step]}</h2>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <StepDatePicker partySize={partySize} onPartySizeChange={setPartySize} onSelect={setDate} />
            )}
            {step === 1 && (
              <StepTablePicker
                date={date}
                partySize={partySize}
                selectedTable={table}
                selectedSlot={slot}
                onTableSelect={setTable}
                onSlotSelect={setSlot}
              />
            )}
            {step === 2 && (
              <StepGuestDetails details={guest} onChange={setGuest} />
            )}
            {step === 3 && table && slot && (
              <StepConfirm
                date={date}
                partySize={partySize}
                table={table}
                slot={slot}
                guest={guest}
                loading={loading}
                error={error}
                onSubmit={handleConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < 3 && (
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => go(step - 1)} className="btn-secondary flex-1">
              Back
            </button>
          )}
          <button
            onClick={() => go(step + 1)}
            disabled={!canAdvance()}
            className="btn-primary flex-1"
            style={{ opacity: canAdvance() ? 1 : 0.4 }}
          >
            Continue
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
