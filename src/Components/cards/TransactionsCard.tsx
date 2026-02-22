"use client";

import { useAppStore } from "@/lib/store/AppStore";

export default function TransactionsCard() {
  const { txns } = useAppStore();

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">Transactions</div>
          <div className="mt-1 text-2xl font-semibold">Recent activity (demo)</div>
        </div>
        <div className="text-xs text-white/60">Plaid connects here later</div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.06] text-white/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-black/30">
            {txns.map((t) => (
              <tr key={t.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-white/80">{t.date}</td>
                <td className="px-4 py-3 text-white">{t.name}</td>
                <td className="px-4 py-3 text-white/70">{t.category}</td>
                <td className="px-4 py-3 text-right text-white">
                  {t.amount < 0 ? "-" : ""}${Math.abs(t.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}