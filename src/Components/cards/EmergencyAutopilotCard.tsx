"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store/AppStore";
import { calcRunwayDays } from "@/lib/finance/cash";

function formatMoney(n?: number) {
  const safe = Number.isFinite(Number(n)) ? Number(n) : 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type SaveMode = "critical" | "boost" | "coast" | "normal" | "done";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function getModeAndPct(args: {
  reserveBalance: number;
  monthlyBurn: number;
  targetMonths: number;
  runwayDays: number | null;
}): {
  mode: SaveMode;
  suggestedPct: number;
  minPct: number;
  maxPct: number;
  reserveMonths: number | null;
} {
  const { reserveBalance, monthlyBurn, targetMonths, runwayDays } = args;

  if (monthlyBurn <= 0) {
    return {
      mode: "normal",
      suggestedPct: 10,
      minPct: 0,
      maxPct: 30,
      reserveMonths: null,
    };
  }

  const reserveMonths = reserveBalance / monthlyBurn;
  const goal = monthlyBurn * targetMonths;
  const gap = Math.max(0, goal - reserveBalance);

  if (gap <= 0) {
    return { mode: "done", suggestedPct: 0, minPct: 0, maxPct: 10, reserveMonths };
  }

  const runwayTight = runwayDays !== null && runwayDays > 0 && runwayDays < 60;

  if (reserveMonths < 2) {
    return {
      mode: "critical",
      suggestedPct: runwayTight ? 25 : 20,
      minPct: 15,
      maxPct: 30,
      reserveMonths,
    };
  }

  if (reserveMonths < targetMonths) {
    return {
      mode: "boost",
      suggestedPct: runwayTight ? 18 : 16,
      minPct: 10,
      maxPct: 25,
      reserveMonths,
    };
  }

  if (reserveMonths < 6) {
    return { mode: "coast", suggestedPct: 8, minPct: 0, maxPct: 15, reserveMonths };
  }

  return {
    mode: "normal",
    suggestedPct: runwayTight ? 12 : 10,
    minPct: 0,
    maxPct: 30,
    reserveMonths,
  };
}

function modeLabel(mode: SaveMode) {
  switch (mode) {
    case "critical":
      return "Critical Save Mode";
    case "boost":
      return "Boost Save Mode";
    case "coast":
      return "Coast Mode";
    case "done":
      return "Goal Met";
    default:
      return "Normal Mode";
  }
}

function modeBlurb(mode: SaveMode, targetMonths: number) {
  switch (mode) {
    case "critical":
      return "Reserve is under 2 months — autopilot saves aggressively.";
    case "boost":
      return `Reserve is under ${targetMonths} months — autopilot saves faster to hit your goal.`;
    case "coast":
      return "Reserve is healthy — autopilot contributes lightly.";
    case "done":
      return "Emergency goal reached — autopilot can pause.";
    default:
      return "Steady saving based on your inputs.";
  }
}

function modeBadgeClasses(mode: SaveMode) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 transition-colors duration-500";
  switch (mode) {
    case "critical":
      return `${base} bg-red-500/20 text-red-200 ring-red-500/30`;
    case "boost":
      return `${base} bg-yellow-500/20 text-yellow-200 ring-yellow-500/30`;
    case "coast":
      return `${base} bg-emerald-500/20 text-emerald-200 ring-emerald-500/30`;
    case "normal":
      return `${base} bg-green-500/20 text-green-200 ring-green-500/30`;
    case "done":
      return `${base} bg-cyan-500/20 text-cyan-200 ring-cyan-500/30`;
    default:
      return `${base} bg-white/[0.06] text-white ring-white/10`;
  }
}

function modeDotClass(mode: SaveMode) {
  const base = "h-2 w-2 rounded-full transition-colors duration-500";
  switch (mode) {
    case "critical":
      return `${base} bg-red-400`;
    case "boost":
      return `${base} bg-yellow-400`;
    case "coast":
      return `${base} bg-emerald-400`;
    case "normal":
      return `${base} bg-green-400`;
    case "done":
      return `${base} bg-cyan-400`;
    default:
      return `${base} bg-white`;
  }
}

// Risk meter: 0 = safe, 100 = high risk
function computeRiskScore(args: {
  reserveMonths: number | null;
  runwayDays: number | null;
  targetMonths: number;
}): number {
  const { reserveMonths, runwayDays, targetMonths } = args;

  if (reserveMonths === null) return 55;

  const reserveRisk = clamp(((targetMonths - reserveMonths) / targetMonths) * 100, 0, 100);

  let runwayRisk = 0;
  if (runwayDays !== null && runwayDays > 0) {
    if (runwayDays < 30) runwayRisk = 35;
    else if (runwayDays < 60) runwayRisk = 20;
    else if (runwayDays < 120) runwayRisk = 10;
  }

  return clamp(reserveRisk * 0.75 + runwayRisk, 0, 100);
}

function riskBarGradient(mode: SaveMode) {
  switch (mode) {
    case "critical":
      return "from-red-500 to-red-300";
    case "boost":
      return "from-yellow-500 to-yellow-300";
    case "coast":
      return "from-emerald-500 to-emerald-300";
    case "normal":
      return "from-green-500 to-green-300";
    case "done":
      return "from-cyan-500 to-cyan-300";
    default:
      return "from-white/60 to-white/30";
  }
}

