"use client";

import { useState } from "react";

import SalonBrand from "./SalonBrand";

type QueueStatusProps = {
  salonName: string;
  logoUrl?: string;
  logoInverted: boolean;
  queuePosition: number;
  estimatedWaitMinutes: number;
  onLeaveQueue: () => Promise<string | null>;
};

export default function QueueStatus({
  salonName,
  logoUrl,
  logoInverted,
  queuePosition,
  estimatedWaitMinutes,
  onLeaveQueue,
}: QueueStatusProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLeaveQueue() {
    if (!window.confirm("Möchtest du die Warteschlange wirklich verlassen? Dein Platz wird freigegeben.")) {
      return;
    }

    setIsLeaving(true);
    setErrorMessage(null);
    const error = await onLeaveQueue();
    setIsLeaving(false);

    if (error) {
      setErrorMessage(error);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">

        <SalonBrand salonName={salonName} logoUrl={logoUrl} logoInverted={logoInverted} />

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Du bist eingecheckt!
        </h1>

        <p className="mt-6 text-[var(--muted-foreground)]">
          Deine Position
        </p>

        <p className="mt-2 text-5xl font-bold text-foreground">
          #{queuePosition}
        </p>

        <p className="mt-6 text-[var(--muted-foreground)]">
          Geschätzte Wartezeit
        </p>

        <p className="mt-2 text-2xl font-semibold text-foreground">
          ca. {estimatedWaitMinutes} Minuten
        </p>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleLeaveQueue}
          disabled={isLeaving}
          className="mt-8 w-full rounded-2xl border border-border py-3 font-semibold text-foreground transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLeaving ? "Warteschlange wird verlassen..." : "Warteschlange verlassen"}
        </button>

      </div>
    </main>
  );
}
