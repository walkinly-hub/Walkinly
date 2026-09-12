"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

import SalonBrand from "@/components/customer/SalonBrand";
import type { SalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";

type DashboardState =
  | { status: "loading" }
  | { status: "no-access"; email: string }
  | {
      status: "ready";
      email: string;
      salonId: string;
      salonName: string;
      salonSlug: string;
      isChairOccupied: boolean;
      salons: SalonOption[];
    };

type SalonOption = {
  id: string;
  name: string;
  slug: string;
  isChairOccupied: boolean;
};

type DashboardSalon = {
  salon_id: string;
  salon_name: string;
  salon_slug: string;
  current_service_started_at: string | null;
};

type QueueEntry = {
  entry_id: string;
  customer_name: string;
  queue_position: number;
  checked_in_at: string;
};

type UndoAction = {
  id: string;
  message: string;
};

type StatisticsPeriod = 7 | 30 | 90;

type DashboardStatistics = {
  check_ins: number;
  served: number;
  removed: number;
  feedback_count: number;
  average_rating: number | null;
  rating_distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  daily_check_ins: { date: string; count: number }[];
  recent_feedback: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
  }[];
};

type DashboardPageProps = {
  requestedSalonSlug?: string;
  branding?: SalonBranding;
  brandedSalonName?: string;
};

