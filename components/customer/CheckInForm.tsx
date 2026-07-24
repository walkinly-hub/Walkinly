"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import SalonBrand from "./SalonBrand";

export type CheckInResult = {
  queuePosition: number;
  estimatedWaitMinutes: number;
};

type CheckInFormProps = {
  salonName: string;
  logoUrl?: string;
  logoInverted: boolean;
  salonSlug: string;
  onCheckIn: (result: CheckInResult) => void;
};

export default function CheckInForm({
  salonName,
  logoUrl,
  logoInverted,
  salonSlug,
  onCheckIn,
}: CheckInFormProps) {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customerName = name.trim();

    if (!customerName) {
      setErrorMessage("Bitte gib deinen Vornamen ein.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const { data, error } = await supabase.rpc("check_in", {
      p_salon_slug: salonSlug,
      p_customer_name: customerName,
    });

    setIsSubmitting(false);

    if (error || !data?.[0]) {
      setErrorMessage("Der Check-in konnte nicht gespeichert werden. Bitte versuche es erneut.");
      return;
    }

    onCheckIn({
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
