"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

import QueueOverview from "./QueueOverview";
import CheckInForm, { type CheckInResult } from "./CheckInForm";
import QueueStatus from "./QueueStatus";
import VisitComplete from "./VisitComplete";
import type { SalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";

type CustomerFlowProps = {
  salonName: string;
  salonSlug: string;
  branding: SalonBranding;
  whatsappNotificationsEnabled: boolean;
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
  is_chair_available_immediately: boolean;
  is_wait_taking_longer_than_expected: boolean;
  status: "waiting" | "done" | "removed";
};

export default function CustomerFlow({
  salonName,
  salonSlug,
  branding,
  whatsappNotificationsEnabled,
  initialWaitingCount,
  initialEstimatedWaitMinutes,
}: CustomerFlowProps) {
  const [step, setStep] = useState<
    "overview" | "checkin" | "success" | "completed"
  >("overview");
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [queueEntryCredentials, setQueueEntryCredentials] =
    useState<QueueEntryCredentials | null>(null);
  const [isRestoringQueueEntry, setIsRestoringQueueEntry] = useState(true);
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

    // A temporary request failure must never make a customer lose their place.
    // The entry is only discarded after the server explicitly confirms removal.
    if (error || !data) {
      return;
    }

    if (data.status === "removed") {
      window.localStorage.removeItem(storageKey);
      setQueueEntryCredentials(null);
      setCheckInResult(null);
      setStep("overview");
      return;
    }

    if (data.status === "done") {
      window.localStorage.removeItem(storageKey);
      setQueueEntryCredentials(null);
      setCheckInResult(null);
      setStep("completed");
      return;
    }

    setCheckInResult({
      entryId: queueEntryCredentials.entryId,
      accessToken: queueEntryCredentials.accessToken,
        queuePosition: data.queue_position,
        estimatedWaitMinutes: data.estimated_wait_minutes,
        isChairAvailableImmediately: data.is_chair_available_immediately,
        isWaitTakingLongerThanExpected:
          data.is_wait_taking_longer_than_expected,
    });
    setStep("success");
  }, [queueEntryCredentials, storageKey]);

  useEffect(() => {
    const restorationId = window.setTimeout(() => {
      const storedEntry = window.localStorage.getItem(storageKey);

      if (storedEntry) {
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
            setStep("success");
          } else {
            window.localStorage.removeItem(storageKey);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      setIsRestoringQueueEntry(false);
    }, 0);

    return () => window.clearTimeout(restorationId);
  }, [storageKey]);

  useEffect(() => {
    const initialRefreshId = window.setTimeout(() => {
      void refreshQueueSummary();
    }, 0);
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
    if (!window.history.state?.walkinlyStep) {
      window.history.replaceState(
        { ...window.history.state, walkinlyStep: "overview" },
        "",
        window.location.href,
      );
    }

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
    window.history.replaceState(
      { ...window.history.state, walkinlyStep: "success" },
      "",
      window.location.href,
    );
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
    window.history.replaceState(
      { ...window.history.state, walkinlyStep: "overview" },
      "",
      window.location.href,
    );
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

  if (isRestoringQueueEntry) {
    return (
      <div style={themeStyle}>
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <p className="text-[var(--muted-foreground)]">Dein Check-in wird geladen …</p>
        </main>
      </div>
    );
  }

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
          whatsappNotificationsEnabled={whatsappNotificationsEnabled}
          onCheckIn={handleCheckIn}
        />
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div style={themeStyle}>
        <VisitComplete
          salonName={salonName}
          salonSlug={salonSlug}
          logoUrl={branding.logoUrl}
          logoInverted={branding.logoInverted}
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
        isChairAvailableImmediately={
          checkInResult?.isChairAvailableImmediately ?? false
        }
        isWaitTakingLongerThanExpected={
          checkInResult?.isWaitTakingLongerThanExpected ?? false
        }
        onLeaveQueue={leaveQueue}
      />
    </div>
  );
}
