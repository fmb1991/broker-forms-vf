import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(req: Request, { params }: { params: { form_id: string } }) {
  const { adminSecret } = await req.json().catch(() => ({}));
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formId = params.form_id;
  const zip = new JSZip();

  // 1) PDF placeholder dentro del ZIP
  zip.file(`form_${formId}.pdf`, new Uint8Array([37,80,68,70,10,37,37,69,79,70]));

  // 2) Adjuntos desde storage (bucket "form-uploads")
  const { data: files } = await supabaseAdmin
    .from("form_files")
    .select("storage_path, filename")
    .eq("form_id", formId);

  if (files) {
    for (const f of files) {
      const { data, error } = await supabaseAdmin.storage.from("form-uploads").download(f.storage_path);
      if (!error && data) {
        const arr = await data.arrayBuffer();
        zip.file(`attachments/${f.filename || f.storage_path.split("/").pop()}`, arr);
      }
    }
  }

  const out = await zip.generateAsync({ type: "uint8array" });
  return new NextResponse(out, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="form_${formId}_attachments.zip"`,
    },
  });
}
