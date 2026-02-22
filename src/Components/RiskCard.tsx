"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/AppStore";
import { calcRunwayDays, calcDepletionDateISO } from "@/lib/finance/cash";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n?: number) {
  const safe = Number.isFinite(Number(n)) ? Number(n) : 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function getRisk(runwayDays: number): {
  level: RiskLevel;
  badgeClasses: string;
  title: string;
  message: string;
} {
  if (runwayDays < 30) {
    return {
      level: "HIGH",
      badgeClasses: "bg-red-100 text-red-800 ring-1 ring-red-200",
      title: "High cash risk",
      message: "Runway is under 30 days. Freeze discretionary spend and accelerate collections.",
    };
  }

  if (runwayDays < 90) {
    return {
      level: "MEDIUM",
      badgeClasses: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200",
      title: "Medium cash risk",
      message: "Runway is under 90 days. Tighten expenses and monitor weekly.",
    };
  }

  return {
    level: "LOW",
    badgeClasses: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    title: "Low cash risk",
    message: "Healthy runway. Keep building your emergency fund to stay resilient.",
  };
}

export default function RiskCard() {
  const { cashBalance, monthlyBurn, reserveBalance } = useAppStore();
  const targetMonths = 3;

  const runwayDays = useMemo(() => calcRunwayDays(cashBalance, monthlyBurn), [cashBalance, monthlyBurn]);

  const projectedDepletion = useMemo(() => calcDepletionDateISO(runwayDays), [runwayDays]);

  const emergencyTarget = useMemo(() => monthlyBurn * targetMonths, [monthlyBurn]);
  const gap = useMemo(() => Math.max(0, emergencyTarget - reserveBalance), [emergencyTarget, reserveBalance]);

  const progressPct = useMemo(() => {
    if (emergencyTarget <= 0) return 0;
    return clamp((reserveBalance / emergencyTarget) * 100, 0, 100);
  }, [reserveBalance, emergencyTarget]);

  const risk = useMemo(() => {
    if (runwayDays === null) {
      return {
        level: "UNKNOWN" as const,
        badgeClasses: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
        title: "Runway not calculated yet",
        message: "Enter your monthly burn to estimate runway and risk.",
      };
    }
    return getRisk(runwayDays);
  }, [runwayDays]);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cash Risk & Alerts</h2>
          <p className="mt-1 text-sm text-slate-600">Quick read on runway and emergency fund health.</p>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${risk.badgeClasses}`}
          aria-label={`Risk level ${risk.level}`}
        >
          {risk.level} RISK
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-600">Cash balance</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(cashBalance)}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-600">Monthly burn</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(monthlyBurn)}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-600">Estimated runway</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {runwayDays === null ? "—" : `${runwayDays} days`}
          </div>
          <div className="mt-1 text-xs text-slate-600">Projected depletion: {projectedDepletion ?? "—"}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{risk.title}</div>
            <div className="mt-1 text-sm text-slate-600">{risk.message}</div>
          </div>

          {gap > 0 ? (
            <div className="shrink-0 text-right">
              <div className="text-xs font-medium text-slate-600">Emergency fund gap</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(gap)}</div>
            </div>
          ) : (
            <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100">
              Target met ✅
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Emergency fund progress ({targetMonths} months)</span>
            <span>{Math.round(progressPct)}%</span>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-900 transition-[width]" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="mt-3 text-xs text-slate-600">
            Reserve balance: <span className="font-semibold text-slate-900">{formatMoney(reserveBalance)}</span> • Target:{" "}
            <span className="font-semibold text-slate-900">{formatMoney(emergencyTarget)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}