export default function EmergencyAutopilotCard() {
  const { cashBalance, monthlyBurn, autopilotPct, setAutopilotPct, reserveBalance } = useAppStore();

  const targetMonths = 3;

  // ✅ MINIMAL FIX:
  // If you don't have a separate reserve input yet, treat bank cash as the reserve.
  // Once reserveBalance is set (>0), it'll use that instead.
  const reserveForCalc = useMemo(
    () => (reserveBalance > 0 ? reserveBalance : cashBalance),
    [reserveBalance, cashBalance]
  );

  const runwayDays = useMemo(
    () => calcRunwayDays(cashBalance, monthlyBurn),
    [cashBalance, monthlyBurn]
  );

  const emergencyGoal = useMemo(() => monthlyBurn * targetMonths, [monthlyBurn]);

  const gap = useMemo(
    () => Math.max(0, emergencyGoal - reserveForCalc),
    [emergencyGoal, reserveForCalc]
  );

  const rules = useMemo(
    () =>
      getModeAndPct({
        reserveBalance: reserveForCalc,
        monthlyBurn,
        targetMonths,
        runwayDays,
      }),
    [reserveForCalc, monthlyBurn, targetMonths, runwayDays]
  );

  // Override mode: default OFF
  const [overrideOn, setOverrideOn] = useState(false);

  // When override OFF, auto-apply the mode's suggested % to the store
  useEffect(() => {
    if (!overrideOn) setAutopilotPct(rules.suggestedPct);
  }, [overrideOn, rules.suggestedPct, setAutopilotPct]);

  const effectivePct = overrideOn ? autopilotPct : rules.suggestedPct;

  const monthlyReserve = useMemo(() => {
    if (monthlyBurn <= 0) return 0;
    return Math.round((monthlyBurn * effectivePct) / 100);
  }, [monthlyBurn, effectivePct]);

  const monthsToGoal = useMemo(() => {
    if (monthlyReserve <= 0) return null;
    if (gap <= 0) return 0;
    return Math.ceil(gap / monthlyReserve);
  }, [gap, monthlyReserve]);

  const riskScore = useMemo(
    () =>
      computeRiskScore({
        reserveMonths: rules.reserveMonths,
        runwayDays,
        targetMonths,
      }),
    [rules.reserveMonths, runwayDays, targetMonths]
  );

  const riskLabel = useMemo(() => {
    if (rules.mode === "done") return "Low";
    if (riskScore >= 75) return "High";
    if (riskScore >= 45) return "Medium";
    return "Low";
  }, [riskScore, rules.mode]);

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-white/60">Emergency Fund Autopilot</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            Build a 3-month safety buffer automatically
          </div>

          <div className="mt-3 text-sm text-white/70">
            Goal: <span className="text-white">{formatMoney(emergencyGoal)}</span> • Reserve:{" "}
            <span className="text-white">{formatMoney(reserveForCalc)}</span> • Gap:{" "}
            <span className="text-white">{formatMoney(gap)}</span>
          </div>

          <div className="mt-2 text-xs text-white/60">
            Runway:{" "}
            <span className="text-white">{runwayDays === null ? "—" : `${runwayDays} days`}</span>
          </div>
        </div>

        <div className="min-w-[260px] rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
          <div className="text-xs text-white/60">Autopilot</div>
          <div className="mt-1 flex items-center justify-between">
            <div className="text-3xl font-semibold text-white">{effectivePct}%</div>
            <button
              onClick={() => setOverrideOn((v) => !v)}
              className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white ring-1 ring-white/10 hover:bg-white/[0.10]"
            >
              {overrideOn ? "Auto" : "Override"}
            </button>
          </div>

          <div className="mt-2 text-xs text-white/60">
            Auto-adjusting by mode.
            <div className="mt-1 text-white/70">
              Current rule: {modeLabel(rules.mode)} → {rules.suggestedPct}%
            </div>
          </div>

          <div className="mt-4 text-sm text-white/80">
            Estimated reserve this month:{" "}
            <span className="font-semibold text-white">{formatMoney(monthlyReserve)}</span>
          </div>

          <div className="mt-1 text-xs text-white/60">
            Time to fully fund reserve:{" "}
            <span className="text-white">{monthsToGoal === null ? "—" : `~${monthsToGoal} months`}</span>
          </div>

          <div className="mt-3 text-xs text-white/60">
            Autopilot adjusts automatically unless Override is enabled.
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-black/30 ring-1 ring-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className={modeBadgeClasses(rules.mode)}>
              <span className={modeDotClass(rules.mode)} />
              {modeLabel(rules.mode)}
            </div>
            <div className="mt-2 text-sm text-white/70">{modeBlurb(rules.mode, targetMonths)}</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-white/60">Reserve (months)</div>
            <div className="text-lg font-semibold text-white">
              {rules.reserveMonths === null ? "—" : rules.reserveMonths.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Risk meter</span>
            <span>
              {riskLabel} • {Math.round(riskScore)}%
            </span>
          </div>

          <div className="mt-2 h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${riskBarGradient(rules.mode)} transition-all duration-300`}
              style={{ width: `${riskScore}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-white/50">
            Risk is based on reserve months (primary) + runway days (secondary).
          </div>
        </div>
      </div>
    </section>
  );
}