"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAvailability } from "@/hooks/useAvailability";
import type { TableSlotOut, SlotOut } from "@/lib/types";

interface Props {
  date: string;
  partySize: number;
  selectedTable: TableSlotOut | null;
  selectedSlot: SlotOut | null;
  onTableSelect: (t: TableSlotOut) => void;
  onSlotSelect: (s: SlotOut) => void;
}

const LOCATION_ICONS: Record<string, string> = {
  indoor: "Inside", outdoor: "Patio", bar: "Bar", private: "Private",
};

export function StepTablePicker({
  date, partySize, selectedTable, selectedSlot, onTableSelect, onSlotSelect,
}: Props) {
  const { tables, slots, loading, error, fetchTables, fetchSlots } = useAvailability();

  useEffect(() => {
    if (date) fetchTables(date, "19:00:00", partySize);
  }, [date, partySize]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedTable) fetchSlots(selectedTable.table_id, date, partySize);
  }, [selectedTable]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-n-300)", borderTopColor: "var(--color-n-800)" }}
        />
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-8 text-[13px]" style={{ color: "var(--color-danger)" }}>{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[13px] font-medium mb-3" style={{ color: "var(--color-n-700)" }}>
          Choose a table
        </label>
        {tables.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: "var(--color-n-500)" }}>
            No tables available for this date. Try another day.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tables.map((t) => {
              const isSelected = selectedTable?.table_id === t.table_id;
              return (
                <motion.button
                  key={t.table_id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTableSelect(t)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? "var(--color-n-900)" : "#fff",
                    border: `1px solid ${isSelected ? "var(--color-n-900)" : "var(--color-n-200)"}`,
                    color: isSelected ? "#fff" : "var(--color-n-900)",
                  }}
                >
                  <div className="text-[13px] font-semibold">{t.label}</div>
                  <div className="text-[12px] mt-1" style={{ opacity: 0.65 }}>
                    {t.capacity} guests max &middot; {LOCATION_ICONS[t.location_type] ?? t.location_type}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {selectedTable && (
        <div>
          <label className="block text-[13px] font-medium mb-3" style={{ color: "var(--color-n-700)" }}>
            Choose a time
          </label>
          {slots.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--color-n-500)" }}>No slots available for this table.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => {
                const isSelected = selectedSlot?.slot_id === s.slot_id;
                const time = s.start_time.slice(0, 5);
                return (
                  <motion.button
                    key={s.slot_id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSlotSelect(s)}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                    style={{
                      background: isSelected ? "var(--color-n-900)" : "#fff",
                      color: isSelected ? "#fff" : "var(--color-n-700)",
                      border: `1px solid ${isSelected ? "var(--color-n-900)" : "var(--color-n-200)"}`,
                    }}
                  >
                    {time}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
