"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/** ---------- Types ---------- */
type TableSchemaField = {
  key: string;
  type: "text" | "boolean" | "number" | "date" | "currency";
  label?: Record<string, string>;
  required?: boolean;
};

type Option = { value: string; label: string; order: number };
type TableRow = { row_index: number; row: Record<string, any> };

type Question = {
  code: string;
  type:
    | "boolean"
    | "single_select"
    | "multi_select"
    | "date"
    | "currency"
    | "text"
    | "number"
    | "attachment"
    | "table";
  label: string;
  help?: string;
  config?: {
    currency?: string;
    decimals?: number;
    table_schema?: TableSchemaField[];
    max_mb?: number;
    allowed?: string[];
  };
  options?: Option[];
  answer: any;
  table_rows?: TableRow[];
};

type Payload = {
  form: { id: string; status: "draft" | "submitted"; company?: string; contact?: any };
  questions: Question[];
};

/** ---------- Debounced saving helper ---------- */
const SAVE_DEBOUNCE_MS = 600;
function useDebouncedSaves() {
  const timers = useRef<Record<string, any>>({});
  async function saveDebounced(
    code: string,
    value: any,
    saver: (code: string, value: any) => Promise<void>
  ) {
    if (timers.current[code]) clearTimeout(timers.current[code]);
    timers.current[code] = setTimeout(async () => {
      try {
        await saver(code, value);
      } catch (e) {
        console.error(e);
      }
    }, SAVE_DEBOUNCE_MS);
  }
  return { saveDebounced };
}

