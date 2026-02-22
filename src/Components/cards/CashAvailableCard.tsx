"use client";

import { useAppStore } from "@/lib/store/AppStore";
import MoneyInput from "@/Components/MoneyInput";

export default function CashAvailableCard() {
  const { cashBalance, setCashBalance } = useAppStore();

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-white/60">Cash available (bank balance)</div>
          <div className="mt-2 text-4xl font-semibold">
            ${cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 text-sm text-white/60">Starts at 0 — enter your cash amount to calculate runway.</div>
        </div>

        <div className="min-w-[220px] rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
          <MoneyInput label="Bank amount ($)" value={cashBalance} onChange={setCashBalance} />
        </div>
      </div>
    </section>
  );
}