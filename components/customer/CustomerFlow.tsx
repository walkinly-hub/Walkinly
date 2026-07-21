"use client";

import { useCallback, useEffect, useState } from "react";

import QueueOverview from "./QueueOverview";
import CheckInForm, { type CheckInResult } from "./CheckInForm";
import QueueStatus from "./QueueStatus";
import { supabase } from "@/lib/supabase";

type CustomerFlowProps = {
  salonName: string;
  salonSlug: string;
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

  if (step === "overview") {
    return (
      <QueueOverview
        salonName={salonName}
        waitingCount={waitingCount}
        estimatedWaitMinutes={estimatedWaitMinutes}
        onStartCheckIn={() => setStep("checkin")}
      />
    );
  }

  if (step === "checkin") {
    return (
      <CheckInForm
        salonSlug={salonSlug}
        onCheckIn={handleCheckIn}
      />
    );
  }

  return (
    <QueueStatus
      queuePosition={checkInResult?.queuePosition ?? 1}
      estimatedWaitMinutes={checkInResult?.estimatedWaitMinutes ?? 0}
    />
  );
}
