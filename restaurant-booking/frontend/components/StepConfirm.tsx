"use client";
import { format, parseISO } from "date-fns";
import type { TableSlotOut, SlotOut } from "@/lib/types";

interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  special_requests: string;
}

interface Props {
  date: string;
  partySize: number;
  table: TableSlotOut;
  slot: SlotOut;
  guest: GuestDetails;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3" style={{ borderBottom: "1px solid var(--color-n-100)" }}>
      <span className="text-[13px]" style={{ color: "var(--color-n-500)" }}>{label}</span>
      <span className="text-[13px] font-medium text-right max-w-[60%]" style={{ color: "var(--color-n-900)" }}>{value}</span>
    </div>
  );
}

export function StepConfirm({ date, partySize, table, slot, guest, loading, error, onSubmit }: Props) {
  const dateLabel = format(parseISO(date), "EEEE, MMMM d, yyyy");
  const timeLabel = slot.start_time.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-n-200)" }}>
        <div className="px-5 py-3" style={{ background: "var(--color-n-50)", borderBottom: "1px solid var(--color-n-200)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-n-500)" }}>
            Booking summary
          </p>
        </div>
        <div className="px-5">
          <Row label="Date" value={dateLabel} />
          <Row label="Time" value={timeLabel} />
          <Row label="Table" value={`${table.label} (${table.location_type})`} />
          <Row label="Guests" value={`${partySize} ${partySize === 1 ? "person" : "people"}`} />
          <Row label="Name" value={guest.name} />
          <Row label="Phone" value={guest.phone} />
          {guest.email && <Row label="Email" value={guest.email} />}
          {guest.special_requests && <Row label="Requests" value={guest.special_requests} />}
        </div>
      </div>

      {error && (
        <p
          className="text-[13px] text-center px-4 py-3 rounded-lg"
          style={{ background: "rgba(220,38,38,0.06)", color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="btn-primary w-full"
        style={{ padding: "14px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Confirming..." : "Confirm reservation"}
      </button>

      <p className="text-[12px] text-center" style={{ color: "var(--color-n-400)" }}>
        By confirming, you agree to our cancellation policy.
      </p>
    </div>
  );
}
