import Link from "next/link";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
}: {
  x: string;
  y: string;
  size: number;
  label: string;
  glow: string; // tailwind shadow + ring
  floatClass: string; // tailwind animation class
  delay: string;
  duration: string;
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
      <div className="relative z-10 text-white/90 font-semibold" style={{ fontSize: Math.max(18, Math.floor(size * 0.36)) }}>
        {label}
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        {/* Neon glow blobs */}
        <div className="absolute -top-56 -left-56 h-[820px] w-[820px] rounded-full bg-emerald-500/25 blur-[150px] animate-pulse" />
        <div className="absolute -bottom-64 -right-64 h-[920px] w-[920px] rounded-full bg-cyan-500/20 blur-[170px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[700px] w-[700px] rounded-full bg-fuchsia-500/14 blur-[170px] animate-pulse" />

        {/* Moving grid (CSS-free: use background-position animation via Tailwind arbitrary values) */}
        <div
          className={cn(
            "absolute inset-0 opacity-30",
            "bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)]",
            "bg-[size:64px_64px]",
            "animate-[gridPan_18s_linear_infinite]"
          )}
          style={{
            // mask without styled-jsx
            WebkitMaskImage: "radial-gradient(circle at 50% 35%, black 0%, transparent 68%)",
            maskImage: "radial-gradient(circle at 50% 35%, black 0%, transparent 68%)",
          }}
        />

        {/* Stock/crypto chart lines */}
        <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 700" fill="none">
          {/* Candlestick-ish ticks */}
          {Array.from({ length: 34 }).map((_, i) => {
            const x = 30 + i * 34;
            const top = 140 + ((i * 19) % 160);
            const bot = top + 40 + ((i * 23) % 90);
            const color =
              i % 3 === 0 ? "rgba(34,211,238,0.40)" : i % 3 === 1 ? "rgba(16,185,129,0.34)" : "rgba(217,70,239,0.22)";
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

          {/* dots */}
          {Array.from({ length: 18 }).map((_, i) => {
            const cx = 80 + i * 62;
            const cy = 160 + ((i * 47) % 360);
            const fill =
              i % 3 === 0 ? "rgba(34,211,238,0.60)" : i % 3 === 1 ? "rgba(16,185,129,0.52)" : "rgba(217,70,239,0.36)";
            return <circle key={i} cx={cx} cy={cy} r="3.2" fill={fill} />;
          })}
        </svg>

        {/* Floating coins */}
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
          glow="shadow-[0_0_40px_rgba(16,185,129,0.22)]"
          floatClass="animate-[floatY_16s_ease-in-out_infinite]"
          delay="1.2s"
          duration="16s"
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
        <Coin
          x="60%"
          y="40%"
          size={64}
          label="Ξ"
          glow="shadow-[0_0_38px_rgba(217,70,239,0.16)]"
          floatClass="animate-[floatY_17s_ease-in-out_infinite]"
          delay="1.6s"
          duration="17s"
        />
      </div>

      {/* FOREGROUND */}
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <main className="w-full max-w-3xl rounded-3xl border border-white/15 bg-black/55 p-10 text-center shadow-2xl backdrop-blur-xl sm:p-14">
          <div className="mx-auto inline-flex items-center gap-3 select-none">
            <div className="h-11 w-11 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center">
              <span className="text-3xl font-semibold leading-none text-white">ε</span>
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold tracking-wide text-white">Epsilon Finance</div>
              <div className="text-xs text-white/60">Cash risk + emergency fund autopilot</div>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            CFO-level clarity — without the finance degree.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-white/70">
            See how long your cash lasts, get risk alerts, and automatically build an emergency buffer.
            Ask Epsilon gives you simple “what do I do next?” guidance.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">Runway</span>
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">Risk</span>
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">Auto-Save</span>
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 text-white/90">Ask Epsilon</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Open Dashboard
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white/10 px-6 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Try Ask Epsilon
            </Link>
          </div>

          <p className="mt-8 text-xs text-white/45">Demo build — no bank connection yet.</p>
        </main>
      </div>

      {/* Keyframes WITHOUT styled-jsx:
          Put these in globals.css (one-time). */}
      {/* NOTE: See instructions below */}
    </div>
  );
}