// app/api/formsadmin/pdf/[form_id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import path from "path";
import fs from "fs/promises";
import { pdf } from "@react-pdf/renderer";
import FortersFormPdf, { QAItem } from "@/pdf-templates/FortersFormPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { form_id: string } }) {
  try {
    const { adminSecret } = await req.json().catch(() => ({}));
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formId = params.form_id;

    // 1) Form data
    const { data: form, error: formErr } = await supabaseAdmin
      .from("form_instances")
      .select("id, template_id, language, created_at, respondent_company")
      .eq("id", formId)
      .single();

    if (formErr || !form) {
      return NextResponse.json({ error: formErr?.message || "form_not_found" }, { status: 404 });
    }

    // 2) Questions for this template
    const { data: questions, error: qErr } = await supabaseAdmin
      .from("template_questions")
      .select("id, order, label_json, type")
      .eq("template_id", form.template_id)
      .order("order", { ascending: true });

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    // 3) Answers for this form
    // NOTE: adapt the column if your schema stores the answer differently
    const { data: answers, error: aErr } = await supabaseAdmin
      .from("form_answers")
      .select("question_id, answer_json, answer_text, value_json, value_text")
      .eq("form_id", formId);

    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 500 });
    }

    // 4) Attachments list (names only; files will be in ZIP route)
    const { data: files } = await supabaseAdmin
      .from("form_files")
      .select("filename")
      .eq("form_id", formId);

    // 5) Build QA rows
    const answerMap = new Map<number, string>();
    for (const a of answers || []) {
      const val =
        // try multiple fields to be schema-robust
        (a.answer_text as string) ??
        (a.value_text as string) ??
        (typeof (a.answer_json as any)?.value === "string" ? (a.answer_json as any).value : undefined) ??
        (typeof (a.value_json as any)?.value === "string" ? (a.value_json as any).value : undefined) ??
        JSON.stringify(a.answer_json ?? a.value_json ?? "");
      answerMap.set(a.question_id as number, val);
    }

    const qaItems: QAItem[] = (questions || []).map((q: any) => {
      // label_json: { "pt-BR": "...", "es-419": "...", "en": "..." }
      const label = typeof q.label_json === "object"
        ? q.label_json[form.language] || q.label_json["pt-BR"] || q.label_json["en"] || q.label_json["es-419"]
        : (q.label_json || "");
      const answer = answerMap.get(q.id) || "";
      return { order: q.order ?? 0, question: String(label || `Pergunta #${q.id}`), answer: String(answer || "") };
    });

    // 6) Read Forters logo as data URL (from /public)
    let logoDataUrl = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "forters-logo.jpeg");
      const bytes = await fs.readFile(logoPath);
      logoDataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
    } catch {
      // no logo available, fine
      logoDataUrl = "";
    }

    // 7) Static broker info (as requested)
    const brokerInfo = {
      name: "Forters Corretora de Seguros LTDA",
      cnpj: "50.236.609/0001-32",
      susep: "2321454513",
    };

    // 8) Build PDF buffer
    const instance = (
      <FortersFormPdf
        logoDataUrl={logoDataUrl}
        companyName={form.respondent_company || "-"}
        filledAt={form.created_at}
        language={form.language}
        brokerInfo={brokerInfo}
        qaItems={qaItems}
        attachments={(files || []).map((f) => ({ filename: f.filename || "" }))}
      />
    );

    const pdfBuffer = await pdf(instance).toBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="form_${formId}.pdf"`,
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

