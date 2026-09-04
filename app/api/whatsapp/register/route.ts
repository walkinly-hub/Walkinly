import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { registerWhatsAppPhone, WhatsAppTestError } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Serverkonfiguration unvollständig." }, { status: 503 });
  }
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await supabase.auth.getUser(authorization.slice(7));
  if (error || !user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const { data: admin } = await supabase.from("platform_admins")
    .select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Kein Plattform-Admin-Zugriff." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.pin !== "string" || !/^\d{6}$/.test(body.pin) || body.confirmed !== true) {
    return NextResponse.json({ error: "Sechsstellige PIN und Bestätigung erforderlich." }, { status: 400 });
  }
  try {
    await registerWhatsAppPhone(body.pin);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof WhatsAppTestError ? error.message :
        "Registrierung konnte nicht bestätigt werden. Bitte vor einem erneuten Versuch den Nummernstatus bei Meta prüfen.",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
