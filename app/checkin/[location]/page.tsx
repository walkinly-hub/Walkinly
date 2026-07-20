import CustomerFlow from "@/components/customer/CustomerFlow";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

type CheckInPageProps = {
  params: Promise<{
    location: string;
  }>;
};

export default async function CheckInPage({
  params,
}: CheckInPageProps) {
  const { location } = await params;
  const { data: salon, error } = await supabase
    .from("salons")
    .select("id, name, avg_duration")
    .eq("slug", location)
    .maybeSingle();

  if (error) {
    throw new Error("Der Salon konnte nicht geladen werden.");
  }

  if (!salon) {
    notFound();
  }

  return (
    <CustomerFlow
      salonId={salon.id}
      salonName={salon.name}
    />
  );
}
