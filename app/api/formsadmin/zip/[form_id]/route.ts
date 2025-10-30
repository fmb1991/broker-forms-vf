// app/api/formsadmin/zip/[form_id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const runtime = "nodejs";          // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";   // this route depends on request-time data

export async function POST(req: Request, { params }: { params: { form_id: string } }) {
  try {
    const { adminSecret } = await req.json().catch(() => ({} as any));
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formId = params.form_id;

    // Lazy import JSZip to avoid ESM interop issues
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    // 1) PDF placeholder (replace later with your real PDF buffer)
    zip.file(`form_${formId}.pdf`, new Uint8Array([37,80,68,70,10,37,37,69,79,70])); // "%PDF\n%%EOF"

    // 2) Attachments from storage bucket "form-uploads"
    const { data: files, error: filesErr } = await supabaseAdmin
      .from("form_files")
      .select("storage_path, filename")
      .eq("form_id", formId);

    if (filesErr) {
      return NextResponse.json({ error: filesErr.message }, { status: 500 });
    }

    if (files && files.length > 0) {
      for (const f of files) {
        const { data: fileRes, error: dlErr } = await supabaseAdmin
          .storage
          .from("form-uploads")
          .download(f.storage_path);

        if (!dlErr && fileRes) {
          const arr = await fileRes.arrayBuffer();
          const name = f.filename || f.storage_path.split("/").pop() || "attachment";
          zip.file(`attachments/${name}`, arr);
        }
      }
    }

    const out = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(out, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="form_${formId}_attachments.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "internal_error" },
      { status: 500 }
    );
  }
}
