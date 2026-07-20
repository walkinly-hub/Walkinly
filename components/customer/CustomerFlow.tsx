"use client";

import { useState } from "react";

import QueueOverview from "./QueueOverview";
import CheckInForm from "./CheckInForm";
import QueueStatus from "./QueueStatus";

type CustomerFlowProps = {
  salonId: string;
  salonName: string;
};

export default function CustomerFlow({
  salonId,
  salonName,
}: CustomerFlowProps) {
  const [step, setStep] = useState<
    "overview" | "checkin" | "success"
  >("overview");

  if (step === "overview") {
    return (
      <QueueOverview
        salonName={salonName}
        onStartCheckIn={() => setStep("checkin")}
      />
    );
  }

  if (step === "checkin") {
    return (
      <CheckInForm
        salonId={salonId}
        onCheckIn={() => setStep("success")}
      />
    );
  }

  return <QueueStatus />;
}
