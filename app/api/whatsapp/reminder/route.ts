import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppReminder } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_DISPATCH_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !key || process.env.WHATSAPP_AUTOMATION_ENABLED !== "true") {
    return Response.json({ error: "Dispatch disabled" }, { status: 503 });
  }
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${secret}`))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const payload = await request.json().catch(() => null);
  const entryId = payload?.record?.queue_entry_id;
  if (payload?.type !== "INSERT" || payload?.table !== "whatsapp_reminders" || payload?.schema !== "public"
    || typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("claim_whatsapp_reminder", { p_entry_id: entryId });
  if (error) return Response.json({ error: "Claim failed" }, { status: 503 });
  const reminder = data?.[0];
  if (!reminder) return Response.json({ skipped: true });
  let reference: string | null = null;
  let state = "failed";
  try {
    reference = await sendWhatsAppReminder({ recipientPhone: reminder.recipient_phone,
      customerName: reminder.customer_name, salonName: reminder.salon_name });
    state = "accepted";
  } catch {
    // Never log the provider exception: it may contain customer data.
    console.error("whatsapp_reminder_send_failed");
  }
  const { error: saveError } = await db.from("whatsapp_reminders").update({ state, reference }).eq("queue_entry_id", entryId);
  if (saveError) console.error("whatsapp_reminder_result_save_failed");
  // Acknowledge even an uncertain send. Retrying can create duplicate charges.
  return Response.json({ state, reference });
}
