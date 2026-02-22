// src/lib/finance/cash.ts

export function calcRunwayDays(cashBalance: number, monthlyBurn: number): number | null {
  if (!Number.isFinite(cashBalance) || cashBalance < 0) cashBalance = 0;
  if (!Number.isFinite(monthlyBurn) || monthlyBurn < 0) monthlyBurn = 0;

  // If burn is 0, runway isn't meaningfully defined for this product
  if (monthlyBurn === 0) return null;

  const days = Math.floor((cashBalance / monthlyBurn) * 30);
  return Math.max(0, days);
}

export function calcDepletionDateISO(runwayDays: number | null) {
  if (runwayDays === null) return null;

  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, runwayDays));

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// (Optional) If you still want it elsewhere:
export function calcRiskLabel(runwayDays: number | null): "Stable" | "Watch" | "Act" | "Unknown" {
  if (runwayDays === null) return "Unknown";
  if (runwayDays < 60) return "Act";
  if (runwayDays < 120) return "Watch";
  return "Stable";
}