"use client";

import { useState } from "react";
import CheckInForm from "./CheckInForm";
import QueueStatus from "./QueueStatus";

export default function QueueOverview() {
  const [step, setStep] = useState("overview");

  if (step === "checkin") {
    return (
      <CheckInForm
        onCheckIn={() => setStep("success")}
      />
    );
  }

  if (step === "success") {
    return <QueueStatus />;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">

        <p className="text-sm font-medium text-primary">
          Walkinly
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Willkommen
        </h1>

        <p className="mt-3 text-zinc-500">
          Momentan warten
        </p>

        <p className="mt-2 text-5xl font-bold text-foreground">
          4
        </p>

        <p className="mt-4 text-zinc-500">
          Geschätzte Wartezeit
        </p>

        <p className="mt-2 text-2xl font-semibold text-foreground">
          ca. 25 Minuten
        </p>

        <button
          onClick={() => setStep("checkin")}
          className="mt-8 w-full rounded-2xl bg-primary py-4 text-lg font-semibold text-white hover:opacity-90 transition"
        >
          Jetzt einchecken
        </button>

      </div>
    </main>
  );
}