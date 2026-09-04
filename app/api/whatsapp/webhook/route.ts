import { createHash, timingSafeEqual } from "node:crypto";
import { deliveryEvents, validSignature } from "@/lib/whatsapp-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: string, status = 200) => new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain" } });

export async function GET(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!secret) return reply("Not configured", 503);
  const params = new URL(request.url).searchParams;
  const token = params.get("hub.verify_token") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (params.get("hub.mode") !== "subscribe" || !timingSafeEqual(digest(token), digest(secret))) return reply("Forbidden", 403);
  const challenge = params.get("hub.challenge");
  return challenge && /^\d{1,100}$/.test(challenge) ? reply(challenge) : reply("Invalid challenge", 400);
}

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!secret || !phoneId) return reply("Not configured", 503);
  // Limit bytes while streaming, even when Content-Length is absent or incorrect.
  const reader = request.body?.getReader();
  if (!reader) return reply("Missing body", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 1024 * 1024) { await reader.cancel(); return reply("Too large", 413); }
      chunks.push(chunk.value);
    }
  } catch { return reply("Invalid body", 400); }
  const body = Buffer.concat(chunks);
  if (!validSignature(body, request.headers.get("x-hub-signature-256"), secret)) return reply("Forbidden", 403);
  let payload: unknown;
  try { payload = JSON.parse(body.toString("utf8")); } catch { return reply("Invalid JSON", 400); }
  for (const event of deliveryEvents(payload, phoneId)) console.info("whatsapp_delivery", JSON.stringify(event));
  return reply("EVENT_RECEIVED");
}
