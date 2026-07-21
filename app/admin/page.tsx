"use client";

import { FormEvent, useState } from "react";

import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
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
        className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm"
      >
        <p className="text-sm font-medium text-primary">Walkinly</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Salon-Login
        </h1>

        {isEmailSent ? (
          <p className="mt-4 text-zinc-600">
            Wir haben dir einen sicheren Login-Link per E-Mail gesendet.
          </p>
        ) : (
          <>
            <p className="mt-3 text-zinc-500">
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
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-primary"
            />

            {errorMessage && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-primary py-4 text-lg font-semibold text-white hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Link wird gesendet..." : "Login-Link senden"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
