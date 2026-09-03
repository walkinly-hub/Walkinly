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
  const [isEmbedCodeCopied, setIsEmbedCodeCopied] = useState(false);
  const [whatsAppTestPhone, setWhatsAppTestPhone] = useState("");
  const [whatsAppTestStatus, setWhatsAppTestStatus] = useState<string | null>(null);
  const [isSendingWhatsAppTest, setIsSendingWhatsAppTest] = useState(false);
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
      const result = (await response.json()) as { error?: string };

      setWhatsAppTestStatus(
        response.ok
          ? "Meta-Testvorlage wurde zur Zustellung übergeben."
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
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-6"
      style={themeStyle}
    >
      <section className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">
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
            <h1 className="mt-6 text-3xl font-semibold text-foreground">
              {branding ? "Salon-Dashboard" : dashboardState.salonName}
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Du bist als {dashboardState.email} angemeldet.
            </p>

            {!requestedSalonSlug && dashboardState.salons.length > 1 && (
              <label className="mt-6 block text-sm font-medium text-foreground">
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

            <div
              className={`mt-6 rounded-2xl p-4 transition-colors ${
                dashboardState.isChairOccupied
                  ? "bg-primary text-[var(--primary-foreground)]"
                  : "bg-[var(--background)] text-foreground"
              }`}
            >
              <p className="text-sm font-medium">
                {dashboardState.isChairOccupied ? "Stuhl besetzt" : "Stuhl frei"}
              </p>
              <p
                className={`mt-1 text-sm ${
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
                className={`mt-4 w-full rounded-xl border py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
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

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Warteschlange</h2>
                <span className="rounded-full bg-[var(--background)] px-3 py-1 text-sm font-medium">
                  {queueEntries.length} wartend
                </span>
              </div>

              {queueError && (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {queueError}
                </p>
              )}

              {isQueueLoading ? (
                <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                  Warteschlange wird geladen...
                </p>
              ) : queueEntries.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                  Momentan wartet niemand.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {queueEntries.map((entry) => (
                    <li
                      key={entry.entry_id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--background)] p-4"
                    >
                      <div>
                        <p className="font-semibold">
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
                        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
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

            {!requestedSalonSlug && (
              <>
                <div className="mt-8 border-t border-[var(--border)] pt-6">
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
                  <div className="mt-8 border-t border-[var(--border)] pt-6">
                    <h2 className="text-lg font-semibold">WhatsApp-Test</h2>
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
                      Sendet Metas „Integration test template“ über die konfigurierte
                      Geschäftsnummer. Verwende deine eigene private WhatsApp-Nummer
                      als Testempfänger. Es können Nachrichtengebühren anfallen.
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
              </>
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 w-full rounded-2xl border border-[var(--border)] py-3 font-semibold text-foreground hover:opacity-80 transition"
        >
          Abmelden
        </button>
      </section>
    </main>
  );
}
