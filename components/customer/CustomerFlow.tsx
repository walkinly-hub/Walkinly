"use client";

import { useState } from "react";

import QueueOverview from "./QueueOverview";
import CheckInForm, { type CheckInResult } from "./CheckInForm";
import QueueStatus from "./QueueStatus";

type CustomerFlowProps = {
  salonName: string;
  salonSlug: string;
  initialWaitingCount: number;
  initialEstimatedWaitMinutes: number;
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

  function handleCheckIn(result: CheckInResult) {
    setCheckInResult(result);
    setStep("success");
  }

  if (step === "overview") {
    return (
      <QueueOverview
        salonName={salonName}
        waitingCount={initialWaitingCount}
        estimatedWaitMinutes={initialEstimatedWaitMinutes}
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
