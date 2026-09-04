// Only selected descriptive fields may leave the server, never the full response.
export function describeWhatsAppError(error: unknown, secrets: string[]): string {
  if (!error || typeof error !== "object") return "";
  const data = error as Record<string, unknown>;
  const details = data.error_data && typeof data.error_data === "object"
    ? (data.error_data as Record<string, unknown>).details : undefined;
  const values = [data.error_user_title, data.error_user_msg, data.message, details];
  const sensitiveValues = secrets.filter(Boolean).flatMap((secret) => [
    secret, encodeURIComponent(secret), JSON.stringify(secret).slice(1, -1),
  ]).sort((a, b) => b.length - a.length);

  const messages = values.filter((value): value is string => typeof value === "string")
    .map((value) => {
      let safe = value;
      for (const secret of sensitiveValues) safe = safe.split(secret).join("[vertraulich]");
      return safe
        .replace(/Bearer\s+[^\s"'<>]+/gi, "Bearer [vertraulich]")
        .replace(/[A-Za-z0-9_+/.=-]{32,}/g, "[vertraulich]")
        .replace(/\d(?:[\s()-]*\d){5,}/g, "[vertraulich]")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim();
    }).filter(Boolean);
  // Truncate only after redaction so a token cannot be exposed as a partial value.
  return [...new Set(messages)].join(" | ").slice(0, 800);
}