export default function DashboardPage({
  requestedSalonSlug,
  branding,
  brandedSalonName,
}: DashboardPageProps) {
  const router = useRouter();
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: "loading",
  });
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [servingEntryId, setServingEntryId] = useState<string | null>(null);
  const [isUpdatingChair, setIsUpdatingChair] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [statisticsPeriod, setStatisticsPeriod] = useState<StatisticsPeriod>(30);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(false);
  const [isEmbedCodeCopied, setIsEmbedCodeCopied] = useState(false);
  const [whatsAppTestPhone, setWhatsAppTestPhone] = useState("");
  const [whatsAppTestStatus, setWhatsAppTestStatus] = useState<string | null>(null);
  const [isSendingWhatsAppTest, setIsSendingWhatsAppTest] = useState(false);
  const [whatsAppDiagnostics, setWhatsAppDiagnostics] = useState<string | null>(null);
  const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(false);
  const [whatsAppPin, setWhatsAppPin] = useState("");
  const [registrationConfirmed, setRegistrationConfirmed] = useState(false);
  const [isRegisteringWhatsApp, setIsRegisteringWhatsApp] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [registrationSucceeded, setRegistrationSucceeded] = useState(false);

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

  const loadStatistics = useCallback(async (salonId: string, days: StatisticsPeriod) => {
    setIsStatisticsLoading(true);
    setStatisticsError(null);

    const { data, error } = await supabase.rpc("get_dashboard_statistics", {
      p_salon_id: salonId,
      p_days: days,
    });

    setIsStatisticsLoading(false);

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      setStatistics(null);
      setStatisticsError(
        error?.code === "PGRST202"
          ? "Die Statistikfunktion muss zuerst in Supabase aktiviert werden."
          : "Die Statistiken konnten nicht geladen werden.",
      );
      return;
    }

    setStatistics(data as unknown as DashboardStatistics);
  }, []);

  useEffect(() => {
    if (!undoAction) return;
    const timeoutId = window.setTimeout(() => setUndoAction(null), 30_000);
    return () => window.clearTimeout(timeoutId);
  }, [undoAction]);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const nextPath = requestedSalonSlug
          ? `/dashboard/${requestedSalonSlug}`
          : "/dashboard";
        router.replace(`/admin?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      const email = user.email ?? "Unbekannte E-Mail-Adresse";
      const { data: dashboardSalons, error: salonsError } = await supabase
        .rpc("get_dashboard_salons")
        .returns<DashboardSalon[]>();
      const salons = dashboardSalons as DashboardSalon[] | null;

      if (salonsError || !salons || salons.length === 0) {
        setDashboardState({ status: "no-access", email });
        return;
      }

      const salonOptions: SalonOption[] = salons.map((salon) => ({
        id: salon.salon_id,
        name: salon.salon_name,
        slug: salon.salon_slug,
        isChairOccupied: salon.current_service_started_at !== null,
      }));

      const selectedSalon = requestedSalonSlug
        ? salonOptions.find((salon) => salon.slug === requestedSalonSlug)
        : salonOptions[0];

      if (!selectedSalon) {
        setDashboardState({ status: "no-access", email });
        return;
      }

      setDashboardState({
        status: "ready",
        email,
        salonId: selectedSalon.id,
        salonName: selectedSalon.name,
        salonSlug: selectedSalon.slug,
        isChairOccupied: selectedSalon.isChairOccupied,
        salons: salonOptions,
      });

      await loadQueue(selectedSalon.id);
    }

    loadDashboard();
  }, [loadQueue, requestedSalonSlug, router]);

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

  useEffect(() => {
    if (dashboardState.status !== "ready") return;
    const salonId = dashboardState.salonId;
    const timeoutId = window.setTimeout(() => {
      void loadStatistics(salonId, statisticsPeriod);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [dashboardState, loadStatistics, statisticsPeriod]);

  async function handleServe(entryId: string) {
    if (dashboardState.status !== "ready") {
      return;
    }

    setServingEntryId(entryId);
    setQueueError(null);

    let { data: actionId, error } = await supabase.rpc("serve_queue_entry_with_undo", {
      p_entry_id: entryId,
    });

    if (error?.code === "PGRST202") {
      const fallback = await supabase.rpc("serve_queue_entry", { p_entry_id: entryId });
      error = fallback.error;
      actionId = null;
    }

    setServingEntryId(null);

    if (error) {
      setQueueError("Der Kunde konnte nicht als bedient markiert werden.");
      return;
    }

    setDashboardState((current) =>
      current.status === "ready"
        ? {
            ...current,
            isChairOccupied: true,
            salons: current.salons.map((salon) =>
              salon.id === current.salonId
                ? { ...salon, isChairOccupied: true }
                : salon,
            ),
          }
        : current,
    );
    setUndoAction(
      typeof actionId === "string"
        ? { id: actionId, message: "Kunde wurde als bedient markiert." }
        : null,
    );
    await loadQueue(dashboardState.salonId);
  }

  async function handleChairToggle() {
    if (dashboardState.status !== "ready") {
      return;
    }

    setIsUpdatingChair(true);
    setQueueError(null);

    const wasChairOccupied = dashboardState.isChairOccupied;
    let { data: actionId, error } = await supabase.rpc("set_salon_busy_with_undo", {
      p_salon_id: dashboardState.salonId,
      p_is_busy: !dashboardState.isChairOccupied,
    });

    if (error?.code === "PGRST202") {
      const fallback = await supabase.rpc("set_salon_busy", {
        p_salon_id: dashboardState.salonId,
        p_is_busy: !dashboardState.isChairOccupied,
      });
      error = fallback.error;
      actionId = null;
    }

    setIsUpdatingChair(false);

    if (error) {
      setQueueError("Der Stuhlstatus konnte nicht geändert werden.");
      return;
    }

    setDashboardState((current) =>
      current.status === "ready"
        ? {
            ...current,
            isChairOccupied: !current.isChairOccupied,
            salons: current.salons.map((salon) =>
              salon.id === current.salonId
                ? { ...salon, isChairOccupied: !current.isChairOccupied }
                : salon,
            ),
          }
        : current,
    );
    setUndoAction(
      typeof actionId === "string"
        ? {
            id: actionId,
            message: wasChairOccupied ? "Stuhl wurde freigegeben." : "Stuhl wurde besetzt.",
          }
        : null,
    );
  }

  async function handleUndo() {
    if (!undoAction || dashboardState.status !== "ready") return;

    setIsUndoing(true);
    setQueueError(null);
    const { data, error } = await supabase.rpc("undo_dashboard_action", {
      p_action_id: undoAction.id,
    });
    setIsUndoing(false);
    const undoResult = Array.isArray(data)
      ? (data[0] as { action_type: string; is_chair_occupied: boolean } | undefined)
      : undefined;

    if (error || !undoResult) {
      setUndoAction(null);
      setQueueError(error?.message ?? "Die Aktion konnte nicht rückgängig gemacht werden.");
      return;
    }

    const isChairOccupied = undoResult.is_chair_occupied;
    setDashboardState((current) =>
      current.status === "ready"
        ? {
            ...current,
            isChairOccupied,
            salons: current.salons.map((salon) =>
              salon.id === current.salonId ? { ...salon, isChairOccupied } : salon,
            ),
          }
        : current,
    );
    setUndoAction(null);
    setStatistics(null);
    await loadQueue(dashboardState.salonId);
  }

  function selectSalon(salonId: string) {
    if (dashboardState.status !== "ready") {
      return;
    }

    const selectedSalon = dashboardState.salons.find(
      (salon) => salon.id === salonId,
    );

    if (!selectedSalon || selectedSalon.id === dashboardState.salonId) {
      return;
    }

    setQueueEntries([]);
    setQueueError(null);
    setIsEmbedCodeCopied(false);
    setUndoAction(null);
    setStatistics(null);
    setDashboardState({
      ...dashboardState,
      salonId: selectedSalon.id,
      salonName: selectedSalon.name,
      salonSlug: selectedSalon.slug,
      isChairOccupied: selectedSalon.isChairOccupied,
    });
    void loadQueue(selectedSalon.id);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  async function copyEmbedCode(salonSlug: string) {
    const embedUrl = `https://www.walkinly.ch/embed/${salonSlug}`;
    const embedCode = `<iframe src="${embedUrl}" title="Walkinly Warteschlange" width="100%" height="300" style="border: 0; max-width: 480px;" loading="lazy"></iframe>`;

    await navigator.clipboard.writeText(embedCode);
    setIsEmbedCodeCopied(true);
    window.setTimeout(() => setIsEmbedCodeCopied(false), 2_000);
  }

  async function sendWhatsAppTestMessage() {
    setWhatsAppTestStatus(null);
    setIsSendingWhatsAppTest(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ recipientPhone: whatsAppTestPhone }),
      });
      const result = (await response.json()) as { error?: string; reference?: string };

      setWhatsAppTestStatus(
        response.ok
          ? `Erinnerungsvorlage wurde an Meta zur Zustellung übergeben. Die Zustellung ist noch nicht bestätigt.${result.reference ? ` Prüf-ID: ${result.reference}.` : ""} Bitte den Eingang in WhatsApp prüfen.`
          : result.error ?? "Die Testnachricht konnte nicht gesendet werden.",
      );
    } catch {
      setWhatsAppTestStatus("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSendingWhatsAppTest(false);
    }
  }

  async function registerWhatsAppNumber() {
    if (!/^\d{6}$/.test(whatsAppPin) || !registrationConfirmed || isRegisteringWhatsApp) return;
    setIsRegisteringWhatsApp(true);
    setRegistrationStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/whatsapp/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ pin: whatsAppPin, confirmed: registrationConfirmed }),
      });
      const result = await response.json();
      if (response.ok && result.success === true) {
        setRegistrationSucceeded(true);
        setRegistrationStatus("Nummer registriert. Jetzt kannst du unten die Testnachricht senden.");
      } else {
        setRegistrationStatus(result.error ?? "Registrierung nicht bestätigt. Bitte Nummernstatus bei Meta prüfen.");
      }
    } catch {
      setRegistrationStatus("Verbindung fehlgeschlagen. Bitte vor erneutem Registrieren den Nummernstatus bei Meta prüfen.");
    } finally {
      setWhatsAppPin("");
      setIsRegisteringWhatsApp(false);
    }
  }

  async function checkWhatsAppConnection() {
    setIsCheckingWhatsApp(true);
    setWhatsAppDiagnostics(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/whatsapp/diagnostics", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        cache: "no-store",
      });
      const result = await response.json() as { report?: string; error?: string };
      setWhatsAppDiagnostics(response.ok ? result.report ?? "Keine Diagnose erhalten." : result.error ?? "Diagnose fehlgeschlagen.");
    } catch {
      setWhatsAppDiagnostics("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsCheckingWhatsApp(false);
    }
  }

  if (dashboardState.status === "loading") {
    return null;
  }

  const themeStyle = branding
    ? ({
        "--background": branding.backgroundColor,
        "--foreground": branding.foregroundColor,
        "--card": branding.surfaceColor,
        "--primary": branding.primaryColor,
        "--primary-hover": branding.primaryHoverColor,
        "--primary-foreground": branding.primaryForegroundColor,
        "--border": branding.borderColor,
        "--muted-foreground": branding.mutedForegroundColor,
      } as CSSProperties & Record<`--${string}`, string>)
    : undefined;

  return (
    <main
      className="min-h-screen bg-background px-4 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-10"
      style={themeStyle}
    >
      <section className="mx-auto w-full max-w-7xl rounded-3xl bg-card p-5 shadow-sm sm:p-7 lg:p-10">
        {branding && brandedSalonName ? (
          <SalonBrand
            salonName={brandedSalonName}
            logoUrl={branding.logoUrl}
            logoInverted={branding.logoInverted}
          />
        ) : (
          <p className="text-sm font-medium text-primary">Walkinly</p>
        )}

        {dashboardState.status === "no-access" ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Zugang wird eingerichtet
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Für {dashboardState.email} ist noch kein Salon freigegeben.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {branding ? "Salon-Dashboard" : dashboardState.salonName}
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Du bist als {dashboardState.email} angemeldet.
            </p>

            {!requestedSalonSlug && dashboardState.salons.length > 1 && (
              <label className="mt-6 block max-w-sm text-sm font-medium text-foreground">
                Salon auswählen
                <select
                  value={dashboardState.salonId}
                  onChange={(event) => selectSalon(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-3 text-base font-semibold text-foreground"
                >
                  {dashboardState.salons.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Live-Betrieb
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Warteschlangen-Management
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--background)] px-4 py-2 text-sm font-semibold">
                  {queueEntries.length} wartend
                </span>
              </div>

              {queueError && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {queueError}
                </p>
              )}

              <div className="mt-5 grid items-start gap-5 lg:grid-cols-3">
                <section className="min-w-0 rounded-2xl border border-[var(--border)] p-4 sm:p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">Warteschlange</h3>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Aktualisiert automatisch
                    </span>
                  </div>

                  {isQueueLoading ? (
                    <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                      Warteschlange wird geladen...
                    </p>
                  ) : queueEntries.length === 0 ? (
                    <div className="mt-4 rounded-2xl bg-[var(--background)] p-6 text-center sm:p-8">
                      <p className="font-semibold">Momentan wartet niemand.</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Neue Check-ins erscheinen automatisch hier.
                      </p>
                    </div>
                  ) : (
                    <ul className="mt-4 grid gap-3 xl:grid-cols-2">
                      {queueEntries.map((entry) => (
                        <li
                          key={entry.entry_id}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-[var(--background)] p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              #{entry.queue_position} · {entry.customer_name}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                              Wartet in der Schlange
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleServe(entry.entry_id)}
                            disabled={servingEntryId !== null}
                            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {servingEntryId === entry.entry_id
                              ? "Wird bedient..."
                              : "Bedienen"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <aside className="min-w-0 space-y-4 lg:sticky lg:top-8">
                  <div
                    className={`rounded-2xl p-5 transition-colors ${
                      dashboardState.isChairOccupied
                        ? "bg-primary text-[var(--primary-foreground)]"
                        : "border border-[var(--border)] bg-[var(--background)] text-foreground"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
                      Stuhlstatus
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {dashboardState.isChairOccupied ? "Stuhl besetzt" : "Stuhl frei"}
                    </p>
                    <p
                      className={`mt-2 text-sm ${
                        dashboardState.isChairOccupied
                          ? "text-[var(--primary-foreground)] opacity-80"
                          : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      Nutze dies für Kunden, die direkt auf dem Stuhl Platz nehmen.
                    </p>
                    <button
                      type="button"
                      onClick={handleChairToggle}
                      disabled={isUpdatingChair || servingEntryId !== null}
                      aria-pressed={dashboardState.isChairOccupied}
                      className={`mt-5 w-full rounded-xl border py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
                        dashboardState.isChairOccupied
                          ? "border-[var(--card)] bg-[var(--card)] text-primary"
                          : "border-primary bg-primary text-[var(--primary-foreground)]"
                      }`}
                    >
                      {isUpdatingChair
                        ? "Status wird gespeichert..."
                        : dashboardState.isChairOccupied
                          ? "Stuhl freigeben"
                          : "Stuhl besetzen"}
                    </button>
                  </div>

                  {undoAction && (
                    <div
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-card p-3 shadow-sm"
                      role="status"
                    >
                      <p className="text-sm text-foreground">{undoAction.message}</p>
                      <button
                        type="button"
                        onClick={() => void handleUndo()}
                        disabled={isUndoing}
                        className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60"
                      >
                        {isUndoing ? "Wird rückgängig..." : "Rückgängig"}
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Meine Statistiken</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Digitale Nachfrage und Kundenfeedback
                  </p>
                </div>
                <select
                  value={statisticsPeriod}
                  onChange={(event) =>
                    setStatisticsPeriod(Number(event.target.value) as StatisticsPeriod)
                  }
                  aria-label="Statistikzeitraum"
                  className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-semibold"
                >
                  <option value={7}>7 Tage</option>
                  <option value={30}>30 Tage</option>
                  <option value={90}>90 Tage</option>
                </select>
              </div>

              {isStatisticsLoading ? (
                <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                  Statistiken werden geladen...
                </p>
              ) : statisticsError ? (
                <p className="mt-4 rounded-xl bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
                  {statisticsError}
                </p>
              ) : statistics ? (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Check-ins", statistics.check_ins],
                      ["Bedient", statistics.served],
                      ["Entfernt", statistics.removed],
                      ["Bewertungen", statistics.feedback_count],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-[var(--background)] p-4">
                        <p className="text-2xl font-semibold">{value}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--background)] p-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">Digitale Check-ins</h3>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          Letzte 7 Tage
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{statistics.check_ins} im Zeitraum</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {statistics.daily_check_ins.slice(-7).map((day) => {
                        const maximum = Math.max(
                          1,
                          ...statistics.daily_check_ins.slice(-7).map((item) => item.count),
                        );
                        return (
                          <div key={day.date} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-xs">
                            <span>{new Intl.DateTimeFormat("de-CH", { weekday: "short", day: "2-digit" }).format(new Date(`${day.date}T12:00:00`))}</span>
                            <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(day.count / maximum) * 100}%` }}
                              />
                            </div>
                            <span className="text-right font-semibold">{day.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[var(--background)] p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold">Feedback</h3>
                      <p className="text-xl font-semibold">
                        {statistics.average_rating === null
                          ? "–"
                          : `${Number(statistics.average_rating).toFixed(1)} ★`}
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {([5, 4, 3, 2, 1] as const).map((rating) => {
                        const count = statistics.rating_distribution[String(rating) as "1" | "2" | "3" | "4" | "5"];
                        const share = statistics.feedback_count
                          ? (count / statistics.feedback_count) * 100
                          : 0;
                        return (
                          <div key={rating} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-xs">
                            <span>{rating} ★</span>
                            <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 border-t border-[var(--border)] pt-4">
                      <h4 className="text-sm font-semibold">Neueste Rückmeldungen</h4>
                      {statistics.recent_feedback.length === 0 ? (
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                          In diesem Zeitraum gibt es noch keine Rückmeldungen.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {statistics.recent_feedback.map((feedback) => (
                            <li key={feedback.id} className="rounded-xl bg-card p-3">
                              <div className="flex justify-between gap-3 text-sm">
                                <span className="font-semibold">{feedback.rating} ★</span>
                                <time className="text-xs text-[var(--muted-foreground)]">
                                  {new Intl.DateTimeFormat("de-CH").format(new Date(feedback.created_at))}
                                </time>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                                {feedback.comment || "Keine schriftliche Rückmeldung"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  </div>

                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    „Bedient“ bedeutet aktuell: im Dashboard als bedient markiert. Auslastung
                    und Behandlungsdauer folgen, sobald historische Start- und Endzeiten erfasst werden.
                  </p>
                </>
              ) : null}
            </div>

            {!requestedSalonSlug && (
              <div className="mt-8 grid items-start gap-5 border-t border-[var(--border)] pt-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] p-5">
                  <h2 className="text-lg font-semibold">Website-Integration</h2>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Füge diesen Code auf der Website deines Salons ein. Kunden sehen
                    dann die aktuelle Warteschlange und Wartezeit.
                  </p>
                  <textarea
                    readOnly
                    value={`<iframe src="https://www.walkinly.ch/embed/${dashboardState.salonSlug}" title="Walkinly Warteschlange" width="100%" height="300" style="border: 0; max-width: 480px;" loading="lazy"></iframe>`}
                    className="mt-4 h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs text-[var(--muted-foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() => void copyEmbedCode(dashboardState.salonSlug)}
                    className="mt-3 w-full rounded-xl border border-[var(--border)] bg-transparent py-3 text-sm font-semibold text-foreground transition hover:opacity-80"
                  >
                    {isEmbedCodeCopied ? "Code kopiert" : "Einbettungscode kopieren"}
                  </button>
                </div>

                {dashboardState.email.toLowerCase() === "info@walkinly.ch" && (
                  <div className="rounded-2xl border border-[var(--border)] p-5">
                    <h2 className="text-lg font-semibold">WhatsApp-Test</h2>
                    <button type="button" onClick={() => void checkWhatsAppConnection()}
                      disabled={isCheckingWhatsApp}
                      className="mt-3 w-full rounded-xl border border-[var(--border)] py-3 text-sm font-semibold disabled:opacity-60">
                      {isCheckingWhatsApp ? "Status wird geprüft..." : "Verbindung prüfen (ohne Nachricht)"}
                    </button>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Liest die aktive Serverkonfiguration und den Nummernstatus bei Meta.
                      Ändert nichts und zeigt keine Tokens oder PINs an.
                    </p>
                    {whatsAppDiagnostics && (
                      <pre role="status" className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-[var(--border)] p-3 text-xs">
                        {whatsAppDiagnostics}
                      </pre>
                    )}
                    <details className="mt-4 rounded-xl border border-[var(--border)] p-4">
                      <summary className="cursor-pointer font-medium">Nummer für Cloud API registrieren (Fehler 133010)</summary>
                      <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                        Registriert die in Vercel konfigurierte Geschäftsnummer. Prüfe dort zuerst die
                        WHATSAPP_PHONE_NUMBER_ID. Falls schon eine PIN zur Verifizierung in zwei Schritten
                        existiert, verwende diese. Sonst wähle eine neue sechsstellige PIN und bewahre sie
                        sicher auf. Dies ist nicht der SMS-Code. Walkinly speichert die PIN nicht dauerhaft.
                      </p>
                      <label className="mt-3 block text-sm">
                        Sechsstellige PIN
                        <input type="password" inputMode="numeric" autoComplete="new-password"
                          maxLength={6} value={whatsAppPin}
                          onChange={(event) => setWhatsAppPin(event.target.value.replace(/\D/g, ""))}
                          disabled={isRegisteringWhatsApp || registrationSucceeded}
                          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-transparent p-3" />
                      </label>
                      <label className="mt-3 flex items-start gap-2 text-sm">
                        <input type="checkbox" checked={registrationConfirmed}
                          onChange={(event) => setRegistrationConfirmed(event.target.checked)}
                          disabled={isRegisteringWhatsApp || registrationSucceeded} />
                        Diese Geschäftsnummer wird nicht in einer WhatsApp-Handy-App genutzt.
                        Ich möchte sie mit dieser PIN für die Cloud API registrieren.
                      </label>
                      <button type="button" onClick={() => void registerWhatsAppNumber()}
                        disabled={isRegisteringWhatsApp || registrationSucceeded || !registrationConfirmed || !/^\d{6}$/.test(whatsAppPin)}
                        className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60">
                        {isRegisteringWhatsApp ? "Registrierung läuft..." : "Geschäftsnummer registrieren"}
                      </button>
                      {registrationStatus && <p role="status" className="mt-3 text-sm">{registrationStatus}</p>}
                    </details>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Sendet die aktive Vorlage „erinnerungsnachricht“ auf Deutsch (Schweiz)
                      mit den Beispielwerten „Anna“ und „Salon Beispiel“. Verwende nur deine
                      eigene private WhatsApp-Nummer als Testempfänger. Dies ist ein manueller
                      Test, keine automatische Warteschlangen-Benachrichtigung.
                      Es können Nachrichtengebühren anfallen.
                    </p>
                    <label className="mt-4 block text-sm font-medium text-foreground">
                      Testempfänger
                      <input
                        type="tel"
                        value={whatsAppTestPhone}
                        onChange={(event) => setWhatsAppTestPhone(event.target.value)}
                        placeholder="+41791234567"
                        inputMode="tel"
                        disabled={isSendingWhatsAppTest}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-3 text-base text-foreground"
                      />
                    </label>
                    {whatsAppTestStatus && (
                      <p className="mt-3 text-sm text-[var(--muted-foreground)]" role="status">
                        {whatsAppTestStatus}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void sendWhatsAppTestMessage()}
                      disabled={isSendingWhatsAppTest}
                      className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingWhatsAppTest
                        ? "Nachricht wird gesendet..."
                        : "WhatsApp-Testnachricht senden"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 block w-full rounded-2xl border border-[var(--border)] px-6 py-3 font-semibold text-foreground transition hover:opacity-80 sm:ml-auto sm:w-auto"
        >
          Abmelden
        </button>
      </section>
    </main>
  );
}
