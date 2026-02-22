"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store/AppStore";
import { calcRunwayDays } from "@/lib/finance/cash";

function formatMoney(n?: number) {
  const safe = Number.isFinite(Number(n)) ? Number(n) : 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function EmergencyAutopilotCard() {
  const {
    cashBalance,
    monthlyBurn,
    autopilotPct,
    setAutopilotPct,
    reserveBalance,
    setReserveBalance,
  } = useAppStore();

  // calcRunwayDays should return number | null (null when burn is 0)
  const runwayDays = useMemo(
    () => calcRunwayDays(cashBalance, monthlyBurn),
    [cashBalance, monthlyBurn]
  );

  const targetMonths = 3;
  const emergencyGoal = useMemo(() => monthlyBurn * targetMonths, [monthlyBurn]);

  // Suggested autopilot: only meaningful if runway is known
  const suggestedPct = useMemo(() => {
    if (runwayDays === null) return 10; // default suggestion when burn not entered
    if (runwayDays < 60) return 20;
    if (runwayDays < 120) return 16;
    return 10;
  }, [runwayDays]);

  const monthlyReserve = useMemo(() => {
    // If burn is 0, reserve contribution should be 0
    if (monthlyBurn <= 0) return 0;
    return Math.round((monthlyBurn * autopilotPct) / 100);
  }, [monthlyBurn, autopilotPct]);

  const gap = useMemo(() => Math.max(0, emergencyGoal - reserveBalance), [emergencyGoal, reserveBalance]);

  const monthsToGoal = useMemo(() => {
    if (monthlyReserve <= 0) return null;
    if (gap <= 0) return 0;
    return Math.ceil(gap / monthlyReserve);
  }, [gap, monthlyReserve]);

  // tiny UX: show a quick “Saved” pulse on changes
  const [justSaved, setJustSaved] = useState(false);
  const bumpSaved = () => {
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 900);
  };

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm text-white/60">Emergency Fund Autopilot</div>
            <span
              className={[
                "text-xs rounded-full px-2 py-0.5 ring-1 transition",
                justSaved ? "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30" : "bg-white/[0.03] text-white/60 ring-white/10",
              ].join(" ")}
            >
              {justSaved ? "Saved ✓" : "Auto-saves"}
            </span>
          </div>

          <div className="mt-2 text-2xl font-semibold">
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
        </div>

        <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 min-w-[280px]">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">Autopilot %</div>
            <button
              onClick={() => {
                setAutopilotPct(suggestedPct);
                bumpSaved();
              }}
              className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-1 text-xs hover:bg-white/[0.10]"
            >
              Set suggested ({suggestedPct}%)
            </button>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-semibold">{autopilotPct}%</div>
            <div className="text-xs text-white/60">
              {monthlyBurn <= 0 ? "Set burn to estimate" : `≈ ${formatMoney(monthlyReserve)}/mo`}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={30}
            value={autopilotPct}
            onChange={(e) => {
              setAutopilotPct(Number(e.target.value));
              bumpSaved();
            }}
            className="mt-3 w-full"
          />

          <div className="mt-3 text-sm text-white/70">
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

          <button
            onClick={() => {
              setReserveBalance(reserveBalance + monthlyReserve);
              bumpSaved();
            }}
            className="mt-3 w-full rounded-2xl bg-white text-black py-2 text-sm font-semibold disabled:opacity-60"
            disabled={monthlyReserve <= 0}
          >
            Simulate monthly transfer
          </button>

          <div className="mt-2 text-xs text-white/50">
            Demo behavior: this simulates a transfer to your reserve balance.
          </div>
        </div>
      </div>
    </section>
  );
}