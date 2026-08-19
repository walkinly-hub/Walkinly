const whatsappGraphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

type WhatsAppTemplateMessage = {
  recipientPhone: string;
};

export async function sendWhatsAppTestTemplate({
  recipientPhone,
}: WhatsAppTemplateMessage) {
  if (
    !whatsappGraphApiVersion ||
    !whatsappPhoneNumberId ||
    !whatsappAccessToken
  ) {
    throw new Error("WhatsApp ist noch nicht vollständig konfiguriert.");
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
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("WhatsApp-Testnachricht konnte nicht gesendet werden.");
  }
}
