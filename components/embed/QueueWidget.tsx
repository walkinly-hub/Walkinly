"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

import type { SalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";
import SalonBrand from "@/components/customer/SalonBrand";

type QueueWidgetProps = {
  salonName: string;
  salonSlug: string;
  branding: SalonBranding;
  initialWaitingCount: number;
  initialEstimatedWaitMinutes: number;
};

type QueueSummary = {
  waiting_count: number;
  estimated_wait_minutes: number;
};

export default function QueueWidget({
  salonName,
  salonSlug,
  branding,
  initialWaitingCount,
  initialEstimatedWaitMinutes,
}: QueueWidgetProps) {
  const [waitingCount, setWaitingCount] = useState(initialWaitingCount);
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState(
    initialEstimatedWaitMinutes,
  );

  const refreshQueueSummary = useCallback(async () => {
    const { data, error } = await supabase
      .rpc("get_queue_summary", { p_salon_slug: salonSlug })
      .returns<QueueSummary[]>()
      .maybeSingle();

    if (!error && data) {
      setWaitingCount(data.waiting_count);
      setEstimatedWaitMinutes(data.estimated_wait_minutes);
    }
  }, [salonSlug]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshQueueSummary();
    }, 10_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshQueueSummary();
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshQueueSummary]);

  const themeStyle = {
    "--background": branding.backgroundColor,
    "--foreground": branding.foregroundColor,
    "--card": branding.surfaceColor,
    "--primary": branding.primaryColor,
    "--primary-foreground": branding.primaryForegroundColor,
    "--border": branding.borderColor,
    "--muted-foreground": branding.mutedForegroundColor,
  } as CSSProperties & Record<`--${string}`, string>;

  const checkInUrl = `https://www.walkinly.ch/checkin/${salonSlug}`;

  return (
    <main
      className="min-h-screen bg-background p-4"
      style={themeStyle}
    >
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        <SalonBrand
          salonName={salonName}
          logoUrl={branding.logoUrl}
          logoInverted={branding.logoInverted}
        />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-[var(--muted-foreground)]">Wartende</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{waitingCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-[var(--muted-foreground)]">Wartezeit</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {estimatedWaitMinutes} Min.
            </p>
          </div>
        </div>

        <a
          href={checkInUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block w-full rounded-2xl bg-primary px-4 py-3 text-center font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
        >
          Warteschlange ansehen
        </a>
      </section>
    </main>
  );
}
