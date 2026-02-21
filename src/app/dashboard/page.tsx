"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";

type Txn = {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number; // + income, - expense
};

type RiskTone = "good" | "warn" | "danger";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** ======= Brand Mark (Simpler Epsilon) ======= */
function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className="relative h-10 w-10 rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-[0_18px_50px_-35px_rgba(255,255,255,0.18)] overflow-hidden grid place-items-center">
        <span className="text-3xl font-semibold leading-none text-white/90">ε</span>
      </div>

      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-wide text-white">Epsilon Finance</div>
        <div className="text-xs text-white/60">Cash risk + emergency fund autopilot</div>
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: RiskTone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 bg-white/10 text-white ring-white/15">
      {children}
    </span>
  );
}

function Card({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.75)]",
        "print:shadow-none print:ring-black/20 print:bg-white print:text-black",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 pt-6">
        <h3 className="text-sm font-semibold text-white/90 print:text-black">{title}</h3>
        {right}
      </div>
      <div className="px-6 pb-6 pt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4 print:bg-white print:ring-black/15">
      <div className="text-xs text-white/60 print:text-black/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white print:text-black">{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/55 print:text-black/60">{sub}</div> : null}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 140;
  const h = 42;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-3 print:bg-white print:ring-black/15">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        <defs>
          <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.55)" />
          </linearGradient>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>
        <polyline
          points={pts}
          fill="none"
          stroke="url(#line)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d={`M0,${h} L${pts.replaceAll(" ", " L")} L${w},${h} Z`} fill="url(#fill)" />
      </svg>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-white/[0.06] ring-1 ring-white/10 overflow-hidden print:bg-black/10 print:ring-black/15">
      <div className="h-full rounded-full bg-white/70 print:bg-black/60" style={{ width: `${clamp(value, 0, 1) * 100}%` }} />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-10 w-10 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/[0.06] transition grid place-items-center print:hidden"
    >
      {children}
    </button>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 22a2.5 2.5 0 0 0 2.3-1.5H9.7A2.5 2.5 0 0 0 12 22Z"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 9.5a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** ======= Gear Icon (Filled silhouette w/ center hole) ======= */
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="rgba(255,255,255,0.88)"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.72 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.84 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z"
      />
      <circle cx="12" cy="12" r="3.6" fill="rgba(0,0,0,0)" />
    </svg>
  );
}

/** ======= Runway-based AutoSave (IF/THEN) ======= */
function autosavePctFromRunway(runwayMonths: number) {
  if (!Number.isFinite(runwayMonths)) return 0.04;
  if (runwayMonths >= 9) return 0.04;
  if (runwayMonths >= 6) return 0.06;
  if (runwayMonths >= 3) return 0.09;
  if (runwayMonths >= 2) return 0.12;
  if (runwayMonths >= 1) return 0.16;
  return 0.2;
}

function autosaveRuleLabel(runwayMonths: number) {
  if (!Number.isFinite(runwayMonths)) return "Stable cashflow → save lightly";
  if (runwayMonths >= 9) return "9+ months runway → save lightly";
  if (runwayMonths >= 6) return "6–9 months runway → save a bit more";
  if (runwayMonths >= 3) return "3–6 months runway → save more";
  if (runwayMonths >= 2) return "2–3 months runway → save aggressively";
  if (runwayMonths >= 1) return "1–2 months runway → save very aggressively";
  return "< 1 month runway → maximum saving";
}

