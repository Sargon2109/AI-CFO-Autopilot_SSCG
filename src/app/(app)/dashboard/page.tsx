"use client";

import CashAvailableCard from "@/Components/cards/CashAvailableCard";
import BurnRunwayCard from "@/Components/cards/BurnRunwayCard";
import RiskCard from "@/Components/RiskCard";

export default function DashboardPage() {
  return (
    <>
      <CashAvailableCard />
      <BurnRunwayCard />
      <RiskCard />
    </>
  );
}