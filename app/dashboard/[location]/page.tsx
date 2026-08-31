import DashboardPage from "@/app/dashboard/page";
import { parseSalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

type BrandedDashboardPageProps = {
  params: Promise<{
    location: string;
  }>;
};

export default async function BrandedDashboardPage({
  params,
}: BrandedDashboardPageProps) {
  const { location } = await params;
  const { data: salon, error } = await supabase
    .from("salons")
    .select("name, branding")
    .eq("slug", location)
    .maybeSingle();

  if (error) {
    throw new Error("Das Salon-Dashboard konnte nicht geladen werden.");
  }

  if (!salon) {
    notFound();
  }

  return (
    <DashboardPage
      requestedSalonSlug={location}
      brandedSalonName={salon.name}
      branding={parseSalonBranding(salon.branding)}
    />
  );
}
