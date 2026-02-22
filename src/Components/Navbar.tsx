"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Tab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();

  // Treat "/" as active only when you're exactly on the homepage
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-medium ring-1 transition",
        active
          ? "bg-white/[0.10] text-white ring-white/20"
          : "bg-white/[0.03] text-white/80 ring-white/10 hover:bg-white/[0.07] hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <header className="rounded-3xl bg-white/[0.04] backdrop-blur-xl ring-1 ring-white/10 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-white/[0.08] ring-1 ring-white/10 grid place-items-center font-bold">
            ε
          </div>
          <div>
            <div className="font-semibold leading-tight">Epsilon Finance</div>
            <div className="text-xs text-white/60">
              Cash risk + emergency fund autopilot
            </div>
          </div>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-2">
          <Tab href="/" label="Home" />
          <Tab href="/dashboard" label="Dashboard" />
          <Tab href="/autosave" label="Auto-Save" />
          <Tab href="/transactions" label="Transactions" />
        </nav>

        <div className="flex items-center gap-2">
          <button className="rounded-2xl px-3 py-2 text-sm ring-1 ring-white/10 bg-white/[0.03] hover:bg-white/[0.06]">
            Export
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <nav className="mt-3 flex md:hidden items-center gap-2">
        <Tab href="/" label="Home" />
        <Tab href="/dashboard" label="Dashboard" />
        <Tab href="/autosave" label="Auto-Save" />
        <Tab href="/transactions" label="Transactions" />
      </nav>
    </header>
  );
}