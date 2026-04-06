"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "../../../lib/supabaseClient"
import { FormShell } from "../../../components/forms/FormShell"
import { QuestionRenderer } from "../../../components/forms/QuestionRenderer"

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
  section?: string
  required?: boolean
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

const supabase = getSupabaseClient()

/** ---------- Debounced saving helper ---------- */
const SAVE_DEBOUNCE_MS = 600
function useDebouncedSaves() {
  const timers = useRef<Record<string, any>>({})
  async function saveDebounced(
    code: string,
    value: any,
    saver: (code: string, value: any) => Promise<void>
  ) {
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
    typeof q?.answer === "string"
      ? q?.answer
      : typeof q?.answer?.value === "string"
      ? q?.answer?.value
      : ""
  if (fromAnswer && fromAnswer.includes("@")) return fromAnswer

  return ""
}

/** ---------- Section i18n ---------- */
const SECTION_I18N: Record<string, { en: string; es: string }> = {
  "Informações Iniciais":           { en: "Initial Information",         es: "Información Inicial" },
  "Estrutura Societária":           { en: "Corporate Structure",         es: "Estructura Societaria" },
  "Compliance":                     { en: "Compliance",                  es: "Cumplimiento" },
  "Operações":                      { en: "Operations",                  es: "Operaciones" },
  "Anexos":                         { en: "Attachments",                 es: "Anexos" },
  "D&O":                            { en: "D&O",                         es: "D&O" },
  "Cyber":                          { en: "Cyber",                       es: "Cyber" },
  "Claims":                         { en: "Claims",                      es: "Siniestros" },
  "Dados básicos da empresa":       { en: "Company Basics",              es: "Datos Básicos" },
  "Dados da Empresa":               { en: "Company Data",                es: "Datos de la Empresa" },
  "Dados do Proponente":            { en: "Applicant Data",              es: "Datos del Proponente" },
  "Informações da Empresa":         { en: "Company Information",         es: "Información de la Empresa" },
  "Informações do Solicitante":     { en: "Applicant Information",       es: "Información del Solicitante" },
  "Informações Adicionais":         { en: "Additional Information",      es: "Información Adicional" },
  "Governança Corporativa":         { en: "Corporate Governance",        es: "Gobernanza Corporativa" },
  "Proteção de Dados":              { en: "Data Protection",             es: "Protección de Datos" },
  "Gestão de Riscos":               { en: "Risk Management",             es: "Gestión de Riesgos" },
  "Gestão de riscos (RM)":          { en: "Risk Management (RM)",        es: "Gestión de Riesgos (RM)" },
  "Clientes":                       { en: "Clients",                     es: "Clientes" },
  "Fornecedores / Subcontratados":  { en: "Vendors / Subcontractors",    es: "Proveedores / Subcontratistas" },
  "Recursos Humanos":               { en: "Human Resources",             es: "Recursos Humanos" },
  "Departamento Legal":             { en: "Legal Department",            es: "Departamento Legal" },
  "Coberturas e Sinistros":         { en: "Coverage & Claims",           es: "Coberturas y Siniestros" },
  "Receitas e Empregados":          { en: "Revenue & Employees",         es: "Ingresos y Empleados" },
  "Continuidade do Negócio":        { en: "Business Continuity",         es: "Continuidad del Negocio" },
  "Auditoria":                      { en: "Audit",                       es: "Auditoría" },
  "Segurança de dados e continuidade de negócio (DS/BC)": { en: "Data Security & Business Continuity (DS/BC)", es: "Seguridad de Datos y Continuidad (DS/BC)" },
  "Segurança em identidade, credenciais e acesso (ICA)":  { en: "Identity, Credentials & Access (ICA)",       es: "Identidad, Credenciales y Acceso (ICA)" },
  "Monitorização de segurança e resposta a incidentes (SMIR)": { en: "Security Monitoring & Incident Response (SMIR)", es: "Monitoreo de Seguridad e Incidentes (SMIR)" },
  "Defesa ante malware (Mal)":      { en: "Malware Defense (Mal)",       es: "Defensa ante Malware (Mal)" },
  "Defesa ante phishing (PhD)":     { en: "Phishing Defense (PhD)",      es: "Defensa ante Phishing (PhD)" },
  "Defesa de Internet e perímetro": { en: "Internet & Perimeter Defense",es: "Defensa de Internet y Perímetro" },
  "Defesa de terceiros e MSP (TP & MSP)": { en: "Third-Party & MSP Defense (TP & MSP)", es: "Defensa de Terceros y MSP (TP & MSP)" },
  "Acesso e Recuperação de Dados":  { en: "Data Access & Recovery",      es: "Acceso y Recuperación de Datos" },
  "Aplicações de Internet":         { en: "Internet Applications",       es: "Aplicaciones de Internet" },
  "Atividade e Estabelecimentos":   { en: "Activity & Establishments",   es: "Actividad y Establecimientos" },
  "Atividades profissionais e detalhamento de receitas": { en: "Professional Activities & Revenue Details", es: "Actividades Profesionales y Detalle de Ingresos" },
  "Transferência de fundos e remessas": { en: "Fund Transfers & Remittances", es: "Transferencias de Fondos y Remesas" },
  "Experiência do risco":           { en: "Risk Experience",             es: "Experiencia del Riesgo" },
  "Controle do produto":            { en: "Product Control",             es: "Control del Producto" },
  "Produtos":                       { en: "Products",                    es: "Productos" },
  "Produtos ou Componentes não fabricados pela empresa": { en: "Products/Components Not Manufactured", es: "Productos/Componentes No Fabricados" },
  "Informações sobre perdas":       { en: "Loss Information",            es: "Información sobre Pérdidas" },
  "Informações sobre Perdas":       { en: "Loss Information",            es: "Información sobre Pérdidas" },
  "Valores em risco":               { en: "Values at Risk",              es: "Valores en Riesgo" },
  "Produção suspensa e/ou prevista":{ en: "Suspended/Planned Production",es: "Producción Suspendida/Prevista" },
  "Sistemas computadorizados":      { en: "Computerized Systems",        es: "Sistemas Computarizados" },
  "Limite / Importância Segurada":  { en: "Limit / Insured Amount",      es: "Límite / Suma Asegurada" },
  "Geral":                          { en: "General",                     es: "General" },
}

function translateSection(name: string, lang: string): string {
  const low = lang.toLowerCase()
  const entry = SECTION_I18N[name]
  if (!entry) return name
  if (low.startsWith("en")) return entry.en
  if (low.startsWith("es")) return entry.es
  return name
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

  // State
  const [payload, setPayload] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>("")
  const { saveDebounced } = useDebouncedSaves()
  const sections = useMemo(
    () => (payload ? buildSections(payload.questions, lang) : []),
    [payload, lang]
  )

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
        router.push(`/success?lang=${lang}`)
        return
      } else {
        // Not OK (missing required fields) -> inform user and keep on the form
        setSubmitting(false)
        alert("Faltam campos obrigatórios: " + (data?.missing_required || []).join(", "))
        // Optionally refresh the payload to show server-side validation state:
        try {
          const res = await supabase.rpc("sec_get_form_payload_v3", {
            p_lang: lang,
            p_token: token,
          })
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

  /** Build section tabs from question data */
  function buildSections(questions: Question[], currentLang: string) {
    const sectionMap = new Map<string, { label: string; questions: Question[] }>()
    for (const q of questions) {
      const sectionName = q.section || "Geral"
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, { label: translateSection(sectionName, currentLang), questions: [] })
      }
      sectionMap.get(sectionName)!.questions.push(q)
    }
    return Array.from(sectionMap.entries()).map(([key, val]) => ({
      id: key.toLowerCase().replace(/\s+/g, "-"),
      label: val.label,
      subtitle: "",
      totalFields: val.questions.length,
      completedFields: val.questions.filter((q) => {
        const ans = q.answer
        return (
          ans !== null &&
          ans !== undefined &&
          ans !== "" &&
          !(Array.isArray(ans) && ans.length === 0)
        )
      }).length,
    }))
  }

  /** Reload page with updated lang param */
  function handleLanguageChange(newLang: string) {
    const url = new URL(window.location.href)
    url.searchParams.set("lang", newLang)
    window.location.href = url.toString()
  }

  // -------- OUTLET --------
  if (loading) return <div className="p-6">Carregando…</div>
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>
  if (!payload) return <div className="p-6">Sem dados.</div>

  const locked = payload.form.status === "submitted"

  const effectiveSection = activeSection || sections[0]?.id || ""
  const visibleQuestions = effectiveSection
    ? payload.questions.filter((q) => {
        const sectionName = q.section || "Geral"
        return sectionName.toLowerCase().replace(/\s+/g, "-") === effectiveSection
      })
    : payload.questions

  const totalFields = payload.questions.length
  const completedFields = payload.questions.filter((q) => {
    const ans = q.answer
    return (
      ans !== null &&
      ans !== undefined &&
      ans !== "" &&
      !(Array.isArray(ans) && ans.length === 0)
    )
  }).length

  return (
    <FormShell
      company={payload.form.company}
      status={payload.form.status}
      onSubmit={submitForm}
      submitting={submitting}
      lang={lang}
      sections={sections}
      activeSection={effectiveSection}
      onSectionChange={(id) => setActiveSection(id)}
      totalFields={totalFields}
      completedFields={completedFields}
      onLanguageChange={handleLanguageChange}
    >
      {visibleQuestions.map((question, index) => (
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
