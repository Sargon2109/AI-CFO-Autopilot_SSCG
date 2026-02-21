// src/components/RiskCard.tsx

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
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

export default function RiskCard(props: {
  cashBalance: number;
  monthlyBurn: number;
  emergencyFundTargetMonths?: number;
}) {
  const targetMonths = props.emergencyFundTargetMonths ?? 3;

  const dailyBurn = props.monthlyBurn / 30;
  const runwayDays = dailyBurn > 0 ? Math.floor(props.cashBalance / dailyBurn) : 9999;

  const emergencyTarget = props.monthlyBurn * targetMonths;
  const gap = Math.max(0, emergencyTarget - props.cashBalance);

  const progressPct =
    emergencyTarget > 0 ? clamp((props.cashBalance / emergencyTarget) * 100, 0, 100) : 0;

  const risk = getRisk(runwayDays);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cash Risk & Alerts</h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick read on runway and emergency fund health.
          </p>
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
          <div className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(props.cashBalance)}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-600">Monthly burn</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(props.monthlyBurn)}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-600">Estimated runway</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {runwayDays >= 9999 ? "∞" : `${runwayDays} days`}
          </div>
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
            <div
              className="h-2 rounded-full bg-slate-900 transition-[width]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}