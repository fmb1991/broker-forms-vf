"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { FormShell, Payload } from "../../../components/forms/FormShell";

/**
 * Page that loads data via RPC and passes it to the design layer (FormShell + QuestionCard).
 * All data calls stay here so V0 can freely style the components.
 */
export default function FormPage({
  params,
  searchParams,
}: {
  params: { formId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const lang = ((searchParams?.lang as string) ?? "pt-BR").toString();
  const token = ((searchParams?.t as string) ?? "").toString();

  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load
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

  // Mutate local state helper
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

  // Save RPCs
  async function onSaveAnswer(code: string, value: any) {
    const { error } = await supabase.rpc("sec_upsert_answer_v3", {
      p_token: token,
      p_question_code: code,
      p_value_json: value,
    });
    if (error) throw error;
    mutateAnswerLocal(code, value);
  }

  async function onSaveTableRow(code: string, rowIndex: number, row: any) {
    const { error } = await supabase.rpc("sec_upsert_table_row_v3", {
      p_token: token,
      p_question_code: code,
      p_row_index: rowIndex,
      p_row_json: row,
    });
    if (error) throw error;
    upsertRowLocal(code, rowIndex, row);
  }

  async function onSubmitForm() {
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

  // Outlet
  if (loading) return <div className="p-6">Carregando…</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>;
  if (!payload) return <div className="p-6">Sem dados.</div>;

  return (
    <FormShell
      payload={payload}
      lang={lang}
      submitting={submitting}
      onSaveAnswer={onSaveAnswer}
      onSaveTableRow={onSaveTableRow}
      onSubmitForm={onSubmitForm}
    />
  );
}
