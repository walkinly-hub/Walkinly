"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import SalonBrand from "./SalonBrand";

export type CheckInResult = {
  entryId: string;
  accessToken: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  isWaitTakingLongerThanExpected?: boolean;
};

type CheckInFormProps = {
  salonName: string;
  logoUrl?: string;
  logoInverted: boolean;
  salonSlug: string;
  whatsappNotificationsEnabled: boolean;
  onCheckIn: (result: CheckInResult) => void;
};

export default function CheckInForm({
  salonName,
  logoUrl,
  logoInverted,
  salonSlug,
  whatsappNotificationsEnabled,
  onCheckIn,
}: CheckInFormProps) {
  const [name, setName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [wantsWhatsAppNotification, setWantsWhatsAppNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customerName = name.trim();

    if (!customerName) {
      setErrorMessage("Bitte gib deinen Vornamen ein.");
      return;
    }

    const normalizedWhatsAppPhone = whatsappPhone.replace(/[\s()-]/g, "");

    if (
      wantsWhatsAppNotification &&
      !/^\+[1-9]\d{7,14}$/.test(normalizedWhatsAppPhone)
    ) {
      setErrorMessage("Bitte gib deine Mobilnummer im internationalen Format ein, z. B. +41 79 123 45 67.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const { data, error } = await supabase.rpc("check_in_customer", {
      p_salon_slug: salonSlug,
      p_customer_name: customerName,
      p_whatsapp_phone: wantsWhatsAppNotification ? normalizedWhatsAppPhone : null,
      p_whatsapp_opt_in: wantsWhatsAppNotification,
    });

    setIsSubmitting(false);

    if (error || !data?.[0]) {
      setErrorMessage("Der Check-in konnte nicht gespeichert werden. Bitte versuche es erneut.");
      return;
    }

    onCheckIn({
      entryId: data[0].entry_id,
      accessToken: data[0].access_token,
      queuePosition: data[0].queue_position,
      estimatedWaitMinutes: data[0].estimated_wait_minutes,
    });
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm"
      >
        <SalonBrand salonName={salonName} logoUrl={logoUrl} logoInverted={logoInverted} />

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Jetzt einchecken
        </h1>

        <p className="mt-3 text-[var(--muted-foreground)]">
          Gib deinen Vornamen ein.
        </p>

        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Vorname"
          maxLength={80}
          disabled={isSubmitting}
          required
          className="mt-6 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-[var(--muted-foreground)] focus:border-primary"
        />

        {whatsappNotificationsEnabled && (
          <div className="mt-5 rounded-2xl border border-border p-4">
            <p className="font-semibold text-foreground">
              Optional: WhatsApp-Benachrichtigung
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Wir informieren dich einmal, wenn du als Nächstes dran bist.
            </p>

            <label className="mt-4 flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={wantsWhatsAppNotification}
                onChange={(event) => setWantsWhatsAppNotification(event.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              />
              <span>Ich möchte per WhatsApp benachrichtigt werden.</span>
            </label>

            {wantsWhatsAppNotification && (
              <label className="mt-4 block text-sm font-medium text-foreground">
                Mobilnummer
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(event) => setWhatsappPhone(event.target.value)}
                  placeholder="+41 79 123 45 67"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-[var(--muted-foreground)] focus:border-primary"
                />
              </label>
            )}
          </div>
        )}

        {errorMessage && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full rounded-2xl bg-primary py-4 text-lg font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition"
        >
          {isSubmitting ? "Check-in wird gespeichert..." : "Einchecken"}
        </button>
      </form>
    </main>
  );
}