/** ======= Money Input (no arrow stepping, strips leading zeros) ======= */
function MoneyInput({
  value,
  onValueChange,
  min = 0,
  max,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const [text, setText] = useState<string>(String(Math.max(0, Math.trunc(value || 0))));

  useEffect(() => {
    const next = String(Math.max(0, Math.trunc(value || 0)));
    if (next !== text) setText(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function sanitize(raw: string) {
    let s = raw.replace(/[^\d]/g, "");
    s = s.replace(/^0+(?=\d)/, "");
    if (s === "") s = "0";
    return s;
  }

  function commit(nextText: string) {
    const n = Number(nextText);
    if (Number.isNaN(n)) return;

    let v = Math.max(min, n);
    if (max != null) v = Math.min(max, v);
    onValueChange(v);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
          }}
          onChange={(e) => {
            const cleaned = sanitize(e.target.value);
            setText(cleaned);
            commit(cleaned);
          }}
          onBlur={() => {
            const cleaned = sanitize(text);
            setText(cleaned);
            commit(cleaned);
          }}
          className="w-full rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
        />
      </div>

      <div className="hidden md:block text-sm text-white/70 tabular-nums">{formatMoney(value)}</div>
    </div>
  );
}

/** ======= Txn Amount Input (allows +/-; strips leading zeros) ======= */
function AmountInput({
  value,
  onValueChange,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
}) {
  function sanitize(raw: string) {
    // allow optional leading '-' only
    let s = raw.replace(/[^\d-]/g, "");
    // keep only ONE minus and only at start
    s = s.replace(/(?!^)-/g, "");
    // split sign + digits
    const neg = s.startsWith("-");
    const digits = s.replace(/-/g, "").replace(/^0+(?=\d)/, "");
    const out = (neg ? "-" : "") + (digits === "" ? "" : digits);
    return out;
  }

  function onBlurNormalize() {
    let s = sanitize(value);
    if (s === "-" || s === "") s = "0";
    // normalize "-0" to "0"
    if (s === "-0") s = "0";
    onValueChange(s);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
      }}
      onChange={(e) => onValueChange(sanitize(e.target.value))}
      onBlur={onBlurNormalize}
      className="w-full rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35 ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
    />
  );
}

