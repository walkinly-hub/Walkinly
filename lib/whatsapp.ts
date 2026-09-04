import { describeWhatsAppError } from "@/lib/whatsapp-error";

const whatsappGraphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

type WhatsAppTemplateMessage = {
  recipientPhone: string;
};

export class WhatsAppTestError extends Error {}

// Read-only diagnostics: never expose tokens, PINs, phone numbers or raw Meta errors.
export async function getWhatsAppDiagnostics(): Promise<string> {
  const validId = /^\d{1,30}$/.test(whatsappPhoneNumberId ?? "");
  const validVersion = /^v\d{1,3}\.\d{1,2}$/.test(whatsappGraphApiVersion ?? "");
  const environment = process.env.VERCEL_ENV;
  const lines = [
    `Phone Number ID (laufende App): ${validId ? whatsappPhoneNumberId : "fehlt oder ungültig"}`,
    `Graph API: ${validVersion ? whatsappGraphApiVersion : "fehlt oder ungültig"}`,
    `Umgebung: ${environment && ["production", "preview", "development"].includes(environment) ? environment : "lokal/unbekannt"}`,
    `Token hinterlegt: ${whatsappAccessToken ? "ja" : "nein"}`,
  ];
  if (!validId || !validVersion || !whatsappAccessToken) return lines.join("\n");

  try {
    const response = await fetch(
      `https://graph.facebook.com/${whatsappGraphApiVersion}/${whatsappPhoneNumberId}?fields=id,status,platform_type,code_verification_status`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${whatsappAccessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    const result = await response.json().catch(() => null);
    lines.push(`Meta-Abfrage: HTTP ${response.status}`);
    if (!response.ok) {
      if (typeof result?.error?.code === "number") lines.push(`Meta-Code: ${result.error.code}`);
      if (typeof result?.error?.error_subcode === "number") lines.push(`Subcode: ${result.error.error_subcode}`);
      lines.push("Status nicht lesbar. Diese Abfrage benötigt zusätzlich whatsapp_business_management; ein Lesefehler beweist keinen Versandfehler.");
    } else {
      const enumValue = (value: unknown) => typeof value === "string" && /^[A-Z_]{1,40}$/.test(value)
        ? value : "nicht angegeben";
      lines.push(
        `Meta-ID stimmt überein: ${result?.id === whatsappPhoneNumberId ? "ja" : "nein/keine ID"}`,
        `Status: ${enumValue(result?.status)}`,
        `Plattform: ${enumValue(result?.platform_type)}`,
        `SMS-/Anruf-Verifizierung: ${enumValue(result?.code_verification_status)}`,
      );
    }
  } catch {
    lines.push("Meta-Abfrage nicht abgeschlossen (Netzwerk oder Zeitüberschreitung).");
  }
  return lines.join("\n");
}

export async function registerWhatsAppPhone(pin: string) {
  if (!/^\d{6}$/.test(pin)) {
    throw new WhatsAppTestError("Bitte eine sechsstellige PIN eingeben.");
  }
  if (!whatsappGraphApiVersion || !whatsappPhoneNumberId || !whatsappAccessToken) {
    throw new WhatsAppTestError("WhatsApp ist noch nicht vollständig konfiguriert.");
  }
  const response = await fetch(
    `https://graph.facebook.com/${whatsappGraphApiVersion}/${whatsappPhoneNumberId}/register`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", pin }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const code = result?.error?.code;
    const subcode = result?.error?.error_subcode;
    const diagnostics = [
      `HTTP ${response.status}`,
      ...(typeof code === "number" ? [`Meta-Code ${code}`] : []),
      ...(typeof subcode === "number" ? [`Subcode ${subcode}`] : []),
    ].join(", ");
    const explanation = describeWhatsAppError(result?.error, [whatsappAccessToken, pin]);
    throw new WhatsAppTestError(
      `Registrierung abgelehnt (${diagnostics}).${explanation ? ` Meta-Begründung: ${explanation}.` : " Meta hat keine lesbare Begründung geliefert."} Bitte nicht mehrfach versuchen; zuerst den Fehler prüfen.`,
    );
  }
  if (result?.success !== true) {
    throw new WhatsAppTestError("Meta hat die Registrierung nicht bestätigt. Bitte den Nummernstatus bei Meta prüfen.");
  }
}

export async function sendWhatsAppTestTemplate({
  recipientPhone,
}: WhatsAppTemplateMessage) {
  if (
    !whatsappGraphApiVersion ||
    !whatsappPhoneNumberId ||
    !whatsappAccessToken
  ) {
    throw new WhatsAppTestError("WhatsApp ist noch nicht vollständig konfiguriert. Bitte die drei WHATSAPP-Variablen in Vercel prüfen und neu deployen.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${whatsappGraphApiVersion}/${whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipientPhone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: "erinnerungsnachricht",
          language: {
            code: "de_CH",
          },
          // Manual admin test only; these are not real queue/customer values.
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: "Anna" },
              { type: "text", text: "Salon Beispiel" },
            ],
          }],
        },
      }),
    },
  );

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    // Include a redacted reason so template/language errors can be diagnosed.
    const code = result?.error?.code;
    const subcode = result?.error?.error_subcode;
    const diagnostics = [
      `HTTP ${response.status}`,
      ...(typeof code === "number" ? [`Meta-Code ${code}`] : []),
      ...(typeof subcode === "number" ? [`Subcode ${subcode}`] : []),
    ].join(", ");
    const explanation = describeWhatsAppError(result?.error, [whatsappAccessToken, recipientPhone, recipientPhone.replace(/\D/g, "")]);
    throw new WhatsAppTestError(`WhatsApp-Testnachricht abgelehnt (${diagnostics}).${explanation ? ` Meta-Begründung: ${explanation}` : ""}`);
  }
}
