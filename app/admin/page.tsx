"use client";

import { FormEvent, useState } from "react";

import { supabase } from "@/lib/supabase";
import PrivacyLink from "@/components/legal/PrivacyLink";
import WalkinlyLogo from "@/components/WalkinlyLogo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const requestedNextPath = new URLSearchParams(window.location.search).get("next");
    const nextPath = requestedNextPath?.startsWith("/dashboard")
      ? requestedNextPath
      : "/dashboard";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}${nextPath}`,
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.");
      return;
    }

    setIsEmailSent(true);
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm"
      >
        <WalkinlyLogo className="h-auto w-40" priority />
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Salon-Login
        </h1>

        {isEmailSent ? (
          <p className="mt-4 text-[var(--muted-foreground)]">
            Wir haben dir einen sicheren Login-Link per E-Mail gesendet.
          </p>
        ) : (
          <>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Gib deine geschäftliche E-Mail-Adresse ein.
            </p>

            <label className="mt-6 block text-sm font-medium" htmlFor="email">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            />

            {errorMessage && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}

            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Wir verwenden deine E-Mail-Adresse zum Versand des Login-Links und
              zur Verwaltung deines Salonzugangs. <PrivacyLink section="browser" />.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-[var(--walkinly-pink)] py-4 text-lg font-semibold text-[var(--walkinly-pink-foreground)] transition hover:bg-[var(--walkinly-pink-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Link wird gesendet..." : "Login-Link senden"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