export default function DashboardPage() {
  const [cashBalance, setCashBalance] = useState<number>(48250);
  const [monthlyBurn, setMonthlyBurn] = useState<number>(32000);

  const [activeTab, setActiveTab] = useState<"Dashboard" | "Autopilot" | "Transactions">("Dashboard");

  // ===== NEW: transactions start empty =====
  const [txns, setTxns] = useState<Txn[]>([]);

  // ===== NEW: "Add transaction" form =====
  const [txnName, setTxnName] = useState("");
  const [txnCategory, setTxnCategory] = useState("");
  const [txnAmountText, setTxnAmountText] = useState(""); // user can type 1000 or -1000
  const [txnDateText, setTxnDateText] = useState(""); // optional, e.g. "Feb 21"

  const runwayMonths = useMemo(() => (monthlyBurn <= 0 ? Infinity : cashBalance / monthlyBurn), [cashBalance, monthlyBurn]);

  const runwayDays = useMemo(() => {
    if (!Number.isFinite(runwayMonths)) return Infinity;
    return Math.max(0, Math.floor(runwayMonths * 30));
  }, [runwayMonths]);

  const depletionDate = useMemo(() => {
    if (!Number.isFinite(runwayDays) || runwayDays === Infinity) return null;
    return addDays(new Date(), runwayDays);
  }, [runwayDays]);

  const risk = useMemo(() => {
    const r = runwayMonths;

    if (!Number.isFinite(r))
      return {
        tone: "good" as const,
        label: "Stable",
        headline: "Cash inflow covers spending",
        msg: "You’re not burning cash right now.",
      };

    if (r >= 6)
      return {
        tone: "good" as const,
        label: "Stable",
        headline: "You have a healthy runway",
        msg: "Keep spending steady and keep building your emergency buffer.",
      };

    if (r >= 3)
      return {
        tone: "warn" as const,
        label: "Watch",
        headline: "Runway is tightening",
        msg: "Reduce optional spend and collect receivables faster.",
      };

    return {
      tone: "danger" as const,
      label: "Act",
      headline: "Runway is low",
      msg: "Cut discretionary spend and focus on getting paid faster.",
    };
  }, [runwayMonths]);

  const safetyFundGoal = useMemo(() => Math.max(0, monthlyBurn * 3), [monthlyBurn]);
  const safetyFundProgress = useMemo(() => (safetyFundGoal <= 0 ? 1 : cashBalance / safetyFundGoal), [cashBalance, safetyFundGoal]);
  const safetyFundGap = useMemo(() => Math.max(0, safetyFundGoal - cashBalance), [safetyFundGoal, cashBalance]);

  // inflows derived from user-entered transactions
  const inflowsLast30 = useMemo(() => txns.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0), [txns]);

  const autopilotPct = useMemo(() => autosavePctFromRunway(runwayMonths), [runwayMonths]);
  const autopilotRuleText = useMemo(() => autosaveRuleLabel(runwayMonths), [runwayMonths]);
  const autoSaveEstimate = useMemo(() => Math.round(inflowsLast30 * autopilotPct), [inflowsLast30, autopilotPct]);

  const kpiTrend = useMemo(() => {
    const base = cashBalance / 1000;
    const burn = monthlyBurn / 10000;
    return Array.from({ length: 12 }, (_, i) => base + Math.sin(i / 2) * 1.6 - burn * (i / 7));
  }, [cashBalance, monthlyBurn]);

  // ===== Ask Epsilon: WORKING (local-only demo chat) =====
  type ChatMsg = { id: string; who: "bot" | "user"; text: string };
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      id: "m1",
      who: "bot",
      text: `At your current burn rate, you have about ${Number.isFinite(runwayMonths) ? `${runwayDays} days` : "∞"} of runway. Want a simple plan for what to do next?`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length]);

  function botReply(userText: string) {
    const t = userText.toLowerCase();

    if (t.includes("runway") || t.includes("last") || t.includes("how long") || t.includes("depletion") || t.includes("bankrupt")) {
      const dd = depletionDate ? formatShortDate(depletionDate) : null;
      if (!Number.isFinite(runwayMonths)) {
        return `You’re not burning cash right now. Cash inflow covers spending, so runway is effectively unlimited at the moment.`;
      }
      return `Runway is about ${runwayDays} days (≈${runwayMonths.toFixed(
        1
      )} months). With bank balance ${formatMoney(cashBalance)} and monthly burn ${formatMoney(monthlyBurn)}, projected depletion is ${dd ?? "N/A"}.`;
    }

    if (t.includes("autosave") || t.includes("auto-save") || t.includes("autopilot") || t.includes("move") || t.includes("%")) {
      return `Autopilot is automatic now: it saves more when runway is shorter. Current rule: ${autopilotRuleText}. That means reserving about ${formatPct(
        autopilotPct
      )} of income. With income ${formatMoney(inflowsLast30)} this month, it would reserve about ${formatMoney(autoSaveEstimate)}.`;
    }

    if (t.includes("transaction") || t.includes("income") || t.includes("expense") || t.includes("spent")) {
      return `You currently have ${txns.length} saved transaction(s). Add income as positive (e.g. 1200) and expenses as negative (e.g. -450).`;
    }

    return 'Ask me: “How long is my runway?”, “What’s my depletion date?”, or “How does autopilot work?”';
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, who: "user", text };
    const reply: ChatMsg = { id: `b_${Date.now() + 1}`, who: "bot", text: botReply(text) };

    setChat((prev) => [...prev, userMsg, reply]);
    setChatInput("");
  }

  function addTxn() {
    const name = txnName.trim();
    const category = txnCategory.trim() || "General";
    const amt = Number(txnAmountText);

    if (!name) return;
    if (!Number.isFinite(amt)) return;

    const date = (txnDateText.trim() || formatShortDate(new Date())).slice(0, 20);

    const t: Txn = {
      id: `t_${Date.now()}`,
      date,
      name,
      category,
      amount: Math.trunc(amt),
    };

    setTxns((prev) => [t, ...prev]);

    setTxnName("");
    setTxnCategory("");
    setTxnAmountText("");
    setTxnDateText("");
  }

  function removeTxn(id: string) {
    setTxns((prev) => prev.filter((t) => t.id !== id));
  }

  const showAlertBanner = risk.tone === "warn" || risk.tone === "danger";

  return (
    <main className="min-h-screen bg-black text-white print:bg-white print:text-black">
      {/* Background */}
      <div className="fixed inset-0 -z-10 print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_25%_0%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(900px_circle_at_75%_35%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(800px_circle_at_50%_95%,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {/* TOP BAR */}
        <header className="rounded-3xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 shadow-[0_30px_90px_-70px_rgba(0,0,0,0.9)] print:bg-white print:ring-black/15 print:shadow-none">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
            <BrandMark />

            <div className="flex flex-wrap items-center gap-2">
              <TabBox active={activeTab === "Dashboard"} label="Dashboard" onClick={() => setActiveTab("Dashboard")} />
              <TabBox active={activeTab === "Autopilot"} label="Auto-Save" onClick={() => setActiveTab("Autopilot")} />
              <TabBox active={activeTab === "Transactions"} label="Transactions" onClick={() => setActiveTab("Transactions")} />
            </div>

            <div className="flex items-center gap-2 md:justify-end">
              <IconButton label="Alerts" onClick={() => {}}>
                <BellIcon />
              </IconButton>

              <IconButton label="Settings" onClick={() => {}}>
                <GearIcon />
              </IconButton>

              <button className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-semibold shadow-[0_18px_50px_-30px_rgba(255,255,255,0.35)] hover:bg-white/90 transition print:shadow-none">
                Export
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT + SIDE ASK EPSILON */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* MAIN */}
          <div className="space-y-6">
            {/* Title */}
            <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-[0_30px_90px_-70px_rgba(0,0,0,0.9)] print:bg-white print:ring-black/15 print:shadow-none">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-white/60 print:text-black/60">{activeTab}</div>
                  <div className="mt-1 text-2xl font-semibold text-white tracking-tight print:text-black">
                    Cash Survival Dashboard + Emergency Fund Autopilot
                  </div>
                </div>
                <Pill tone={risk.tone}>{risk.label}</Pill>
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-xs text-white/60 print:text-black/60">
                  Epsilon makes small-business finance more accessible by giving you CFO-level clarity: runway, risk, and an automated emergency buffer.
                </div>

                {showAlertBanner && (
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 ring-1",
                      risk.tone === "danger" ? "bg-white/[0.06] ring-white/15" : "bg-white/[0.05] ring-white/12"
                    )}
                  >
                    <div className="text-xs text-white/60">Runway Alert</div>

                    <div className="mt-1 text-sm text-white/90">
                      {Number.isFinite(runwayMonths) ? (
                        <>
                          At your current burn, you have about <span className="font-semibold">{runwayDays} days</span> left
                          {depletionDate ? (
                            <>
                              {" "}
                              (projected depletion: <span className="font-semibold">{formatShortDate(depletionDate)}</span>)
                            </>
                          ) : null}
                          .
                        </>
                      ) : (
                        <>You’re not burning cash right now.</>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-white/60">
                      Autopilot automatically increases saving as runway gets shorter, so you’re protected before problems hit.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card title="Cash available (bank balance)" right={<Pill tone={risk.tone}>{risk.label}</Pill>}>
                <div className="text-xs text-white/60 print:text-black/60">Cash you can use right now. (Demo numbers)</div>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-3xl font-semibold tracking-tight text-white print:text-black">{formatMoney(cashBalance)}</div>
                    <div className="mt-1 text-xs text-white/60 print:text-black/60">Available cash today</div>
                  </div>
                  <Sparkline values={kpiTrend} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-white/60 print:text-black/60">
                    <span>Emergency buffer target (3 months)</span>
                    <span className="text-white font-medium print:text-black">{formatMoney(safetyFundGoal)}</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={safetyFundProgress} />
                  </div>
                </div>
              </Card>

              <Card title="Burn rate & runway">
                <div className="text-xs text-white/60 print:text-black/60">What it costs each month to keep your business running.</div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label="Monthly burn" value={formatMoney(monthlyBurn)} sub="Last 30 days (demo)" />
                  <Stat
                    label="Runway remaining"
                    value={Number.isFinite(runwayMonths) ? `${runwayDays} days` : "∞"}
                    sub={
                      Number.isFinite(runwayMonths)
                        ? `Projected depletion: ${depletionDate ? formatShortDate(depletionDate) : "N/A"}`
                        : risk.msg
                    }
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <ControlRow label="Bank amount ($)">
                    <MoneyInput value={cashBalance} onValueChange={setCashBalance} min={0} />
                  </ControlRow>

                  <ControlRow label="Spend amount ($)">
                    <MoneyInput value={monthlyBurn} onValueChange={setMonthlyBurn} min={0} />
                  </ControlRow>
                </div>

                <div className="mt-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4 print:bg-white print:ring-black/15">
                  <div className="text-xs text-white/60 print:text-black/60">CFO note</div>
                  <div className="mt-1 text-sm text-white/85 print:text-black/80">{risk.msg}</div>
                </div>
              </Card>

              <Card title="Emergency Fund Autopilot">
                <div className="text-xs text-white/60 print:text-black/60">
                  Automatic: it saves less when runway is long, and saves more when runway gets short.
                </div>

                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4 print:bg-white print:ring-black/15">
                    <div className="text-xs text-white/60 print:text-black/60">Autopilot rule (runway-based)</div>
                    <div className="mt-1 text-lg font-semibold text-white print:text-black">
                      Reserve {formatPct(autopilotPct)} of income
                    </div>
                    <div className="mt-1 text-xs text-white/60 print:text-black/60">{autopilotRuleText}</div>
                    <div className="mt-2 text-xs text-white/60 print:text-black/60">
                      Estimated reserve this month:{" "}
                      <span className="font-medium text-white print:text-black">{formatMoney(autoSaveEstimate)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4 print:bg-white print:ring-black/15">
                    <div className="text-xs text-white/60 print:text-black/60">Buffer gap</div>
                    <div className="mt-1 text-2xl font-semibold text-white print:text-black">{formatMoney(safetyFundGap)}</div>
                    <div className="mt-1 text-xs text-white/60 print:text-black/60">To reach a 3-month emergency buffer.</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ===== NEW: Recent transactions (empty + user add/subtract) ===== */}
            <Card title="Recent transactions (add income / subtract expenses)">
              <div className="text-xs text-white/60 print:text-black/60">
                Start empty and add your own. Income is positive (e.g. 1200). Expenses are negative (e.g. -450).
              </div>

              {/* Add form */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  value={txnName}
                  onChange={(e) => setTxnName(e.target.value)}
                  placeholder="Name (required)"
                  className="w-full rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35 ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
                />

                <input
                  value={txnCategory}
                  onChange={(e) => setTxnCategory(e.target.value)}
                  placeholder="Category (optional)"
                  className="w-full rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35 ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
                />

                <AmountInput value={txnAmountText} onValueChange={setTxnAmountText} placeholder="Amount (+/-)" />

                <div className="flex gap-2">
                  <input
                    value={txnDateText}
                    onChange={(e) => setTxnDateText(e.target.value)}
                    placeholder="Date (optional)"
                    className="w-full rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35 ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
                  />
                  <button
                    onClick={addTxn}
                    className="shrink-0 rounded-2xl bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10 print:ring-black/15">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.03] text-white/70 print:bg-black/5 print:text-black/70">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">What</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                      <th className="px-4 py-3 text-right font-semibold">Remove</th>
                    </tr>
                  </thead>

                  <tbody className="bg-transparent">
                    {txns.length === 0 ? (
                      <tr className="border-t border-white/10 print:border-black/15">
                        <td className="px-4 py-5 text-white/55 print:text-black/60" colSpan={5}>
                          No transactions yet. Add your first income or expense above.
                        </td>
                      </tr>
                    ) : (
                      txns.map((t) => (
                        <tr key={t.id} className="border-t border-white/10 print:border-black/15">
                          <td className="px-4 py-3 text-white/65 print:text-black/70">{t.date}</td>
                          <td className="px-4 py-3 text-white font-medium print:text-black">{t.name}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10 print:bg-black/5 print:text-black/80 print:ring-black/15">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-white print:text-black">{formatMoney(t.amount)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeTxn(t.id)}
                              className="rounded-xl bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/[0.10] transition"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary stats */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Stat label="Income (sum)" value={formatMoney(inflowsLast30)} sub="Based on your entered transactions" />
                <Stat label="Autopilot reserve (est.)" value={formatMoney(autoSaveEstimate)} sub={`Uses ${formatPct(autopilotPct)} rule`} />
                <Stat label="Cash risk" value={risk.label} sub={risk.msg} />
              </div>
            </Card>
          </div>

          {/* SIDE: ASK EPSILON */}
          <aside className="lg:sticky lg:top-6 h-fit print:hidden">
            <section className="rounded-3xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.75)] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5">
                <h3 className="text-sm font-semibold text-white/90">Ask Epsilon (AI CFO)</h3>
                <span className="text-xs text-white/55">Beginner-friendly</span>
              </div>

              <div className="px-5 pb-5 pt-4 space-y-3">
                <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/60">Status</div>
                    <Pill tone={risk.tone}>{risk.label}</Pill>
                  </div>
                  <div className="mt-2 text-sm text-white/85">{risk.headline}</div>
                  <div className="mt-1 text-xs text-white/60">{risk.msg}</div>

                  {Number.isFinite(runwayMonths) && (
                    <div className="mt-2 text-xs text-white/60">
                      Runway: <span className="text-white/85 font-medium">{runwayDays} days</span>
                      {depletionDate ? (
                        <>
                          {" "}
                          • Depletion: <span className="text-white/85 font-medium">{formatShortDate(depletionDate)}</span>
                        </>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-white/60">
                    Autopilot: <span className="text-white/85 font-medium">{formatPct(autopilotPct)}</span> ({autopilotRuleText})
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-3">
                  <div className="text-xs text-white/60">Chat</div>
                  <div className="mt-3 max-h-[340px] overflow-auto pr-1 space-y-2 text-sm">
                    {chat.map((m) => (
                      <Bubble key={m.id} who={m.who}>
                        {m.text}
                      </Bubble>
                    ))}
                    <div ref={endRef} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    placeholder='Try: "How does autopilot work?"'
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChat();
                    }}
                    className="w-full rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/40 ring-1 ring-white/10"
                  />
                  <button onClick={sendChat} className="rounded-2xl bg-white text-black px-3 py-2 text-sm font-semibold hover:bg-white/90 transition">
                    Send
                  </button>
                </div>

                <div className="text-[11px] text-white/45">Demo chat (no API yet). Later you can connect this to your AI route.</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function TabBox({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-medium ring-1 transition",
        active ? "bg-white/[0.08] text-white ring-white/15" : "bg-white/[0.02] text-white/80 ring-white/10 hover:bg-white/[0.06] hover:text-white",
        "print:bg-white print:text-black print:ring-black/15"
      )}
    >
      {label}
    </button>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs font-medium text-white/60 print:text-black/60">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Bubble({ who, children }: { who: "bot" | "user"; children: React.ReactNode }) {
  const mine = who === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3 py-2 text-sm ring-1",
          mine ? "bg-white/[0.08] text-white ring-white/10" : "bg-white/[0.04] text-white/90 ring-white/10"
        )}
      >
        {children}
      </div>
    </div>
  );
}