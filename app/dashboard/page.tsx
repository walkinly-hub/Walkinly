"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type DashboardState =
  | { status: "loading" }
  | { status: "no-access"; email: string }
  | { status: "ready"; email: string; salonName: string };

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: "loading",
  });

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin");
        return;
      }

      const email = user.email ?? "Unbekannte E-Mail-Adresse";
      const { data: membership } = await supabase
        .from("salon_members")
        .select("salon_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        setDashboardState({ status: "no-access", email });
        return;
      }

      const { data: salon } = await supabase
        .from("salons")
        .select("name")
        .eq("id", membership.salon_id)
        .maybeSingle();

      setDashboardState({
        status: "ready",
        email,
        salonName: salon?.name ?? "Dein Salon",
      });
    }

    loadDashboard();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  if (dashboardState.status === "loading") {
    return null;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">Walkinly</p>

        {dashboardState.status === "no-access" ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Zugang wird eingerichtet
            </h1>
            <p className="mt-3 text-zinc-500">
              Für {dashboardState.email} ist noch kein Salon freigegeben.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              {dashboardState.salonName}
            </h1>
            <p className="mt-3 text-zinc-500">
              Du bist als {dashboardState.email} angemeldet.
            </p>
            <p className="mt-6 text-zinc-500">
              Die Queue-Verwaltung wird als nächster Schritt hier angezeigt.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 w-full rounded-2xl border border-zinc-200 py-3 font-semibold text-foreground hover:bg-zinc-50 transition"
        >
          Abmelden
        </button>
      </section>
    </main>
  );
}
