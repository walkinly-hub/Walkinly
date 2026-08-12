const whatsappGraphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

type WhatsAppTextMessage = {
  recipientPhone: string;
  body: string;
};

export async function sendWhatsAppTextMessage({
  recipientPhone,
  body,
}: WhatsAppTextMessage) {
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
        type: "text",
        text: {
          body,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("WhatsApp-Testnachricht konnte nicht gesendet werden.");
  }
}
