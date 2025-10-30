// app/api/formsadmin/zip/[form_id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Some projects use different column names for the storage path.
// We'll try common alternatives.
function pickPath(f: any) {
  return f?.storage_path || f?.path || f?.file_path || f?.filepath || "";
}

export async function POST(
  req: Request,
  { params }: { params: { form_id: string } }
) {
  try {
    const { adminSecret } = await req.json().catch(() => ({} as any));
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formId = params.form_id;

    // 1) Get file list from DB
    const { data: files, error: filesErr } = await supabaseAdmin
      .from("form_files")
      .select("filename, storage_path, path, file_path, filepath")
      .eq("form_id", formId);

    if (filesErr) {
      return NextResponse.json({ error: filesErr.message }, { status: 500 });
    }

    // 2) Build ZIP with JSZip (lazy import)
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    let added = 0;

    for (const f of files || []) {
      const storagePath = pickPath(f);
      if (!storagePath) continue;

      // Adjust this if your bucket name is different
      const { data: fileRes, error: dlErr } = await supabaseAdmin.storage
        .from("form-uploads")
        .download(storagePath);

      if (dlErr || !fileRes) continue;

      const buf = await fileRes.arrayBuffer();
      const safeName =
        f.filename ||
        storagePath.split("/").pop() ||
        `arquivo_${added + 1}`;

      // Put inside attachments/ folder in the ZIP
      zip.file(`attachments/${safeName}`, buf);
      added++;
    }

    // If there were no attachments, still return a small zip so user gets a file
    if (added === 0) {
      zip.file(
        "attachments/NO_ATTACHMENTS.txt",
        "Este formulário não possui anexos armazenados."
      );
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
