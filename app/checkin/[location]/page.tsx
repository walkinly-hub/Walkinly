import CustomerFlow from "@/components/customer/CustomerFlow";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

type QueueSummary = {
  salon_id: string;
  salon_name: string;
  waiting_count: number;
  estimated_wait_minutes: number;
};

type CheckInPageProps = {
  params: Promise<{
    location: string;
  }>;
};

export default async function CheckInPage({
  params,
}: CheckInPageProps) {
  const { location } = await params;
  const { data: queueSummary, error } = await supabase
    .rpc("get_queue_summary", { p_salon_slug: location })
    .returns<QueueSummary[]>()
    .maybeSingle();

  if (error) {
    throw new Error("Der Salon konnte nicht geladen werden.");
  }

  if (!queueSummary) {
    notFound();
  }

  return (
    <CustomerFlow
      salonName={queueSummary.salon_name}
      salonSlug={location}
      initialWaitingCount={queueSummary.waiting_count}
      initialEstimatedWaitMinutes={queueSummary.estimated_wait_minutes}
    />
  );
}
