import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
const BUCKET = "form-uploads"; // create as PRIVATE in Supabase Storage

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { token, questionCode, fileName, contentType } = await req.json();

    if (!token || !questionCode || !fileName) {
      return NextResponse.json({ error: "missing parameters" }, { status: 400 });
    }

    // validate token and get form_id
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
    const objectKey = `${formId}/${questionCode}/${Date.now()}-${fileName}`;

    // signed upload URL (valid few minutes)
    const { data: signed, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUploadUrl(objectKey);

    if (error || !signed) {
      return NextResponse.json({ error: error?.message || "sign failed" }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl: signed.signedUrl,
      objectKey,
      bucket: BUCKET,
      contentType: contentType || "application/octet-stream",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
