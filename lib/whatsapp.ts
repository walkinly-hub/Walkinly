const whatsappGraphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

type WhatsAppTemplateMessage = {
  recipientPhone: string;
};

export class WhatsAppTestError extends Error {}

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
          name: "3p_direct_integration_test_template",
          language: {
            code: "en_US",
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    // Only return numeric diagnostics, never raw Meta errors that may contain secrets.
    const code = result?.error?.code;
    const subcode = result?.error?.error_subcode;
    const diagnostics = [
      `HTTP ${response.status}`,
      ...(typeof code === "number" ? [`Meta-Code ${code}`] : []),
      ...(typeof subcode === "number" ? [`Subcode ${subcode}`] : []),
    ].join(", ");
    throw new WhatsAppTestError(`WhatsApp-Testnachricht abgelehnt (${diagnostics}).`);
  }
}
