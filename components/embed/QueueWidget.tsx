"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

import type { SalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";

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
      <style>{"html, body { background: transparent !important; scrollbar-width: none; } html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }"}</style>
      <main className="min-h-screen bg-transparent p-4" style={themeStyle}>
        <section aria-label={`Warteschlange ${salonName}`} className="mx-auto w-full max-w-md rounded-[3rem_3rem_2rem_2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2
            className="text-[clamp(1.5rem,7vw,2.5rem)] font-normal uppercase leading-[0.95] tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "var(--font-widget-display), sans-serif" }}
          >
            Aktuelle<br />Warteschlange.
          </h2>

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
