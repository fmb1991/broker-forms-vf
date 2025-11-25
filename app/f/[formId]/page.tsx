"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import { FormShell } from "../../../components/forms/FormShell"
import { QuestionRenderer } from "../../../components/forms/QuestionRenderer"

/** ---------- Simple UI i18n for form shell ---------- */
const FORM_UI_TEXT = {
  "pt-BR": {
    title: "Questionário de Seguros",
    companyLabel: "Empresa:",
    submit: "Enviar Questionário",
  },
  "es-419": {
    title: "Cuestionario de Seguros",
    companyLabel: "Empresa:",
    submit: "Enviar cuestionario",
  },
  en: {
    title: "Insurance Questionnaire",
    companyLabel: "Company:",
    submit: "Submit questionnaire",
  },
} as const

type LangCode = keyof typeof FORM_UI_TEXT

function pickFormUiText(lang: string | null): (typeof FORM_UI_TEXT)[LangCode] {
  const code = (lang || "pt-BR") as LangCode
  return FORM_UI_TEXT[code] ?? FORM_UI_TEXT["pt-BR"]
}

/** ---------- Types ---------- */
type TableSchemaField = {
  key: string
  type: "text" | "boolean" | "number" | "date" | "currency"
  label?: Record<string, string>
  required?: boolean
}

type Option = { value: string; label: string; order: number }
type TableRow = { row_index: number; row: Record<string, any> }

type Question = {
  code: string
  type:
    | "boolean"
    | "single_select"
    | "multi_select"
    | "date"
    | "currency"
    | "text"
    | "number"
    | "attachment"
    | "table"
  label: string
  help?: string
  config?: {
    currency?: string
    decimals?: number
    table_schema?: TableSchemaField[]
    max_mb?: number
    allowed?: string[]
  }
  options?: Option[]
  answer: any
  table_rows?: TableRow[]
}

type Payload = {
  form: { id: string; status: "draft" | "submitted"; company?: string; contact?: any }
  questions: Question[]
}

/** ---------- Debounced saving helper ---------- */
const SAVE_DEBOUNCE_MS = 600
function useDebouncedSaves() {
  const timers = useRef<Record<string, any>>({})
  async function saveDebounced(code: string, value: any, saver: (code: string, value: any) => Promise<void>) {
    if (timers.current[code]) clearTimeout(timers.current[code])
    timers.current[code] = setTimeout(async () => {
      try {
        await saver(code, value)
      } catch (e) {
        console.error(e)
      }
    }, SAVE_DEBOUNCE_MS)
  }
  return { saveDebounced }
}

/** ---------- Helpers ---------- */
function findSubmitterEmail(payload: Payload | null): string {
  if (!payload) return ""
  // 1) try payload.form.contact.email
  const contactEmail = payload.form?.contact?.email
  if (typeof contactEmail === "string" && contactEmail.includes("@")) return contactEmail

  // 2) try to find a question that looks like an email
  const q = payload.questions.find((qq) => {
    const inCode = qq.code?.toLowerCase().includes("email")
    const inLabel = qq.label?.toLowerCase?.().includes("email")
    return inCode || inLabel
  })
  const fromAnswer =
    typeof q?.answer === "string" ? q?.answer : typeof q?.answer?.value === "string" ? q?.answer?.value : ""
  if (fromAnswer && fromAnswer.includes("@")) return fromAnswer

  return ""
}

