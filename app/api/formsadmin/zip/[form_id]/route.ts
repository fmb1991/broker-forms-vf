// app/api/formsadmin/zip/[form_id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Try many possible column names, but now we DO NOT select them explicitly.
function pickPath(f: Record<string, any>): string {
  // prefer explicit storage path keys
  const candidates = [
    "storage_path",
    "object_path",
    "objectKey",
    "object_key",
    "key",
    "full_path",
    "file_path",
    "filepath",
    "path",
  ];

  for (const k of candidates) {
    const v = f?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // fallback heuristic: if there is a folder + filename pattern in custom schemas
  if (typeof f?.folder === "string" && typeof f?.filename === "string") {
    return `${f.folder.replace(/\/+$/, "")}/${f.filename.replace(/^\/+/, "")}`;
  }

  // as a last resort, sometimes only filename is stored at root of bucket
  if (typeof f?.filename === "string" && f.filename.trim()) {
    return f.filename.trim();
  }

  return "";
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

    const supabaseAdmin = getSupabaseAdmin();
    const formId = params.form_id;

    // 1) Fetch ALL columns so we don't break if some don't exist
    const { data: files, error: filesErr } = await supabaseAdmin
      .from("form_files")
      .select("*")
      .eq("form_id", formId);

    if (filesErr) {
      return NextResponse.json({ error: filesErr.message }, { status: 500 });
    }

    // 2) Prepare ZIP
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    let added = 0;

    for (const f of files || []) {
      const storagePath = pickPath(f);
      if (!storagePath) continue;

      // Adjust bucket name if yours is different
      const { data: fileRes, error: dlErr } = await supabaseAdmin.storage
        .from("form-uploads")
        .download(storagePath);

      if (dlErr || !fileRes) {
        // Keep going; we still want to return a ZIP with whatever we could fetch
        continue;
      }

      const buf = await fileRes.arrayBuffer();
      const filenameFromPath = storagePath.split("/").pop() || "file";
      const safeName = f?.filename || filenameFromPath || `file_${added + 1}`;

      zip.file(`attachments/${safeName}`, buf);
      added++;
    }

    // If nothing added, still return a small zip so the browser downloads something
    if (added === 0) {
      zip.file(
        "attachments/NO_ATTACHMENTS.txt",
        "Este formulário não possui anexos armazenados ou os caminhos não estão disponíveis."
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
