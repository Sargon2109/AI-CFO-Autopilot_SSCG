"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store/AppStore";
import { calcDepletionDateISO, calcRiskLabel, calcRunwayDays } from "@/lib/finance/cash";

type Msg = { role: "user" | "assistant"; text: string };

export default function AskEpsilonPanel() {
  const { cashBalance, monthlyBurn, autopilotPct, reserveBalance } = useAppStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "I can help you interpret runway, risk, and your emergency buffer. Ask: “What should I do next?”",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const runwayDays = useMemo(() => calcRunwayDays(cashBalance, monthlyBurn), [cashBalance, monthlyBurn]);
  const risk = useMemo(() => calcRiskLabel(runwayDays), [runwayDays]);
  const depletion = useMemo(() => calcDepletionDateISO(runwayDays), [runwayDays]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);

    const context = {
      cashBalance,
      monthlyBurn,
      runwayDays,
      risk,
      depletionDate: depletion,
      autopilotPct,
      reserveBalance,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      setMessages((m) => [...m, { role: "assistant", text: String(data.reply ?? "No reply") }]);
    } catch {
      // Fallback (demo-friendly)
      const fallback = `Runway: ${runwayDays} days (${risk}). Depletion: ${depletion}. Autopilot: ${autopilotPct}%.`;
      setMessages((m) => [...m, { role: "assistant", text: fallback }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Ask Epsilon (AI CFO)</div>
        <span className="text-xs text-white/60">Beginner-friendly</span>
      </div>

      <div className="mt-4 rounded-2xl bg-black/40 ring-1 ring-white/10 p-4">
        <div className="text-xs text-white/60">Status</div>
        <div className="mt-1 font-semibold">{risk === "Act" ? "Runway is low" : risk === "Watch" ? "Runway needs attention" : "Runway looks stable"}</div>
        <div className="mt-2 text-sm text-white/70">
          Runway: <span className="text-white">{runwayDays} days</span> • Depletion:{" "}
          <span className="text-white">{depletion}</span> • Autopilot: <span className="text-white">{autopilotPct}%</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-black/40 ring-1 ring-white/10 p-4">
        <div className="text-xs text-white/60 mb-2">Chat</div>

        <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={[
                  "inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm ring-1",
                  m.role === "user"
                    ? "bg-white text-black ring-white/20"
                    : "bg-white/[0.06] text-white ring-white/10",
                ].join(" ")}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            className="flex-1 rounded-2xl bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm outline-none focus:ring-white/20"
            placeholder='Try: "How does autopilot work?"'
          />
          <button
            onClick={send}
            disabled={sending}
            className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Send
          </button>
        </div>

        <div className="mt-2 text-xs text-white/50">
          Demo chat (API preferred). If API fails, it falls back to basic context output.
        </div>
      </div>
    </section>
  );
}