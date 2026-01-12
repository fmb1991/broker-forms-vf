import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { templateSlug, company, contact, ttlMinutes, adminSecret } = body || {};

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!templateSlug || !company) {
    return NextResponse.json({ error: "templateSlug and company are required" }, { status: 400 });
  }

  const ttl = Number.isFinite(Number(ttlMinutes)) ? Number(ttlMinutes) : 60 * 24 * 30;
  const contactJson = contact && typeof contact === "object" ? contact : null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc("admin_create_form_instance", {
    p_template_slug: templateSlug,
    p_company: company,
    p_contact: contactJson,
    p_ttl_minutes: ttl,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...data });
}
