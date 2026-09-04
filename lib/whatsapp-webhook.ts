import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function messageReference(id: unknown): string | null {
  return typeof id === "string" && id.startsWith("wamid.") && id.length <= 2048
    ? createHash("sha256").update(id).digest("hex").slice(0, 24)
    : null;
}

export function validSignature(body: Buffer, signature: string | null, secret: string): boolean {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(body).digest(), Buffer.from(signature.slice(7), "hex"));
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

// Explicit allowlist: never return message content, recipient IDs or raw message IDs.
export function deliveryEvents(payload: unknown, phoneNumberId: string) {
  const events: { reference: string; status: string; timestamp: string | null; errorCodes: number[] }[] = [];
  if (!phoneNumberId || record(payload).object !== "whatsapp_business_account") return events;
  for (const entry of list(record(payload).entry)) {
    for (const change of list(record(entry).changes)) {
      const value = record(record(change).value);
      if (record(change).field !== "messages" || record(value.metadata).phone_number_id !== phoneNumberId) continue;
      for (const item of list(value.statuses)) {
        const status = record(item);
        const reference = messageReference(status.id);
        if (!reference || typeof status.status !== "string" || !["sent", "delivered", "read", "failed", "deleted"].includes(status.status)) continue;
        events.push({ reference, status: status.status,
          timestamp: typeof status.timestamp === "string" && /^\d{1,12}$/.test(status.timestamp) ? status.timestamp : null,
          errorCodes: list(status.errors).map(error => record(error).code)
            .filter((code): code is number => typeof code === "number" && Number.isSafeInteger(code) && code >= 0 && code <= 999999999),
        });
      }
    }
  }
  return events;
}
