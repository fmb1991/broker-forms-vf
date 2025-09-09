import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const { adminSecret } = await req.json().catch(() => ({}));
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("form_templates")
    .select("id, slug, product_code, industry_code, version, status")
    .order("product_code", { ascending: true })
    .order("industry_code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, templates: data ?? [] });
}
