"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Txn = {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  category: string;
  amount: number; // negative = expense, positive = income
};

type Store = {
  cashBalance: number;
  setCashBalance: (n: number) => void;
  monthlyBurn: number;
  setMonthlyBurn: (n: number) => void;

  autopilotPct: number; // 0-30
  setAutopilotPct: (n: number) => void;

  reserveBalance: number;
  setReserveBalance: (n: number) => void;

  txns: Txn[];
  setTxns: React.Dispatch<React.SetStateAction<Txn[]>>;
};

const AppStoreContext = createContext<Store | null>(null);

const STORAGE_KEY = "epsilon_store_v1";

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [monthlyBurn, setMonthlyBurn] = useState<number>(0);
  const [autopilotPct, setAutopilotPct] = useState<number>(16);
  const [reserveBalance, setReserveBalance] = useState<number>(0);

  const [txns, setTxns] = useState<Txn[]>([
    { id: "t1", date: "2026-02-01", name: "Stripe payout", category: "Income", amount: 12000 },
    { id: "t2", date: "2026-02-03", name: "Rent", category: "Fixed", amount: -4200 },
    { id: "t3", date: "2026-02-05", name: "Payroll", category: "Payroll", amount: -17500 },
    { id: "t4", date: "2026-02-08", name: "Ads", category: "Growth", amount: -1800 },
  ]);

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      setCashBalance(Number(parsed.cashBalance ?? 0));
      setMonthlyBurn(Number(parsed.monthlyBurn ?? 0));
      setAutopilotPct(Number(parsed.autopilotPct ?? 16));
      setReserveBalance(Number(parsed.reserveBalance ?? 0));
      setTxns(Array.isArray(parsed.txns) ? parsed.txns : []);
    } catch {
      // ignore
    }
  }, []);

  // Save
  useEffect(() => {
    const payload = { cashBalance, monthlyBurn, autopilotPct, reserveBalance, txns };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cashBalance, monthlyBurn, autopilotPct, reserveBalance, txns]);

  const value = useMemo(
    () => ({
      cashBalance,
      setCashBalance,
      monthlyBurn,
      setMonthlyBurn,
      autopilotPct,
      setAutopilotPct,
      reserveBalance,
      setReserveBalance,
      txns,
      setTxns,
    }),
    [cashBalance, monthlyBurn, autopilotPct, reserveBalance, txns]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}