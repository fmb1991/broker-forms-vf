import { NextResponse } from "next/server";
// import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
// import { renderToBuffer } from "@react-pdf/renderer";
// import { PdfDocument } from "@/pdf-templates/dno-ptbr";

export async function POST(req: Request, { params }: { params: { form_id: string } }) {
  const { adminSecret } = await req.json().catch(() => ({}));
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO: leer data real y renderizar PDF con @react-pdf/renderer
  // Por ahora devolvemos un PDF mínimo válido (placeholder) para probar el flujo:
  const pdfBytes = new Uint8Array([37,80,68,70,45,49,46,52,10,37,45,45,45,10,37,37,69,79,70]); // %PDF-1.4...\n%%EOF
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="form_${params.form_id}.pdf"`,
    },
  });
}
