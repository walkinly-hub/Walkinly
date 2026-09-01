"use client";

import { useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const ratings = ["Sehr unzufrieden", "Unzufrieden", "Okay", "Zufrieden", "Sehr zufrieden"];

export default function FeedbackForm({ salonSlug }: { salonSlug: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const submissionId = useRef<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (rating === null) {
      setError("Bitte wähle eine Bewertung aus.");
      return;
    }
    pending.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      // Reuse the ID after network errors so retries cannot create duplicates.
      submissionId.current ??= crypto.randomUUID();
      const { error: saveError } = await supabase.rpc("submit_salon_feedback", {
        p_salon_slug: salonSlug,
        p_rating: rating,
        p_comment: comment.trim(),
        p_submission_id: submissionId.current,
      });
      if (saveError) throw saveError;
      setIsComplete(true);
    } catch {
      setError("Dein Feedback konnte nicht gespeichert werden. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.");
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div role="status" className="mt-6 space-y-3 text-foreground">
        <h2 className="text-xl font-semibold">Vielen Dank!</h2>
        <p className="text-[var(--muted-foreground)]">Deine Rückmeldung wurde gespeichert.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-6" aria-busy={isSubmitting}>
      <p className="text-[var(--muted-foreground)]">
        Vielen Dank, dass du dir kurz Zeit für dein Feedback nimmst.
      </p>
      <fieldset disabled={isSubmitting} className="space-y-3">
        <legend className="font-medium text-foreground">Wie zufrieden warst du mit deinem Besuch?</legend>
        <div className="flex gap-2">
          {ratings.map((label, index) => (
            <label key={label} className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1">
              <input type="radio" name="rating" value={index + 1} required
                checked={rating === index + 1} onChange={() => setRating(index + 1)}
                aria-label={`${index + 1} von 5 – ${label}`} className="peer sr-only" />
              <span aria-hidden="true" className="flex h-12 w-full items-center justify-center rounded-xl border border-[var(--border)] text-2xl text-[var(--muted-foreground)] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-[var(--primary-foreground)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">★</span>
              <span aria-hidden="true" className="text-xs text-[var(--muted-foreground)]">{index + 1}</span>
            </label>
          ))}
        </div>
        <p className="min-h-5 text-sm text-[var(--muted-foreground)]" aria-live="polite">
          {rating === null ? "1 = sehr unzufrieden · 5 = sehr zufrieden" : ratings[rating - 1]}
        </p>
      </fieldset>
      <div>
        <label htmlFor="feedback-comment" className="block font-medium text-foreground">Was möchtest du uns mitgeben? <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></label>
        <textarea id="feedback-comment" value={comment} onChange={(event) => setComment(event.target.value)}
          maxLength={2000} rows={4} disabled={isSubmitting} aria-describedby="feedback-privacy feedback-length"
          placeholder="Was hat dir gefallen? Was können wir verbessern?"
          className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-background p-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
        <p id="feedback-length" className="mt-1 text-right text-xs text-[var(--muted-foreground)]">{comment.length}/2000 Zeichen</p>
      </div>
      <p id="feedback-privacy" className="text-sm text-[var(--muted-foreground)]">Wir fragen weder Name noch Kontaktdaten ab. Dein Feedback wird intern für den Salon gespeichert und nicht öffentlich angezeigt. Bitte erwähne keine persönlichen Daten im Kommentar.</p>
      {error && <p role="alert" className="rounded-xl border border-[var(--border)] p-3 text-sm text-foreground">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? "Wird gesendet …" : "Feedback senden"}
      </button>
    </form>
  );
}
