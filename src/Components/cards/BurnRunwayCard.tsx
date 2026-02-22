"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/AppStore";
import MoneyInput from "@/Components/MoneyInput";
import { calcDepletionDateISO, calcRiskLabel, calcRunwayDays } from "@/lib/finance/cash";

export default function BurnRunwayCard() {
  const { cashBalance, monthlyBurn, setMonthlyBurn } = useAppStore();

  const runwayDays = useMemo(() => calcRunwayDays(cashBalance, monthlyBurn), [cashBalance, monthlyBurn]);
const depletion = useMemo(() => calcDepletionDateISO(runwayDays), [runwayDays]);
const risk = useMemo(() => calcRiskLabel(runwayDays), [runwayDays]);

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-white/60">Burn rate & runway</div>
          <div className="mt-3 flex flex-wrap items-baseline gap-4">
            <div>
              <div className="text-xs text-white/60">Estimated runway</div>
              <div className="text-3xl font-semibold">{runwayDays} days</div>
            </div>
            <div>
              <div className="text-xs text-white/60">Projected depletion</div>
              <div className="text-lg font-semibold">{depletion}</div>
            </div>
            <div className="rounded-full bg-white/[0.06] ring-1 ring-white/10 px-3 py-1 text-xs">
              Risk: <span className="text-white">{risk}</span>
            </div>
          </div>

          <div className="mt-2 text-sm text-white/60">
            Burn is monthly net outflow. If burn is 0, runway will show as very high.
          </div>
        </div>

        <div className="min-w-[220px] rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
          <MoneyInput label="Spend amount ($)" value={monthlyBurn} onChange={setMonthlyBurn} />
        </div>
      </div>
    </section>
  );
}