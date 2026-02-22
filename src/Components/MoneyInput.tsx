"use client";

import React, { useMemo, useState } from "react";

export default function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [raw, setRaw] = useState<string>(String(value));

  // Keep displayed text in sync when value changes externally
  useMemo(() => setRaw(String(value)), [value]);

  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/70">{label}</span>
      <input
        value={raw}
        inputMode="decimal"
        onChange={(e) => {
          const nextRaw = e.target.value;
          setRaw(nextRaw);
          const cleaned = nextRaw.replace(/[^0-9.]/g, "");
          const n = Number(cleaned);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="w-32 rounded-2xl bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-right outline-none focus:ring-white/20"
        placeholder="0"
      />
    </label>
  );
}