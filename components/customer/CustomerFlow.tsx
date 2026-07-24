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

type QueueEntryCredentials = {
  entryId: string;
  accessToken: string;
};

type CustomerQueueEntry = {
  queue_position: number;
  estimated_wait_minutes: number;
  status: "waiting" | "done" | "removed";
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
  const [queueEntryCredentials, setQueueEntryCredentials] =
    useState<QueueEntryCredentials | null>(null);
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

  const storageKey = `walkinly:queue-entry:${salonSlug}`;

  const refreshCustomerQueueEntry = useCallback(async () => {
    if (!queueEntryCredentials) {
      return;
    }

    const { data, error } = await supabase
      .rpc("get_customer_queue_entry", {
        p_entry_id: queueEntryCredentials.entryId,
        p_access_token: queueEntryCredentials.accessToken,
      })
      .returns<CustomerQueueEntry[]>()
      .maybeSingle();

    if (error || !data || data.status !== "waiting") {
      window.localStorage.removeItem(storageKey);
      setQueueEntryCredentials(null);
      setCheckInResult(null);
      setStep("overview");
      return;
    }

    setCheckInResult({
      entryId: queueEntryCredentials.entryId,
      accessToken: queueEntryCredentials.accessToken,
      queuePosition: data.queue_position,
      estimatedWaitMinutes: data.estimated_wait_minutes,
    });
    setStep("success");
  }, [queueEntryCredentials, storageKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedEntry = window.localStorage.getItem(storageKey);

      if (!storedEntry) {
        return;
      }

      try {
        const parsedEntry = JSON.parse(storedEntry) as Partial<QueueEntryCredentials>;

        if (
          typeof parsedEntry.entryId === "string" &&
          typeof parsedEntry.accessToken === "string"
        ) {
          setQueueEntryCredentials({
            entryId: parsedEntry.entryId,
            accessToken: parsedEntry.accessToken,
          });
          return;
        }
      } catch {
        // Invalid browser data is discarded below.
      }

      window.localStorage.removeItem(storageKey);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);

  useEffect(() => {
    const initialRefreshId = window.setTimeout(() => {
      void refreshQueueSummary();
    }, 0);
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
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshQueueSummary]);

  useEffect(() => {
    if (!queueEntryCredentials) {
      return;
    }

    const initialRefreshId = window.setTimeout(() => {
      void refreshCustomerQueueEntry();
    }, 0);
    const intervalId = window.setInterval(() => {
      void refreshCustomerQueueEntry();
    }, 5_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshCustomerQueueEntry();
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [queueEntryCredentials, refreshCustomerQueueEntry]);

  useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, walkinlyStep: "overview" },
      "",
      window.location.href,
    );

    function handleHistoryNavigation(event: PopStateEvent) {
      setStep(event.state?.walkinlyStep === "checkin" ? "checkin" : "overview");
    }

    window.addEventListener("popstate", handleHistoryNavigation);

    return () => window.removeEventListener("popstate", handleHistoryNavigation);
  }, []);

  function startCheckIn() {
    window.history.pushState(
      { ...window.history.state, walkinlyStep: "checkin" },
      "",
      window.location.href,
    );
    setStep("checkin");
  }

  function handleCheckIn(result: CheckInResult) {
    const credentials = {
      entryId: result.entryId,
      accessToken: result.accessToken,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(credentials));
    setQueueEntryCredentials(credentials);
    setCheckInResult(result);
    setStep("success");
  }

  async function leaveQueue() {
    if (!queueEntryCredentials) {
      return "Dein Warteschlangen-Eintrag wurde nicht gefunden.";
    }

    const { error } = await supabase.rpc("leave_queue_entry", {
      p_entry_id: queueEntryCredentials.entryId,
      p_access_token: queueEntryCredentials.accessToken,
    });

    if (error) {
      return "Die Warteschlange konnte nicht verlassen werden. Bitte versuche es erneut.";
    }

    window.localStorage.removeItem(storageKey);
    setQueueEntryCredentials(null);
    setCheckInResult(null);
    setStep("overview");
    await refreshQueueSummary();

    return null;
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
          onStartCheckIn={startCheckIn}
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
        onLeaveQueue={leaveQueue}
      />
    </div>
  );
}
