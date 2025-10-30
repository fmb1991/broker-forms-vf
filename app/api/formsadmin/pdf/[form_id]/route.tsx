// app/api/formsadmin/pdf/[form_id]/route.tsx
import React from "react";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import path from "path";
import fs from "fs/promises";
import { pdf } from "@react-pdf/renderer";
import FortersFormPdf, { QAItem } from "@/pdf-templates/FortersFormPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Helpers to format answers coming from value_json by question type */
function fmtBoolean(v: any) {
  const b = typeof v === "boolean" ? v : v?.value ?? v?.val;
  return b === true ? "Sim" : b === false ? "Não" : "-";
}
function fmtArray(v: any) {
  const arr = Array.isArray(v) ? v : v?.values || v?.options || [];
  return arr.map((x) => (typeof x === "string" ? x : x?.label ?? x?.value ?? JSON.stringify(x))).join(", ");
}
function fmtScalar(v: any) {
  const raw = v?.value ?? v?.val ?? v;
  if (raw == null) return "-";
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "string") return raw;
  return JSON.stringify(raw);
}
function fmtCurrency(v: any) {
  const amount = Number(v?.amount ?? v?.value ?? v);
  if (Number.isFinite(amount)) return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return fmtScalar(v);
}
function fmtDate(v: any) {
  const iso = v?.date ?? v?.value ?? v;
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(+d) ? d.toLocaleDateString("pt-BR") : fmtScalar(v);
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

    // 1) Form data
    const { data: form, error: formErr } = await supabaseAdmin
      .from("form_instances")
      .select("id, template_id, language, created_at, respondent_company")
      .eq("id", formId)
      .single();
    if (formErr || !form) {
      return NextResponse.json(
        { error: formErr?.message || "form_not_found" },
        { status: 404 }
      );
    }

    // 2) Questions for this template
    const { data: questions, error: qErr } = await supabaseAdmin
      .from("template_questions")
      .select("id, order, label_json, type, config_json")
      .eq("template_id", form.template_id)
      .order("order", { ascending: true });
    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    // 3) Answers for this form (NOTE: only value_json exists in your schema)
    const { data: answers, error: aErr } = await supabaseAdmin
      .from("form_answers")
      .select("question_id, value_json")
      .eq("form_id", formId);
    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 500 });
    }

    // 4) Table rows (each row as JSON payload)
    const { data: tableRows } = await supabaseAdmin
      .from("form_table_rows")
      .select("question_id, row_index, row_json")
      .eq("form_id", formId);

    // 5) Attachments (names only; files are downloaded in the ZIP route)
    const { data: files } = await supabaseAdmin
      .from("form_files")
      .select("filename")
      .eq("form_id", formId);

    // Build maps for quick lookup
    const answerMap = new Map<number, any>();
    for (const a of answers || []) {
      answerMap.set(a.question_id as number, a.value_json);
    }

    const tableMap = new Map<number, any[]>();
    for (const r of tableRows || []) {
      const list = tableMap.get(r.question_id) || [];
      list.push(r);
      tableMap.set(r.question_id, list);
    }

    // 6) Build QA rows with formatting by question type
    const qaItems: QAItem[] = (questions || []).map((q: any) => {
      // Localized label
      const label =
        typeof q.label_json === "object"
          ? q.label_json[form.language] ||
            q.label_json["pt-BR"] ||
            q.label_json["en"] ||
            q.label_json["es-419"]
          : q.label_json || "";

      let answerStr = "-";
      const val = answerMap.get(q.id);

      switch (q.type) {
        case "boolean":
          answerStr = fmtBoolean(val);
          break;
        case "one_choice":
        case "oneChoice":
        case "select":
        case "radio":
          answerStr = fmtScalar(val); // often { value: "X" } or "X"
          break;
        case "multiple_choice":
        case "multipleChoice":
        case "checkbox":
          answerStr = fmtArray(val);
          break;
        case "date":
          answerStr = fmtDate(val);
          break;
        case "currency":
          answerStr = fmtCurrency(val);
          break;
        case "number":
          answerStr = fmtScalar(val);
          break;
        case "text":
        case "long_text":
        case "longText":
          answerStr = fmtScalar(val);
          break;
        case "attachment":
          // attachments are listed separately; show a friendly note
          answerStr = "Ver seção de anexos na capa";
          break;
        case "table": {
          const rows = tableMap.get(q.id) || [];
          // You can expand this to render table detail per row if desired.
          answerStr = rows.length ? `${rows.length} linha(s) informada(s)` : "-";
          break;
        }
        default:
          // fallback
          answerStr = fmtScalar(val);
      }

      return {
        order: q.order ?? 0,
        question: String(label || `Pergunta #${q.id}`),
        answer: String(answerStr || "-"),
      };
    });

    // 7) Forters logo (from /public/forters-logo.jpeg)
    let logoDataUrl = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "forters-logo.jpeg");
      const bytes = await fs.readFile(logoPath);
      logoDataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
    } catch {
      logoDataUrl = "";
    }

    // 8) Static broker info
    const brokerInfo = {
      name: "Forters Corretora de Seguros LTDA",
      cnpj: "50.236.609/0001-32",
      susep: "2321454513",
    };

    // 9) Render PDF
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