/** ---------- Page ---------- */
export default function FormPage({
  params,
  searchParams,
}: {
  params: { formId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const router = useRouter()

  // URL params
  const lang = ((searchParams?.lang as string) ?? "pt-BR").toString()
  const token = ((searchParams?.t as string) ?? "").toString()

  // UI text based on lang
  const ui = pickFormUiText(lang)

  // State
  const [payload, setPayload] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { saveDebounced } = useDebouncedSaves()

  // -------- LOAD --------
  useEffect(() => {
    if (!token) {
      setError("Link inválido: faltou o token (?t=...)")
      setLoading(false)
      return
    }
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc("sec_get_form_payload_v3", {
        p_lang: lang, // lang FIRST
        p_token: token, // token SECOND
      })
      if (error) setError(error.message)
      else setPayload(data as Payload)
      setLoading(false)
    })()
  }, [lang, token])

  // -------- HELPERS (local mutations) --------
  function mutateAnswerLocal(code: string, next: any) {
    setPayload((prev) => {
      if (!prev) return prev
      const i = prev.questions.findIndex((q) => q.code === code)
      if (i === -1) return prev
      const copy = structuredClone(prev)
      copy.questions[i].answer = next
      return copy
    })
  }

  function upsertRowLocal(code: string, rowIndex: number, row: Record<string, any>) {
    setPayload((prev) => {
      if (!prev) return prev
      const i = prev.questions.findIndex((q) => q.code === code)
      if (i === -1) return prev
      const copy = structuredClone(prev)
      const q = copy.questions[i]
      const rows = Array.isArray(q.table_rows) ? q.table_rows.slice() : []
      const idx = rows.findIndex((r) => r.row_index === rowIndex)
      if (idx === -1) rows.push({ row_index: rowIndex, row })
      else rows[idx] = { row_index: rowIndex, row }
      q.table_rows = rows
      return copy
    })
  }

  // -------- SAVE RPCs --------
  async function saveAnswer(code: string, value: any) {
    const { error } = await supabase.rpc("sec_upsert_answer_v3", {
      p_token: token,
      p_question_code: code,
      p_value_json: value,
    })
    if (error) throw error
  }

  async function saveTableRow(code: string, rowIndex: number, row: any) {
    const { error } = await supabase.rpc("sec_upsert_table_row_v3", {
      p_token: token,
      p_question_code: code,
      p_row_index: rowIndex,
      p_row_json: row,
    })
    if (error) throw error
  }

  // -------- SUBMIT (triggers HubSpot update before redirect) --------
  async function submitForm() {
    // Prevent double submits
    if (submitting) return
    setSubmitting(true)

    try {
      const { data, error } = await supabase.rpc("sec_submit_form_v3", { p_token: token })

      if (error) {
        setSubmitting(false)
        return alert("Erro: " + error.message)
      }

      if (data?.ok) {
        // 1) Successful submission -> trigger HubSpot update (non-blocking)
        const form_instance_id = payload?.form?.id
        const submitted_by_email = findSubmitterEmail(payload) || ""

        try {
          await fetch("/api/forms/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ form_instance_id, submitted_by_email }),
          })
        } catch (e) {
          // Never block the user if this fails
          console.warn("HubSpot call failed (non-blocking):", e)
        }

        // 2) Redirect to success page
        router.push("/success")
        return
      } else {
        // Not OK (missing required fields) -> inform user and keep on the form
        setSubmitting(false)
        alert("Faltam campos obrigatórios: " + (data?.missing_required || []).join(", "))
        // Optionally refresh the payload to show server-side validation state:
        try {
          const res = await supabase.rpc("sec_get_form_payload_v3", { p_lang: lang, p_token: token })
          if (!res.error) setPayload(res.data as Payload)
        } catch (e) {
          // ignore refresh errors
          console.error("Failed to refresh payload after failed submit:", e)
        }
      }
    } catch (e: any) {
      setSubmitting(false)
      console.error("submitForm error:", e)
      alert("Erro de rede: " + (e?.message || e))
    }
  }

  async function handleAddTableRow(code: string) {
    const question = payload?.questions.find((q) => q.code === code)
    if (!question) return

    const rows = question.table_rows || []
    const nextIndex = rows.length ? Math.max(...rows.map((r) => r.row_index)) + 1 : 0
    const empty: Record<string, any> = {}

    try {
      await saveTableRow(code, nextIndex, empty)
      upsertRowLocal(code, nextIndex, empty)
    } catch (error) {
      console.error("Error adding table row:", error)
    }
  }

  async function handleTableRowChange(code: string, rowIndex: number, row: Record<string, any>) {
    try {
      upsertRowLocal(code, rowIndex, row)
      await saveTableRow(code, rowIndex, row)
    } catch (error) {
      console.error("Error updating table row:", error)
    }
  }

  /** Optimistic save for simple field types */
  function handleFieldChange(code: string, value: any) {
    mutateAnswerLocal(code, value) // instant UI
    saveDebounced(code, value, saveAnswer) // save after pause
  }

  // -------- OUTLET --------
  if (loading) return <div className="p-6">Carregando…</div>
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>
  if (!payload) return <div className="p-6">Sem dados.</div>

  const locked = payload.form.status === "submitted"

  return (
    <FormShell
      company={payload.form.company}
      status={payload.form.status}
      onSubmit={submitForm}
      submitting={submitting}
      /* new props for i18n UI */
      title={ui.title}
      companyLabel={ui.companyLabel}
      submitLabel={ui.submit}
    >
      {payload.questions.map((question, index) => (
        <QuestionRenderer
          key={question.code}
          question={question}
          questionNumber={index + 1}
          locked={locked}
          onAnswerChange={handleFieldChange}
          onTableRowChange={handleTableRowChange}
          onAddTableRow={handleAddTableRow}
          token={token}
        />
      ))}
    </FormShell>
  )
}

/** ---------- Attachment widget (signed upload) ---------- */
function AttachmentWidget({
  code,
  token,
  disabled,
  onSaved,
}: {
  code: string
  token: string
  disabled?: boolean
  onSaved: (meta: any) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setErr(null)
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
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "Falha ao criar URL de upload")

      // upload the file directly to Supabase Storage
      const put = await fetch(j.uploadUrl, {
        method: "PUT",
        headers: { "content-type": j.contentType },
        body: file,
      })
      if (!put.ok) throw new Error("Falha no upload")

      // save answer with file metadata
      await onSaved({
        bucket: j.bucket,
        objectKey: j.objectKey,
        filename: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      })
      alert("Arquivo enviado com sucesso.")
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
      e.target.value = "" // reset input
    }
  }

  return (
    <div>
      <input type="file" disabled={disabled || busy} onChange={handleSelect} />
      {err && <div className="text-red-600 text-sm mt-2">Erro: {err}</div>}
    </div>
  )
}
