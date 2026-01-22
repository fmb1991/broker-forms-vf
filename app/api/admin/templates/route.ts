import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const { adminSecret } = await req.json().catch(() => ({}));

  // ✅ Validate admin secret (safer: also blocks empty/undefined)
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // ✅ Only return ACTIVE templates (this fixes your issue)
  const { data, error } = await supabaseAdmin
    .from("form_templates")
    .select("id, slug, product_code, industry_code, version, status")
    .eq("status", "active")
    .order("product_code", { ascending: true })
    .order("industry_code", { ascending: true })
    .order("version", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, templates: data ?? [] });
}