/** ---------- Page ---------- */
export default function FormPage({
  params,
  searchParams,
}: {
  params: { formId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // URL params
  const lang = ((searchParams?.lang as string) ?? "pt-BR").toString();
  const token = ((searchParams?.t as string) ?? "").toString();

  // State
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveDebounced } = useDebouncedSaves();

  // -------- LOAD --------
  useEffect(() => {
    if (!token) {
      setError("Link inválido: faltou o token (?t=...)");
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("sec_get_form_payload_v3", {
        p_lang: lang, // lang FIRST
        p_token: token, // token SECOND
      });
      if (error) setError(error.message);
      else setPayload(data as Payload);
      setLoading(false);
    })();
  }, [lang, token]);

  // -------- HELPERS (local mutations) --------
  function mutateAnswerLocal(code: string, next: any) {
    setPayload((prev) => {
      if (!prev) return prev;
      const i = prev.questions.findIndex((q) => q.code === code);
      if (i === -1) return prev;
      const copy = structuredClone(prev);
      copy.questions[i].answer = next;
      return copy;
    });
  }

  function upsertRowLocal(code: string, rowIndex: number, row: Record<string, any>) {
    setPayload((prev) => {
      if (!prev) return prev;
      const i = prev.questions.findIndex((q) => q.code === code);
      if (i === -1) return prev;
      const copy = structuredClone(prev);
      const q = copy.questions[i];
      const rows = Array.isArray(q.table_rows) ? q.table_rows.slice() : [];
      const idx = rows.findIndex((r) => r.row_index === rowIndex);
      if (idx === -1) rows.push({ row_index: rowIndex, row });
      else rows[idx] = { row_index: rowIndex, row };
      q.table_rows = rows;
      return copy;
    });
  }

  // -------- SAVE RPCs --------
  async function saveAnswer(code: string, value: any) {
    const { error } = await supabase.rpc("sec_upsert_answer_v3", {
      p_token: token,
      p_question_code: code,
      p_value_json: value,
    });
    if (error) throw error;
  }

  async function saveTableRow(code: string, rowIndex: number, row: any) {
    const { error } = await supabase.rpc("sec_upsert_table_row_v3", {
      p_token: token,
      p_question_code: code,
      p_row_index: rowIndex,
      p_row_json: row,
    });
    if (error) throw error;
  }

  async function submitForm() {
    setSubmitting(true);
    const { data, error } = await supabase.rpc("sec_submit_form_v3", { p_token: token });
    setSubmitting(false);
    if (error) return alert("Erro: " + error.message);
    if (data?.ok) {
      alert("Formulário enviado!");
      const res = await supabase.rpc("sec_get_form_payload_v3", { p_lang: lang, p_token: token });
      if (!res.error) setPayload(res.data as Payload);
    } else {
      alert("Faltam campos obrigatórios: " + (data?.missing_required || []).join(", "));
    }
  }

  // -------- Common label --------
  function renderLabel(q: Question) {
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600 }}>{q.label}</div>
        {!!q.help && <div style={{ color: "#6b7280", fontSize: 13 }}>{q.help}</div>}
      </div>
    );
  }

  // -------- Currency --------
  function renderCurrencyInput(q: Question) {
    const decimals = q.config?.decimals ?? 2;
    const currency = q.config?.currency ?? "BRL";
    const cents = q.answer?.amount_cents ?? null;
    const display = cents != null ? (cents / 100).toFixed(decimals) : "";

    return (
      <div className="border rounded p-4 mb-3">
        {renderLabel(q)}
        <div className="flex items-center gap-2">
          <span>{currency === "BRL" ? "R$" : currency}</span>
          <input
            className="border rounded p-2"
            placeholder={(0).toFixed(decimals)}
            value={display}
            onChange={(e) => {
              const clean = e.target.value.replace(/\./g, "").replace(",", ".");
              const num = Number.isFinite(Number(clean)) ? Number(clean) : 0;
              const next = { amount_cents: Math.round(num * 10 ** decimals), currency };
              mutateAnswerLocal(q.code, next);                 // instant UI
              saveDebounced(q.code, next, saveAnswer);         // save after pause
            }}
            disabled={payload?.form.status === "submitted"}
          />
        </div>
      </div>
    );
  }

  // -------- Table (multiple text rows etc.) --------
  function renderTable(q: Question) {
    const schema = q.config?.table_schema || [];
    const rows = q.table_rows || [];
    const locked = payload?.form.status === "submitted";

    async function addRow() {
      const nextIndex = rows.length ? Math.max(...rows.map((r) => r.row_index)) + 1 : 0;
      const empty: Record<string, any> = {};
      await saveTableRow(q.code, nextIndex, empty);
      upsertRowLocal(q.code, nextIndex, empty);
    }

    async function updateCell(rowIndex: number, key: string, val: any) {
      const target = rows.find((r) => r.row_index === rowIndex);
      const newRow = { ...(target?.row || {}), [key]: val };
      upsertRowLocal(q.code, rowIndex, newRow); // optimistic
      await saveTableRow(q.code, rowIndex, newRow);
    }

    function fieldLabel(f: TableSchemaField) {
      if (!f.label) return f.key;
      return f.label[lang] || f.label["pt-BR"] || f.label["en"] || f.key;
    }

    return (
      <div className="border rounded p-4 mb-3">
        {renderLabel(q)}
        {/* header */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${schema.length}, 1fr)`, gap: 12 }}
        >
          {schema.map((f) => (
            <div key={`hdr-${f.key}`} style={{ fontWeight: 600 }}>
              {fieldLabel(f)}
            </div>
          ))}
        </div>

        {/* rows */}
        <div>
          {rows.map((r) => (
            <div
              key={r.row_index}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${schema.length}, 1fr)`,
                gap: 12,
                marginTop: 8,
              }}
            >
              {schema.map((f) => {
                const v = r.row?.[f.key];
                if (f.type === "boolean") {
                  return (
                    <label key={`${r.row_index}-${f.key}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!v}
                        onChange={(e) => updateCell(r.row_index, f.key, e.target.checked)}
                        disabled={locked}
                      />
                      {fieldLabel(f)}
                    </label>
                  );
                }
                if (f.type === "number") {
                  return (
                    <input
                      key={`${r.row_index}-${f.key}`}
                      className="border rounded p-2"
                      type="number"
                      value={v ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        updateCell(r.row_index, f.key, val);
                      }}
                      disabled={locked}
                    />
                  );
                }
                if (f.type === "date") {
                  return (
                    <input
                      key={`${r.row_index}-${f.key}`}
                      className="border rounded p-2"
                      type="date"
                      value={(v as string) || ""}
                      onChange={(e) => updateCell(r.row_index, f.key, e.target.value)}
                      disabled={locked}
                    />
                  );
                }
                // default text
                return (
                  <input
                    key={`${r.row_index}-${f.key}`}
                    className="border rounded p-2"
                    value={v ?? ""}
                    onChange={(e) => updateCell(r.row_index, f.key, e.target.value)}
                    disabled={locked}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {!locked && (
          <div style={{ marginTop: 12 }}>
            <button className="px-3 py-2 rounded border" onClick={addRow}>
              Adicionar linha
            </button>
          </div>
        )}
      </div>
    );
  }

  /** Optimistic save for simple field types */
  function handleFieldChange(code: string, value: any) {
    mutateAnswerLocal(code, value);             // instant UI
    saveDebounced(code, value, saveAnswer);     // save after pause
  }

  // -------- Question renderer --------
  function renderQuestion(q: Question) {
    const locked = payload?.form.status === "submitted";

    switch (q.type) {
      case "boolean":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <label className="mr-4">
              <input
                type="radio"
                checked={q.answer === true}
                onChange={() => handleFieldChange(q.code, true)}
                disabled={locked}
              />{" "}
              Sim
            </label>
            <label>
              <input
                type="radio"
                checked={q.answer === false}
                onChange={() => handleFieldChange(q.code, false)}
                disabled={locked}
              />{" "}
              Não
            </label>
          </div>
        );

      case "single_select":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <select
              className="border rounded p-2 w-full"
              value={q.answer ?? ""}
              onChange={(e) => handleFieldChange(q.code, e.target.value)}
              disabled={locked}
            >
              <option value="" disabled>
                Selecione
              </option>
              {(q.options || []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "multi_select":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <div className="flex flex-wrap gap-4">
              {(q.options || []).map((o) => {
                const checked = Array.isArray(q.answer) && q.answer.includes(o.value);
                return (
                  <label key={o.value}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const set = new Set(Array.isArray(q.answer) ? q.answer : []);
                        if (e.target.checked) set.add(o.value);
                        else set.delete(o.value);
                        handleFieldChange(q.code, Array.from(set));
                      }}
                      disabled={locked}
                    />{" "}
                    {o.label}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case "date":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <input
              type="date"
              className="border rounded p-2"
              value={(q.answer as string) || ""}
              onChange={(e) => handleFieldChange(q.code, e.target.value)}
              onBlur={() => saveAnswer(q.code, q.answer)}
              disabled={locked}
            />
          </div>
        );

      case "currency":
        return <div key={q.code}>{renderCurrencyInput(q)}</div>;

      case "text":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <textarea
              className="border rounded p-2 w-full"
              value={(q.answer as string) ?? ""}
              onChange={(e) => handleFieldChange(q.code, e.target.value)}
              onBlur={() => saveAnswer(q.code, q.answer)}
              disabled={locked}
            />
          </div>
        );

      case "number":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <input
              className="border rounded p-2"
              type="number"
              value={q.answer ?? ""}
              onChange={(e) => {
                const n = e.target.value === "" ? null : Number(e.target.value);
                handleFieldChange(q.code, n);
              }}
              onBlur={() => saveAnswer(q.code, q.answer)}
              disabled={locked}
            />
          </div>
        );

      case "attachment":
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <AttachmentWidget
              code={q.code}
              token={token}
              disabled={locked}
              onSaved={async (meta) => {
                await saveAnswer(q.code, meta);
                mutateAnswerLocal(q.code, meta);
              }}
            />
            {q.answer?.filename && (
              <div className="text-sm text-gray-600 mt-2">
                Arquivo enviado: <strong>{q.answer.filename}</strong>
              </div>
            )}
          </div>
        );

      case "table":
        return <div key={q.code}>{renderTable(q)}</div>;

      default:
        return (
          <div key={q.code} className="border rounded p-4 mb-3">
            {renderLabel(q)}
            <div>Tipo não suportado: {q.type}</div>
          </div>
        );
    }
  }

  // -------- OUTLET --------
  if (loading) return <div className="p-6">Carregando…</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>;
  if (!payload) return <div className="p-6">Sem dados.</div>;

  const locked = payload.form.status === "submitted";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Questionário</h1>
      <div className="text-gray-600 mb-6">
        Empresa: {payload.form.company || ""}{" "}
        {locked && <span style={{ color: "#10b981", fontWeight: 600 }}>— Enviado</span>}
      </div>

      {payload.questions.map((q) => renderQuestion(q))}

      <div className="flex justify-end mt-6">
        <button className="px-3 py-2 rounded border" disabled={submitting || locked} onClick={submitForm}>
          {locked ? "Enviado" : submitting ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}

/** ---------- Attachment widget (signed upload) ---------- */
function AttachmentWidget({
  code,
  token,
  disabled,
  onSaved,
}: {
  code: string;
  token: string;
  disabled?: boolean;
  onSaved: (meta: any) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      // ask API to create a signed upload URL
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          questionCode: code,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao criar URL de upload");

      // upload the file directly to Supabase Storage
      const put = await fetch(j.uploadUrl, {
        method: "PUT",
        headers: { "content-type": j.contentType },
        body: file,
      });
      if (!put.ok) throw new Error("Falha no upload");

      // save answer with file metadata
      await onSaved({
        bucket: j.bucket,
        objectKey: j.objectKey,
        filename: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
      alert("Arquivo enviado com sucesso.");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
      e.target.value = ""; // reset input
    }
  }

  return (
    <div>
      <input type="file" disabled={disabled || busy} onChange={handleSelect} />
      {err && <div className="text-red-600 text-sm mt-2">Erro: {err}</div>}
    </div>
  );
}
