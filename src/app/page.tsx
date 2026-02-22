"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Inline SVG noise (no external asset) */
function noiseDataUrl() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 .55 0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)" opacity="0.55"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function Coin({
  x,
  y,
  size,
  label,
  glow,
  floatClass,
  delay,
  duration,
  opacity = 1,
}: {
  x: string;
  y: string;
  size: number;
  label: string;
  glow: string;
  floatClass: string;
  delay: string;
  duration: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute grid place-items-center select-none rounded-full",
        "bg-white/5 ring-1 ring-white/15",
        glow,
        floatClass
      )}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        opacity,
        animationDelay: delay,
        animationDuration: duration,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(circle at 60% 70%, rgba(255,255,255,0.08), transparent 60%)",
        }}
      />
      <div
        className="relative z-10 font-semibold"
        style={{
          fontSize: Math.max(18, Math.floor(size * 0.36)),
          color: "rgba(255,255,255,0.72)",
          textShadow: "0 0 10px rgba(0,0,0,0.55)",
        }}
      >
        {label}
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}

export default function Home() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  // Mouse color-shift effect on card (NO parallax / NO micro motion)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setHoverPos({ x, y });
    };

    const onEnter = () => setIsHovering(true);
    const onLeave = () => setIsHovering(false);

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const spotlightStyle = useMemo(
    () => ({
      background: `radial-gradient(600px circle at ${hoverPos.x}% ${hoverPos.y}%, rgba(34,211,238,0.10), transparent 60%)`,
      opacity: isHovering ? 1 : 0,
    }),
    [hoverPos, isHovering]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      {/* BACKGROUND (STATIC — no micro motion) */}
      <div className="pointer-events-none absolute inset-0">
        {/* Neon glow blobs */}
        <div className="absolute -top-56 -left-56 h-[820px] w-[820px] rounded-full bg-emerald-500/25 blur-[150px]" />
        <div className="absolute -bottom-64 -right-64 h-[920px] w-[920px] rounded-full bg-cyan-500/20 blur-[170px]" />
        <div className="absolute top-1/3 -right-40 h-[700px] w-[700px] rounded-full bg-fuchsia-500/14 blur-[170px]" />

        {/* Static grid */}
        <div
          className={cn(
            "absolute inset-0 opacity-30",
            "bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)]",
            "bg-[size:64px_64px]"
          )}
          style={{
            WebkitMaskImage: "radial-gradient(circle at 50% 35%, black 0%, transparent 68%)",
            maskImage: "radial-gradient(circle at 50% 35%, black 0%, transparent 68%)",
          }}
        />

        {/* Chart (STATIC now) */}
        <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 700" fill="none">
          {Array.from({ length: 34 }).map((_, i) => {
            const x = 30 + i * 34;
            const top = 140 + ((i * 19) % 160);
            const bot = top + 40 + ((i * 23) % 90);
            const color =
              i % 3 === 0
                ? "rgba(34,211,238,0.40)"
                : i % 3 === 1
                ? "rgba(16,185,129,0.34)"
                : "rgba(217,70,239,0.22)";
            return <line key={i} x1={x} y1={top} x2={x} y2={bot} stroke={color} strokeWidth="2" />;
          })}

          <path
            d="M0 520 C 180 480, 260 560, 420 520 C 560 480, 700 410, 820 450 C 950 500, 1040 420, 1200 360"
            stroke="rgba(34,211,238,0.55)"
            strokeWidth="3"
          />
          <path
            d="M0 590 C 220 610, 320 520, 520 560 C 720 600, 860 520, 980 540 C 1100 560, 1140 520, 1200 490"
            stroke="rgba(16,185,129,0.45)"
            strokeWidth="2.6"
          />
          <path
            d="M0 230 C 240 160, 360 260, 520 220 C 700 170, 820 260, 1000 210 C 1120 180, 1160 140, 1200 120"
            stroke="rgba(217,70,239,0.28)"
            strokeWidth="2.2"
          />
        </svg>

        {/* Floating coins (still gently floating — not market motion) */}
        <Coin
          x="8%"
          y="18%"
          size={92}
          label="₿"
          glow="shadow-[0_0_40px_rgba(34,211,238,0.25)]"
          floatClass="animate-[floatY_14s_ease-in-out_infinite]"
          delay="0s"
          duration="14s"
        />
        <Coin
          x="78%"
          y="14%"
          size={72}
          label="Ξ"
          glow="shadow-[0_0_40px_rgba(16,185,129,0.18)]"
          floatClass="animate-[floatY_16s_ease-in-out_infinite]"
          delay="1.2s"
          duration="16s"
          opacity={0.22}
        />
        <Coin
          x="14%"
          y="72%"
          size={78}
          label="€"
          glow="shadow-[0_0_40px_rgba(217,70,239,0.18)]"
          floatClass="animate-[floatY_15s_ease-in-out_infinite]"
          delay="0.6s"
          duration="15s"
        />
        <Coin
          x="86%"
          y="74%"
          size={96}
          label="$"
          glow="shadow-[0_0_48px_rgba(34,211,238,0.22)]"
          floatClass="animate-[floatY_18s_ease-in-out_infinite]"
          delay="0.2s"
          duration="18s"
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
          style={{
            backgroundImage: `url(${noiseDataUrl()})`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      {/* FOREGROUND */}
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <main
          ref={cardRef}
          className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-black/55 p-10 text-center shadow-2xl backdrop-blur-xl sm:p-14 overflow-hidden"
        >
          {/* Mouse spotlight color shift */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={spotlightStyle}
          />

          <div className="relative z-10">
            <div className="mx-auto inline-flex items-center gap-3 select-none">
              <div className="h-11 w-11 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center">
                <span className="text-3xl font-semibold leading-none text-white">ε</span>
              </div>
              <div className="text-left leading-tight">
                <div className="text-lg font-semibold tracking-wide text-white sm:text-xl">
                  Epsilon Finance
                </div>
                <div className="text-xs text-white/60">
                  Cash risk + emergency fund autopilot
                </div>
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              CFO-level clarity — without the finance degree.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-white/70">
              See how long your cash lasts, get risk alerts, and automatically build an emergency buffer.
              Ask Epsilon gives you simple “what do I do next?” guidance.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">
                Runway
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">
                Risk
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">
                Auto-Save
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">
                Ask Epsilon
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Open Dashboard
              </Link>
            </div>

            <p className="mt-8 text-xs text-white/45">
              Demo build — no bank connection yet.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}