// app/(app)/layout.tsx
"use client";

import React from "react";
import Navbar from "@/Components/Navbar";
import AskEpsilonPanel from "@/Components/AskEpsilonPanel";
import { AppStoreProvider } from "@/lib/store/AppStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <Navbar />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">{children}</div>
            <aside className="lg:sticky lg:top-6 h-fit">
              <AskEpsilonPanel />
            </aside>
          </div>
        </div>
      </main>
    </AppStoreProvider>
  );
}