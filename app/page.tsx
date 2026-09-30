"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import WalkinlyLogo from "@/components/WalkinlyLogo";

export default function Home() {
  useEffect(() => {
    async function testConnection() {
      console.log("🔄 Starte Supabase-Test...");

      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .limit(1);

      if (error) {
        console.error("❌ Supabase Fehler:", error);
      } else {
        console.log("✅ Verbindung erfolgreich!");
        console.log(data);
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <WalkinlyLogo className="h-auto w-44" priority />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-foreground">
          Willkommen bei Walkinly
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Digitale Warteschlangen für entspanntere Salonbesuche.
        </p>
      </section>
    </main>
  );
}
