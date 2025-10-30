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

/** normalize: if a string contains JSON (e.g. '["Brasil"]'), parse it */
function normalize(v: any) {
  if (typeof v === "string") {
    const s = v.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try { return JSON.parse(s); } catch { /* ignore */ }
    }
  }
  return v;
}

/** format helpers */
function fmtBoolean(v: any) {
  const vv = normalize(v);
  const b = typeof vv === "boolean" ? vv : vv?.value ?? vv?.val;
  return b === true ? "Sim" : b === false ? "Não" : "-";
}
function fmtArray(v: any) {
  const vv = normalize(v);
  const arr = Array.isArray(vv) ? vv : vv?.values || vv?.options || [];
  return arr
    .map((x) => (typeof x === "string" ? x : x?.label ?? x?.value ?? JSON.stringify(x)))
    .join(", ");
}
function fmtScalar(v: any) {
  const vv = normalize(v);
  const raw = vv?.value ?? vv?.val ?? vv;
  if (raw == null) return "-";
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "string") return raw;
  return JSON.stringify(raw);
}
function fmtCurrency(v: any) {
  const vv = normalize(v);
  const amount = Number(vv?.amount ?? vv?.value ?? vv);
  if (Number.isFinite(amount))
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return fmtScalar(v);
}
function fmtDate(v: any) {
  const vv = normalize(v);
  const iso = vv?.date ?? vv?.value ?? vv;
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(+d) ? d.toLocaleDateString("pt-BR") : fmtScalar(v);
}

/** Convert a table row object into a compact line "Col1: v | Col2: v" */
function tableRowToLine(rowObj: Record<string, any>) {
  const pairs = Object.entries(rowObj || {}).map(([k, val]) => {
    const v =
      typeof val === "string" || typeof val === "number"
        ? String(val)
        : Array.isArray(val)
        ? val.join(", ")
        : val?.label ?? val?.value ?? JSON.stringify(val ?? "");
    return `${k}: ${v}`;
  });
  return pairs.join(" | ");
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

    // 1) form
    const { data: form, error: formErr } = await supabaseAdmin
      .from("form_instances")
      .select("id, template_id, language, created_at, respondent_company")
      .eq("id", formId)
      .single();
    if (formErr || !form) {
      return NextResponse.json({ error: formErr?.message || "form_not_found" }, { status: 404 });
    }

    // 2) template (to show a human-friendly "formName")
    const { data: tpl } = await supabaseAdmin
      .from("form_templates")
      .select("slug, product_code, industry_code, version")
      .eq("id", form.template_id)
      .single();
    const formName =
      (tpl?.product_code ? `${tpl.product_code}` : "") +
      (tpl?.industry_code ? ` • ${tpl.industry_code}` : "") +
      (tpl?.version ? ` • v${tpl.version}` : "") ||
      tpl?.slug ||
      "Formulário";

    // 3) questions
    const { data: questions, error: qErr } = await supabaseAdmin
      .from("template_questions")
      .select("id, order, label_json, type")
      .eq("template_id", form.template_id)
      .order("order", { ascending: true });
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

    // 4) answers (schema has only value_json)
    const { data: answers, error: aErr } = await supabaseAdmin
      .from("form_answers")
      .select("question_id, value_json")
      .eq("form_id", formId);
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    // 5) table rows
    const { data: tableRows } = await supabaseAdmin
      .from("form_table_rows")
      .select("question_id, row_index, row_json")
      .eq("form_id", formId);

    // 6) attachments
    const { data: files } = await supabaseAdmin
      .from("form_files")
      .select("filename")
      .eq("form_id", formId);

    // maps
    const answerMap = new Map<number, any>();
    for (const a of answers || []) answerMap.set(a.question_id as number, a.value_json);

    const tableMap = new Map<number, any[]>();
    for (const r of tableRows || []) {
      const list = tableMap.get(r.question_id) || [];
      list.push(r);
      tableMap.set(r.question_id, list);
    }

    // 7) Build Q&A
    const qaItems: QAItem[] = (questions || []).map((q: any) => {
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
          answerStr = fmtScalar(val);
          break;
        case "multiple_choice":
        case "multipleChoice":
        case "checkbox":
          answerStr = fmtArray(val); // ensures ["Brasil"] -> Brasil
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
          answerStr = "Ver seção de anexos na capa";
          break;
        case "table": {
          const rows = (tableMap.get(q.id) || []).sort(
            (a: any, b: any) => (a.row_index ?? 0) - (b.row_index ?? 0)
          );
          if (!rows.length) {
            answerStr = "-";
          } else {
            const lines = rows.map((r) => {
              const obj =
                typeof r.row_json === "string" ? normalize(r.row_json) : r.row_json || {};
              return `• ${tableRowToLine(obj as Record<string, any>)}`;
            });
            answerStr = lines.join("\n"); // 👈 multiline text inside the cell
          }
          break;
        }
        default:
          answerStr = fmtScalar(val);
      }

      return {
        order: q.order ?? 0,
        question: String(label || `Pergunta #${q.id}`),
        answer: String(answerStr || "-"),
      };
    });

    // 8) logo
    let logoDataUrl = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "forters-logo.jpeg");
      const bytes = await fs.readFile(logoPath);
      logoDataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
    } catch { /* ignore */ }

    // 9) broker info
    const brokerInfo = {
      name: "Forters Corretora de Seguros LTDA",
      cnpj: "50.236.609/0001-32",
      susep: "2321454513",
    };

    // 10) render
    const instance = (
      <FortersFormPdf
        logoDataUrl={logoDataUrl}
        companyName={form.respondent_company || "-"}
        formName={formName}                // 👈 show on cover
        filledAt={form.created_at}
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
    return NextResponse.json({ error: err?.message || "internal_error" }, { status: 500 });
  }
}

