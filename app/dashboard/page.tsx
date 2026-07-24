"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type DashboardState =
  | { status: "loading" }
  | { status: "no-access"; email: string }
  | {
      status: "ready";
      email: string;
      salonId: string;
      salonName: string;
      isChairOccupied: boolean;
    };

type QueueEntry = {
  entry_id: string;
  customer_name: string;
  queue_position: number;
  checked_in_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: "loading",
  });
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [servingEntryId, setServingEntryId] = useState<string | null>(null);
  const [isUpdatingChair, setIsUpdatingChair] = useState(false);

  const loadQueue = useCallback(async (salonId: string, isBackgroundUpdate = false) => {
    if (!isBackgroundUpdate) {
      setIsQueueLoading(true);
    }
    setQueueError(null);

    const { data, error } = await supabase
      .rpc("get_staff_queue", { p_salon_id: salonId })
      .returns<QueueEntry[]>();

    if (!isBackgroundUpdate) {
      setIsQueueLoading(false);
    }

    if (error || !Array.isArray(data)) {
      setQueueError("Die Warteschlange konnte nicht geladen werden.");
      return;
    }

    setQueueEntries(data as QueueEntry[]);
  }, []);

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
        .select("name, current_service_started_at")
        .eq("id", membership.salon_id)
        .maybeSingle();

      setDashboardState({
        status: "ready",
        email,
        salonId: membership.salon_id,
        salonName: salon?.name ?? "Dein Salon",
        isChairOccupied: salon?.current_service_started_at !== null,
      });

      await loadQueue(membership.salon_id);
    }

    loadDashboard();
  }, [loadQueue, router]);

  useEffect(() => {
    if (dashboardState.status !== "ready") {
      return;
    }

    const salonId = dashboardState.salonId;
    const intervalId = window.setInterval(() => {
      void loadQueue(salonId, true);
    }, 5_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadQueue(salonId, true);
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [dashboardState, loadQueue]);

  async function handleServe(entryId: string) {
    if (dashboardState.status !== "ready") {
      return;
    }

    setServingEntryId(entryId);
    setQueueError(null);

    const { error } = await supabase.rpc("serve_queue_entry", {
      p_entry_id: entryId,
    });

    setServingEntryId(null);

    if (error) {
      setQueueError("Der Kunde konnte nicht als bedient markiert werden.");
      return;
    }

    setDashboardState((current) =>
      current.status === "ready"
        ? { ...current, isChairOccupied: true }
        : current,
    );
    await loadQueue(dashboardState.salonId);
  }

  async function handleChairToggle() {
    if (dashboardState.status !== "ready") {
      return;
    }

    setIsUpdatingChair(true);
    setQueueError(null);

    const { error } = await supabase.rpc("set_salon_busy", {
      p_salon_id: dashboardState.salonId,
      p_is_busy: !dashboardState.isChairOccupied,
    });

    setIsUpdatingChair(false);

    if (error) {
      setQueueError("Der Stuhlstatus konnte nicht geändert werden.");
      return;
    }

    setDashboardState((current) =>
      current.status === "ready"
        ? { ...current, isChairOccupied: !current.isChairOccupied }
        : current,
    );
  }

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

            <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
              <p className="text-sm font-medium">
                {dashboardState.isChairOccupied ? "Stuhl besetzt" : "Stuhl frei"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Nutze dies für Kunden, die direkt auf dem Stuhl Platz nehmen.
              </p>
              <button
                type="button"
                onClick={handleChairToggle}
                disabled={isUpdatingChair || servingEntryId !== null}
                className="mt-4 w-full rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-foreground hover:bg-zinc-100 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingChair
                  ? "Status wird gespeichert..."
                  : dashboardState.isChairOccupied
                    ? "Stuhl freigeben"
                    : "Stuhl besetzen"}
              </button>
            </div>

            <div className="mt-8 border-t border-zinc-100 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Warteschlange</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium">
                  {queueEntries.length} wartend
                </span>
              </div>

              {queueError && (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {queueError}
                </p>
              )}

              {isQueueLoading ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Warteschlange wird geladen...
                </p>
              ) : queueEntries.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Momentan wartet niemand.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {queueEntries.map((entry) => (
                    <li
                      key={entry.entry_id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          #{entry.queue_position} · {entry.customer_name}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Wartet in der Schlange
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleServe(entry.entry_id)}
                        disabled={servingEntryId !== null}
                        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {servingEntryId === entry.entry_id
                          ? "Wird bedient..."
                          : "Bedienen"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
