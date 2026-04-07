"use client";
import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { motion } from "framer-motion";

interface Props {
  partySize: number;
  onPartySizeChange: (n: number) => void;
  onSelect: (date: string) => void;
}

export function StepDatePicker({ partySize, onPartySizeChange, onSelect }: Props) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  const [selected, setSelected] = useState<Date | null>(null);

  function pick(d: Date) {
    setSelected(d);
    onSelect(format(d, "yyyy-MM-dd"));
  }

  return (
    <div className="space-y-6">
      {/* Party size */}
      <div>
        <label className="block text-[13px] font-medium mb-2.5" style={{ color: "var(--color-n-700)" }}>
          Party size
        </label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => onPartySizeChange(n)}
              className="w-10 h-10 rounded-lg text-[13px] font-medium transition-all"
              style={{
                background: partySize === n ? "var(--color-n-900)" : "var(--color-n-100)",
                color: partySize === n ? "#fff" : "var(--color-n-600)",
                border: `1px solid ${partySize === n ? "var(--color-n-900)" : "var(--color-n-200)"}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Date grid */}
      <div>
        <label className="block text-[13px] font-medium mb-2.5" style={{ color: "var(--color-n-700)" }}>
          Select a date
        </label>
        <div className="grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
            <div key={i} className="text-center text-[11px] font-medium py-1.5" style={{ color: "var(--color-n-400)" }}>
              {d}
            </div>
          ))}
          {Array.from({ length: today.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((d) => {
            const isSelected = selected?.toDateString() === d.toDateString();
            const isToday = d.toDateString() === today.toDateString();
            return (
              <motion.button
                key={d.toISOString()}
                whileTap={{ scale: 0.92 }}
                onClick={() => pick(d)}
                className="aspect-square rounded-lg text-[13px] font-medium transition-all flex items-center justify-center"
                style={{
                  background: isSelected ? "var(--color-n-900)" : "transparent",
                  color: isSelected ? "#fff" : isToday ? "var(--color-brand)" : "var(--color-n-700)",
                  border: isToday && !isSelected ? "1px solid var(--color-brand)" : "1px solid transparent",
                }}
              >
                {format(d, "d")}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
