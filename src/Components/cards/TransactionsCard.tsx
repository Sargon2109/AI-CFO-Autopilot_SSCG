"use client";

import React, { useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/store/AppStore";

type Txn = {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  category: string;
  amount: number; // + income, - expense
};

type DraftTxn = {
  date: string;
  name: string;
  category: string;
  amount: string; // input-controlled
};

type Mode = "expense" | "income";
type Range = "7d" | "30d" | "all";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function clampText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function normalizeAmount(raw: string) {
  return raw.replace(/[^\d.-]/g, "");
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function sampleData(): Txn[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: crypto.randomUUID(), date: today, name: "Shopify payout", category: "Sales", amount: 420 },
    { id: crypto.randomUUID(), date: daysAgoISO(1), name: "Packaging supplies", category: "Supplies", amount: -48 },
    { id: crypto.randomUUID(), date: daysAgoISO(3), name: "Google Ads", category: "Marketing", amount: -120 },
    { id: crypto.randomUUID(), date: daysAgoISO(8), name: "Client invoice", category: "Sales", amount: 900 },
  ];
}

export default function TransactionsCard() {
  /**
   * This component FORCES an empty start, even if your store has demo txns.
   * It initializes local state from [] and only uses the store as a persistence layer.
   *
   * Store expected:
   *   setTxns?: (next: Txn[]) => void
   * (txns can exist but we ignore it at first load)
   */
  const store = useAppStore() as { txns?: Txn[]; setTxns?: (next: Txn[]) => void };

  // ✅ Starts with NO transactions always
  const [localTxns, setLocalTxns] = useState<Txn[]>([]);

  // Quick add controls
  const [mode, setMode] = useState<Mode>("expense");
  const [draft, setDraft] = useState<DraftTxn>({
    date: new Date().toISOString().slice(0, 10),
    name: "",
    category: "General",
    amount: "",
  });

  // Search / filters
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [range, setRange] = useState<Range>("30d");

  // Toast / undo
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const categories = useMemo(() => {
    const base = new Set<string>(["General", "Sales", "Supplies", "Bills", "Marketing", "Travel", "Food"]);
    for (const t of localTxns) base.add(t.category);
    return Array.from(base);
  }, [localTxns]);

  const filtered = useMemo(() => {
    const query = clampText(q).toLowerCase();
    const minDate =
      range === "7d" ? daysAgoISO(7) : range === "30d" ? daysAgoISO(30) : "0000-00-00";

    return localTxns
      .filter((t) => (range === "all" ? true : t.date >= minDate))
      .filter((t) => (catFilter === "All" ? true : t.category === catFilter))
      .filter((t) => {
        if (!query) return true;
        const hay = `${t.date} ${t.name} ${t.category} ${t.amount}`.toLowerCase();
        return hay.includes(query);
      });
  }, [localTxns, q, catFilter, range]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.amount >= 0) income += t.amount;
      else expense += t.amount; // negative
    }
    const net = income + expense;
    return { income, expense, net };
  }, [filtered]);

  function persist(next: Txn[]) {
    setLocalTxns(next);
    store.setTxns?.(next); // optional persistence
  }

  function showToast(msg: string, undo?: () => void) {
    setToast({ msg, undo });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }

  function updateDraft<K extends keyof DraftTxn>(key: K, value: DraftTxn[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function signedAmount(raw: string, m: Mode) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const abs = Math.abs(n);
    return m === "expense" ? -abs : abs;
  }

  function clearDraft() {
    setDraft((d) => ({ ...d, name: "", amount: "" }));
  }

  function addTxn() {
    const date = clampText(draft.date);
    const name = clampText(draft.name);
    const category = clampText(draft.category) || "General";
    const amt = signedAmount(draft.amount, mode);

    if (!date || !name) return;
    if (draft.amount === "" || draft.amount === "-" || draft.amount === ".") return;
    if (amt === null) return;

    const newTxn: Txn = {
      id: crypto.randomUUID(),
      date,
      name,
      category,
      amount: amt,
    };

    const prev = localTxns;
    const next = [newTxn, ...prev];
    persist(next);
    clearDraft();

    showToast("Transaction added.", () => persist(prev));
  }

  function deleteTxn(id: string) {
    const prev = localTxns;
    const next = prev.filter((t) => t.id !== id);
    persist(next);
    showToast("Transaction deleted.", () => persist(prev));
  }

  function addSamples() {
    const prev = localTxns;
    const next = [...sampleData(), ...prev];
    persist(next);
    showToast("Sample transactions added.", () => persist(prev));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTxn();
    if (e.key === "Escape") clearDraft();
  }

  const amountPreview = useMemo(() => {
    const amt = signedAmount(draft.amount, mode);
    if (amt === null || draft.amount === "" || draft.amount === "-" || draft.amount === ".") return null;
    return amt;
  }, [draft.amount, mode]);

  const hasAnyTxns = localTxns.length > 0;

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6 relative">
      {/* Header + mini stats */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-white/60">Transactions</div>
          <div className="mt-1 text-2xl font-semibold">Add & track activity</div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 px-3 py-2">
              <div className="text-[11px] text-white/60">Net</div>
              <div className="text-sm text-white font-medium">{money(stats.net)}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 px-3 py-2">
              <div className="text-[11px] text-white/60">Income</div>
              <div className="text-sm text-white font-medium">{money(stats.income)}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 px-3 py-2">
              <div className="text-[11px] text-white/60">Expenses</div>
              <div className="text-sm text-white font-medium">{money(stats.expense)}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/60">Plaid connects here later</div>
      </div>

      {/* Sticky Quick Add */}
      <div className="mt-5 sticky top-3 z-10">
        <div className="rounded-2xl bg-black/60 backdrop-blur ring-1 ring-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("expense")}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm ring-1 transition",
                  mode === "expense"
                    ? "bg-white/[0.10] ring-white/20 text-white"
                    : "bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.07]"
                )}
              >
                Expense
              </button>
              <button
                onClick={() => setMode("income")}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm ring-1 transition",
                  mode === "income"
                    ? "bg-white/[0.10] ring-white/20 text-white"
                    : "bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.07]"
                )}
              >
                Income
              </button>

              {amountPreview !== null && (
                <div className="ml-2 text-xs text-white/60">
                  Preview: <span className="text-white font-medium">{money(amountPreview)}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-white/60">Enter to add • Esc to clear</div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs text-white/60 mb-1">Date</label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => updateDraft("date", e.target.value)}
                className="w-full rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/20"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs text-white/60 mb-1">Name</label>
              <input
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                onKeyDown={onKeyDown}
                placeholder='e.g., "Shopify payout" or "Supplies"'
                className="w-full rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-white/60 mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => updateDraft("category", e.target.value)}
                className="w-full rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/20"
              >
                {categories.map((c) => (
                  <option key={c} className="bg-black" value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-white/60 mb-1">Amount</label>
              <input
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => updateDraft("amount", normalizeAmount(e.target.value))}
                onKeyDown={onKeyDown}
                placeholder={mode === "expense" ? "25" : "250"}
                className="w-full rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/20"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              {mode === "expense"
                ? "Expense will be saved as a negative number."
                : "Income will be saved as a positive number."}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearDraft}
                className="rounded-xl bg-white/[0.04] hover:bg-white/[0.07] ring-1 ring-white/10 px-4 py-2 text-sm text-white/80"
              >
                Clear
              </button>
              <button
                onClick={addTxn}
                className="rounded-xl bg-white/[0.10] hover:bg-white/[0.14] ring-1 ring-white/20 px-4 py-2 text-sm text-white"
              >
                Add transaction
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="mt-4 flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-white/60 mb-1">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, category, amount..."
            className="w-full rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/20"
          />
        </div>

        <div className="md:w-56">
          <label className="block text-xs text-white/60 mb-1">Category</label>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full rounded-xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/20"
          >
            <option className="bg-black" value="All">
              All
            </option>
            {categories.map((c) => (
              <option key={c} className="bg-black" value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:w-60">
          <label className="block text-xs text-white/60 mb-1">Date range</label>
          <div className="flex gap-2">
            <button
              onClick={() => setRange("7d")}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm ring-1 transition",
                range === "7d"
                  ? "bg-white/[0.10] ring-white/20 text-white"
                  : "bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.07]"
              )}
            >
              7d
            </button>
            <button
              onClick={() => setRange("30d")}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm ring-1 transition",
                range === "30d"
                  ? "bg-white/[0.10] ring-white/20 text-white"
                  : "bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.07]"
              )}
            >
              30d
            </button>
            <button
              onClick={() => setRange("all")}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm ring-1 transition",
                range === "all"
                  ? "bg-white/[0.10] ring-white/20 text-white"
                  : "bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.07]"
              )}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Table / Empty state */}
      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.06] text-white/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-right px-4 py-3 font-medium"> </th>
            </tr>
          </thead>

          {!hasAnyTxns ? (
            <tbody className="bg-black/30">
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="text-white font-medium">No transactions yet</div>
                  <div className="mt-1 text-sm text-white/60">
                    Add your first one above, or load sample data for a demo.
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={addSamples}
                      className="rounded-xl bg-white/[0.10] hover:bg-white/[0.14] ring-1 ring-white/20 px-4 py-2 text-sm text-white"
                    >
                      Add sample data
                    </button>
                    <button
                      onClick={() => {
                        setDraft((d) => ({ ...d, name: "First transaction", amount: "25" }));
                        setMode("expense");
                      }}
                      className="rounded-xl bg-white/[0.04] hover:bg-white/[0.07] ring-1 ring-white/10 px-4 py-2 text-sm text-white/80"
                    >
                      Fill example
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : filtered.length === 0 ? (
            <tbody className="bg-black/30">
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-white/60">
                  No results match your filters.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="bg-black/30">
              {filtered.map((t) => {
                const isExpense = t.amount < 0;
                return (
                  <tr key={t.id} className="border-t border-white/10 hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3 text-white/80 relative">
                      <span
                        className={cn(
                          "absolute left-0 top-0 h-full w-[3px]",
                          isExpense ? "bg-white/25" : "bg-white/10"
                        )}
                      />
                      {t.date}
                    </td>
                    <td className="px-4 py-3 text-white">{t.name}</td>
                    <td className="px-4 py-3 text-white/70">{t.category}</td>
                    <td className="px-4 py-3 text-right text-white">{money(t.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteTxn(t.id)}
                        className="rounded-lg bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 px-3 py-1.5 text-xs text-white/80"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* Undo toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="rounded-2xl bg-black/80 backdrop-blur ring-1 ring-white/15 px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="text-sm text-white">{toast.msg}</div>
              {toast.undo && (
                <button
                  onClick={() => {
                    toast.undo?.();
                    setToast(null);
                  }}
                  className="rounded-xl bg-white/[0.10] hover:bg-white/[0.14] ring-1 ring-white/20 px-3 py-1.5 text-sm text-white"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => setToast(null)}
                className="rounded-xl bg-white/[0.04] hover:bg-white/[0.07] ring-1 ring-white/10 px-3 py-1.5 text-sm text-white/70"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}