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
    }, 5_000);

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

  return (
    <>
      <style>{"html, body { background: transparent !important; }"}</style>
      <main className="min-h-screen bg-transparent p-4" style={themeStyle}>
        <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <SalonBrand
              salonName={salonName}
              logoUrl={branding.logoUrl}
              logoInverted={branding.logoInverted}
              showName={false}
            />
            <h2 className="text-lg font-semibold text-foreground">
              Aktuelle Warteschlange
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm text-[var(--muted-foreground)]">Wartende</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{waitingCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm text-[var(--muted-foreground)]">Geschätzte Wartezeit</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {estimatedWaitMinutes} Min.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-[var(--muted-foreground)]">
            Bereitgestellt durch{" "}
            <a
              href="https://www.walkinly.ch"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Walkinly
            </a>
          </p>

        </section>
      </main>
    </>
  );
}
