import Link from "next/link";

import SalonBrand from "./SalonBrand";

type VisitCompleteProps = {
  salonName: string;
  salonSlug: string;
  logoUrl?: string;
  logoInverted: boolean;
};

export default function VisitComplete({
  salonName,
  salonSlug,
  logoUrl,
  logoInverted,
}: VisitCompleteProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">
        <SalonBrand
          salonName={salonName}
          logoUrl={logoUrl}
          logoInverted={logoInverted}
        />

        <h1 className="mt-6 text-3xl font-semibold text-foreground">
          Vielen Dank für deinen Besuch!
        </h1>

        <p className="mt-3 text-[var(--muted-foreground)]">
          Wir hoffen, du bist mit unserer Dienstleistung zufrieden und freuen
          uns auf deinen nächsten Besuch bei uns.
        </p>

        <p className="mt-6 text-[var(--muted-foreground)]">
          Möchtest du uns Feedback geben? Sehr gerne!
        </p>

        <Link
          href={`/feedback/${salonSlug}`}
          className="mt-4 block w-full rounded-2xl bg-primary py-4 text-center text-lg font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
        >
          Zum Feedback-Formular
        </Link>
      </div>
    </main>
  );
}
