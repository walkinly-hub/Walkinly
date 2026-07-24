"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

import QueueOverview from "./QueueOverview";
import CheckInForm, { type CheckInResult } from "./CheckInForm";
import QueueStatus from "./QueueStatus";
import type { SalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";

type CustomerFlowProps = {
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

export default function CustomerFlow({
  salonName,
  salonSlug,
  branding,
  initialWaitingCount,
  initialEstimatedWaitMinutes,
}: CustomerFlowProps) {
  const [step, setStep] = useState<
    "overview" | "checkin" | "success"
  >("overview");
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
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

    return () => window.clearInterval(intervalId);
  }, [refreshQueueSummary]);

  function handleCheckIn(result: CheckInResult) {
    setCheckInResult(result);
    setStep("success");
  }

  const themeStyle = {
    "--background": branding.backgroundColor,
    "--foreground": branding.foregroundColor,
    "--card": branding.surfaceColor,
    "--primary": branding.primaryColor,
    "--primary-hover": branding.primaryHoverColor,
    "--primary-foreground": branding.primaryForegroundColor,
    "--border": branding.borderColor,
    "--muted-foreground": branding.mutedForegroundColor,
  } as CSSProperties & Record<`--${string}`, string>;

  if (step === "overview") {
    return (
      <div style={themeStyle}>
        <QueueOverview
          salonName={salonName}
          logoUrl={branding.logoUrl}
          logoInverted={branding.logoInverted}
          waitingCount={waitingCount}
          estimatedWaitMinutes={estimatedWaitMinutes}
          onStartCheckIn={() => setStep("checkin")}
        />
      </div>
    );
  }

  if (step === "checkin") {
    return (
      <div style={themeStyle}>
        <CheckInForm
          salonName={salonName}
          logoUrl={branding.logoUrl}
          logoInverted={branding.logoInverted}
          salonSlug={salonSlug}
          onCheckIn={handleCheckIn}
        />
      </div>
    );
  }

  return (
    <div style={themeStyle}>
      <QueueStatus
        salonName={salonName}
        logoUrl={branding.logoUrl}
        logoInverted={branding.logoInverted}
        queuePosition={checkInResult?.queuePosition ?? 1}
        estimatedWaitMinutes={checkInResult?.estimatedWaitMinutes ?? 0}
      />
    </div>
  );
}
