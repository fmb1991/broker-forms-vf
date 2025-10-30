// app/api/admin/templates/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Reutilizamos la misma función para GET y POST
async function handleListTemplates() {
  // 1) Validación por cookie httpOnly (puesta por /api/admin/login)
  const cookieSecret = cookies().get("admin_secret")?.value;
  if (!cookieSecret || cookieSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Consulta a Supabase (igual que antes)
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

// Soporta POST (como lo tenías)
export async function POST(_: Request) {
  try {
    return await handleListTemplates();
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "internal_error" },
      { status: 500 }
    );
  }
}

// (Opcional) Soporta GET por si la UI llama con GET
export async function GET() {
  try {
    return await handleListTemplates();
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "internal_error" },
      { status: 500 }
    );
  }
}
