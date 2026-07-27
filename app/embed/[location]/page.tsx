import QueueWidget from "@/components/embed/QueueWidget";
import { parseSalonBranding } from "@/lib/salon-branding";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

type QueueSummary = {
  salon_name: string;
  waiting_count: number;
  estimated_wait_minutes: number;
};

type EmbedPageProps = {
  params: Promise<{
    location: string;
  }>;
};

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { location } = await params;
  const [queueResult, salonResult] = await Promise.all([
    supabase
      .rpc("get_queue_summary", { p_salon_slug: location })
      .returns<QueueSummary[]>()
      .maybeSingle(),
    supabase
      .from("salons")
      .select("branding")
      .eq("slug", location)
      .maybeSingle(),
  ]);

  if (queueResult.error || salonResult.error) {
    throw new Error("Das Warteschlangen-Widget konnte nicht geladen werden.");
  }

  if (!queueResult.data || !salonResult.data) {
    notFound();
  }

  return (
    <QueueWidget
      salonName={queueResult.data.salon_name}
      salonSlug={location}
      branding={parseSalonBranding(salonResult.data.branding)}
      initialWaitingCount={queueResult.data.waiting_count}
      initialEstimatedWaitMinutes={queueResult.data.estimated_wait_minutes}
    />
  );
}
