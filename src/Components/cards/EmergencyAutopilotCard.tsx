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
}): { mode: SaveMode; suggestedPct: number; minPct: number; maxPct: number; reserveMonths: number | null } {
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

  // If unknown, pick a medium-default so UI still looks alive
  if (reserveMonths === null) return 55;

  // Reserve component (dominant)
  // reserve >= targetMonths => 0 risk from reserve
  // reserve 0 => 100 risk
  const reserveRisk = clamp(((targetMonths - reserveMonths) / targetMonths) * 100, 0, 100);

  // Runway component (secondary)
  // <30 days = +35, 30-60 = +20, 60-120 = +10, else +0
  let runwayRisk = 0;
  if (runwayDays !== null && runwayDays > 0) {
    if (runwayDays < 30) runwayRisk = 35;
    else if (runwayDays < 60) runwayRisk = 20;
    else if (runwayDays < 120) runwayRisk = 10;
  }

  return clamp(reserveRisk * 0.75 + runwayRisk, 0, 100);
}

function riskBarGradient(mode: SaveMode) {
  // smooth transitions between color schemes
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
  const {
    cashBalance,
    monthlyBurn,
    autopilotPct,
    setAutopilotPct,
    reserveBalance,
  } = useAppStore();

  const targetMonths = 3;

  const runwayDays = useMemo(
    () => calcRunwayDays(cashBalance, monthlyBurn),
    [cashBalance, monthlyBurn]
  );

  const emergencyGoal = useMemo(() => monthlyBurn * targetMonths, [monthlyBurn]);

  const gap = useMemo(
    () => Math.max(0, emergencyGoal - reserveBalance),
    [emergencyGoal, reserveBalance]
  );

  const rules = useMemo(
    () =>
      getModeAndPct({
        reserveBalance,
        monthlyBurn,
        targetMonths,
        runwayDays,
      }),
    [reserveBalance, monthlyBurn, targetMonths, runwayDays]
  );

  // Override mode: default OFF
  const [overrideOn, setOverrideOn] = useState(false);

  // When override OFF, auto-apply the mode's suggested pct
  const desiredAutoPct = rules.suggestedPct;
  const effectivePct = overrideOn ? autopilotPct : desiredAutoPct;

  // keep store synced when override OFF
  const [justSaved, setJustSaved] = useState(false);
  const bumpSaved = () => {
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 900);
  };

  useEffect(() => {
    if (!overrideOn && autopilotPct !== desiredAutoPct) {
      setAutopilotPct(desiredAutoPct);
      bumpSaved();
    }
  }, [overrideOn, autopilotPct, desiredAutoPct, setAutopilotPct]);

  const monthlyReserve = useMemo(() => {
    if (monthlyBurn <= 0) return 0;
    return Math.round((monthlyBurn * effectivePct) / 100);
  }, [monthlyBurn, effectivePct]);

  const monthsToGoal = useMemo(() => {
    if (monthlyReserve <= 0) return null;
    if (gap <= 0) return 0;
    return Math.ceil(gap / monthlyReserve);
  }, [gap, monthlyReserve]);

  const reserveMonthsDisplay = rules.reserveMonths;

  const riskScore = useMemo(
    () =>
      computeRiskScore({
        reserveMonths: reserveMonthsDisplay,
        runwayDays,
        targetMonths,
      }),
    [reserveMonthsDisplay, runwayDays, targetMonths]
  );

  const riskLabel = useMemo(() => {
    if (rules.mode === "done") return "Low";
    if (riskScore >= 75) return "High";
    if (riskScore >= 45) return "Medium";
    return "Low";
  }, [riskScore, rules.mode]);

  const criticalGlow = rules.mode === "critical";

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6">
      {/* subtle pulsing glow only when critical */}
      <style>{`
        @keyframes criticalPulse {
          0%, 100% { box-shadow: 0 0 0px rgba(239, 68, 68, 0.0), 0 0 0px rgba(239, 68, 68, 0.0); }
          50% { box-shadow: 0 0 22px rgba(239, 68, 68, 0.22), 0 0 48px rgba(239, 68, 68, 0.10); }
        }
      `}</style>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm text-white/60">Emergency Fund Autopilot</div>
            <span
              className={[
                "text-xs rounded-full px-2 py-0.5 ring-1 transition",
                justSaved
                  ? "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30"
                  : "bg-white/[0.03] text-white/60 ring-white/10",
              ].join(" ")}
            >
              {justSaved ? "Saved ✓" : "Auto-saves"}
            </span>
          </div>

          <div className="mt-2 text-2xl font-semibold text-white">
            Build a {targetMonths}-month safety buffer automatically
          </div>

          <div className="mt-2 text-sm text-white/60">
            Goal: <span className="text-white">{formatMoney(emergencyGoal)}</span> • Reserve:{" "}
            <span className="text-white">{formatMoney(reserveBalance)}</span> • Gap:{" "}
            <span className="text-white">{formatMoney(gap)}</span>
          </div>

          <div className="mt-2 text-xs text-white/60">
            Runway:{" "}
            <span className="text-white">
              {runwayDays === null ? "— (enter burn to compute)" : `${runwayDays} days`}
            </span>
          </div>

          {/* Mode + risk meter */}
          <div
            className={[
              "mt-4 rounded-2xl bg-black/25 ring-1 ring-white/10 p-4 transition-all duration-500",
              criticalGlow ? "ring-red-500/30" : "",
            ].join(" ")}
            style={criticalGlow ? { animation: "criticalPulse 1.8s ease-in-out infinite" } : undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-white/60">Mode</div>
                <div className={modeBadgeClasses(rules.mode)}>
                  <span className={modeDotClass(rules.mode)} />
                  {modeLabel(rules.mode)}
                </div>

                <div className="mt-2 text-xs text-white/60">
                  {monthlyBurn <= 0
                    ? "Enter burn rate to unlock smart modes."
                    : modeBlurb(rules.mode, targetMonths)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/60">Reserve (months)</div>
                <div className="text-sm font-semibold text-white">
                  {reserveMonthsDisplay === null ? "—" : reserveMonthsDisplay.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Risk meter */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Risk meter</span>
                <span className="text-white/80">
                  {riskLabel} • {Math.round(riskScore)}%
                </span>
              </div>

              <div className="mt-2 h-2.5 w-full rounded-full bg-white/10 ring-1 ring-white/10 overflow-hidden">
                <div
                  className={[
                    "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                    riskBarGradient(rules.mode),
                  ].join(" ")}
                  style={{ width: `${clamp(riskScore, 0, 100)}%` }}
                />
              </div>

              <div className="mt-2 text-[11px] text-white/50">
                Risk is based on reserve months (primary) + runway days (secondary).
              </div>
            </div>
          </div>
        </div>

        {/* Control panel */}
        <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 min-w-[340px]">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">Autopilot</div>

            <button
              onClick={() => {
                setOverrideOn((v) => {
                  const next = !v;
                  // when turning override ON, seed slider with current auto pct
                  if (!v) {
                    setAutopilotPct(desiredAutoPct);
                    bumpSaved();
                  }
                  return next;
                });
              }}
              className={[
                "rounded-2xl px-3 py-1 text-xs ring-1 transition-colors duration-300",
                overrideOn
                  ? "bg-white text-black ring-white/20 hover:bg-white/90"
                  : "bg-white/[0.06] text-white ring-white/10 hover:bg-white/[0.10]",
              ].join(" ")}
            >
              {overrideOn ? "Override: ON" : "Override"}
            </button>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-white">{effectivePct}%</div>
            <div className="text-xs text-white/60">
              {monthlyBurn <= 0 ? "Set burn to estimate" : `≈ ${formatMoney(monthlyReserve)}/mo`}
            </div>
          </div>

          {!overrideOn ? (
            <div className="mt-3 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-3 transition-colors duration-500">
              <div className="text-sm text-white/80">Auto-adjusting by mode.</div>
              <div className="mt-1 text-xs text-white/60">
                Current rule: {modeLabel(rules.mode)} → {rules.suggestedPct}%
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Min {rules.minPct}%</span>
                <span>Max {rules.maxPct}%</span>
              </div>

              <input
                type="range"
                min={rules.minPct}
                max={rules.maxPct}
                value={clamp(autopilotPct, rules.minPct, rules.maxPct)}
                onChange={(e) => {
                  setAutopilotPct(Number(e.target.value));
                  bumpSaved();
                }}
                className="mt-2 w-full"
              />

              <div className="mt-2 text-xs text-white/60">
                Override is on — you control the saving rate.
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-white/70">
            Estimated reserve this month:{" "}
            <span className="text-white">{formatMoney(monthlyReserve)}</span>
          </div>

          <div className="mt-1 text-xs text-white/60">
            {monthsToGoal === null
              ? "Enter a burn rate to estimate time-to-goal."
              : monthsToGoal === 0
              ? "Reserve goal already met ✅"
              : `Time to fully fund reserve: ~${monthsToGoal} months`}
          </div>

          <div className="mt-3 text-xs text-white/50">
            Autopilot adjusts automatically unless Override is enabled.
          </div>
        </div>
      </div>
    </section>
  );
}