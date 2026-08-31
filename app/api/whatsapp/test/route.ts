import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { sendWhatsAppTestTemplate, WhatsAppTestError } from "@/lib/whatsapp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Die WhatsApp-Testumgebung ist noch nicht vollständig konfiguriert." },
      { status: 503 },
    );
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!platformAdmin) {
    return NextResponse.json({ error: "Kein Plattform-Admin-Zugriff." }, { status: 403 });
  }

  const body = (await request.json()) as { recipientPhone?: unknown };
  const recipientPhone =
    typeof body.recipientPhone === "string"
      ? body.recipientPhone.replace(/[\s()-]/g, "")
      : "";

  if (!/^\+[1-9]\d{7,14}$/.test(recipientPhone)) {
    return NextResponse.json(
      { error: "Bitte gib eine Mobilnummer im internationalen Format ein." },
      { status: 400 },
    );
  }

  try {
    await sendWhatsAppTestTemplate({
      recipientPhone,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof WhatsAppTestError ? error.message : "WhatsApp-Testnachricht konnte nicht gesendet werden." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
