// app/api/upload/record/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { token, questionCode, objectKey, fileName, size } = await req.json();

    if (!token || !questionCode || !objectKey || !fileName) {
      return NextResponse.json({ error: "missing parameters" }, { status: 400 });
    }

    // 1) Validate token -> form_id
    const { data: tok, error: tokErr } = await supabaseAdmin
      .from("form_access_tokens")
      .select("form_id, expires_at")
      .eq("token", token)
      .single();

    if (tokErr || !tok) return NextResponse.json({ error: "invalid token" }, { status: 403 });
    if (tok.expires_at && new Date(tok.expires_at) < new Date()) {
      return NextResponse.json({ error: "token expired" }, { status: 403 });
    }

    const formId = tok.form_id;

    // 2) Get template_id from the form instance
    const { data: form, error: formErr } = await supabaseAdmin
      .from("form_instances")
      .select("template_id")
      .eq("id", formId)
      .single();

    if (formErr || !form) {
      return NextResponse.json({ error: formErr?.message || "form_not_found" }, { status: 404 });
    }

    // 3) Map questionCode -> template_questions.id (question_id)
    const { data: q, error: qErr } = await supabaseAdmin
      .from("template_questions")
      .select("id")
      .eq("template_id", form.template_id)
      .eq("code", questionCode)
      .single();

    if (qErr || !q) {
      return NextResponse.json(
        { error: qErr?.message || "question_not_found_for_template" },
        { status: 404 }
      );
    }

    // 4) Insert into form_files (uploaded_at defaults to now())
    const { error: insErr } = await supabaseAdmin.from("form_files").insert({
      form_id: formId,
      question_id: q.id,
      storage_path: objectKey,
      filename: fileName,
      size: typeof size === "number" ? size : null,
    });

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}

