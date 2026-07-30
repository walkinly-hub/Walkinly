import SalonBrand from "@/components/customer/SalonBrand";
import { parseSalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

type FeedbackPageProps = {
  params: Promise<{
    location: string;
  }>;
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { location } = await params;
  const { data: salon, error } = await supabase
    .from("salons")
    .select("name, branding")
    .eq("slug", location)
    .maybeSingle();

  if (error) {
    throw new Error("Der Salon konnte nicht geladen werden.");
  }

  if (!salon) {
    notFound();
  }

  const branding = parseSalonBranding(salon.branding);
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

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-6"
      style={themeStyle}
    >
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">
        <SalonBrand
          salonName={salon.name}
          logoUrl={branding.logoUrl}
          logoInverted={branding.logoInverted}
        />

        <h1 className="mt-6 text-3xl font-semibold text-foreground">
          Dein Feedback
        </h1>

        <p className="mt-3 text-[var(--muted-foreground)]">
          Vielen Dank, dass du dir kurz Zeit für dein Feedback nehmen möchtest.
          Das Formular wird gerade vorbereitet.
        </p>
      </div>
    </main>
  );
}
