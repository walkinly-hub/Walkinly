import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getWhatsAppDiagnostics } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reply = (body: object, status = 200) => NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store" },
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return reply({ error: "Serverkonfiguration unvollständig." }, 503);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return reply({ error: "Nicht autorisiert." }, 401);

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await supabase.auth.getUser(authorization.slice(7));
  if (error || !user) return reply({ error: "Nicht autorisiert." }, 401);
  const { data: admin, error: adminError } = await supabase.from("platform_admins")
    .select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminError || !admin) return reply({ error: "Kein Plattform-Admin-Zugriff." }, 403);

  return reply({ report: await getWhatsAppDiagnostics() });
}
