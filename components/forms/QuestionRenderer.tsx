"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, FileText } from "lucide-react"

/* =========================
   Types (extended for tables)
   ========================= */

type I18n = Record<string, string>

type TableSchemaField = {
  key: string
  type: "text" | "boolean" | "number" | "date" | "currency"
  label?: I18n
  required?: boolean
  readonly?: boolean
  // future: options?: { value: string; label: I18n }[]
}

type TableRow = { row_index: number; row: Record<string, any> }

/** NEW: table config contract (backwards compatible) */
type TableConfig = {
  currency?: string
  decimals?: number
  table_schema?: TableSchemaField[]
  max_mb?: number
  allowed?: string[]

  // NEW for fixed tables
  mode?: "dynamic" | "fixed"              // default: dynamic
  allow_add_rows?: boolean                // default: true
  allow_delete_rows?: boolean             // default: true
  table_rows?: Array<{
    code: string
    title?: I18n
    subtitle?: I18n
  }>
}

type Option = { value: string; label: string; order: number }

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
  config?: TableConfig
  options?: Option[]
  answer: any
  /** dynamic tables (current behavior) */
  table_rows?: TableRow[]
}

type QuestionRendererProps = {
  question: Question
  questionNumber: number
  sectionTitle?: string
  locked: boolean
  onAnswerChange: (code: string, value: any) => void
  onTableRowChange?: (code: string, rowIndex: number, row: Record<string, any>) => void
  onAddTableRow?: (code: string) => void
  token?: string
}

/* =========================
   Helpers
   ========================= */

function i18nPick(obj?: I18n, locale = "pt-BR", fallback = "") {
  if (!obj) return fallback
  return obj[locale] ?? obj["pt-BR"] ?? obj["en"] ?? Object.values(obj)[0] ?? fallback
}

export function QuestionRenderer({
  question,
  questionNumber,
  sectionTitle,
  locked,
  onAnswerChange,
  onTableRowChange,
  onAddTableRow,
  token,
}: QuestionRendererProps) {
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const renderSectionTitle = () => {
    if (!sectionTitle) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-slate-300 flex-1" />
          <h2 className="text-lg font-semibold text-slate-700 px-4 py-2 bg-slate-100 rounded-full">{sectionTitle}</h2>
          <div className="h-px bg-slate-300 flex-1" />
        </div>
      </div>
    )
  }

  const renderQuestionHeader = () => (
    <CardHeader className="pb-4">
      <div className="flex items-start gap-3">
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 font-semibold min-w-8 h-8 flex items-center justify-center rounded-full"
        >
          {questionNumber}
        </Badge>
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-slate-800 leading-relaxed">{question.label}</CardTitle>
          {question.help && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{question.help}</p>}
        </div>
      </div>
    </CardHeader>
  )

  /* ========= Scalars ========= */

  const renderBooleanQuestion = () => (
    <CardContent>
      <RadioGroup
        value={question.answer === true ? "true" : question.answer === false ? "false" : ""}
        onValueChange={(value) => onAnswerChange(question.code, value === "true")}
        disabled={locked}
        className="flex gap-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="true" id={`${question.code}-true`} />
          <Label htmlFor={`${question.code}-true`} className="font-medium text-slate-700">
            Sim
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="false" id={`${question.code}-false`} />
          <Label htmlFor={`${question.code}-false`} className="font-medium text-slate-700">
            Não
          </Label>
        </div>
      </RadioGroup>
    </CardContent>
  )

  const renderSingleSelect = () => (
    <CardContent>
      <Select value={question.answer || ""} onValueChange={(value) => onAnswerChange(question.code, value)} disabled={locked}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione uma opção" />
        </SelectTrigger>
        <SelectContent>
          {(question.options || []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardContent>
  )

  const renderMultiSelect = () => (
    <CardContent>
      <div className="space-y-3">
        {(question.options || []).map((option) => {
          const checked = Array.isArray(question.answer) && question.answer.includes(option.value)
          return (
            <div key={option.value} className="flex items-center space-x-3">
              <Checkbox
                id={`${question.code}-${option.value}`}
                checked={checked}
                onCheckedChange={(isChecked) => {
                  const currentValues = Array.isArray(question.answer) ? question.answer : []
                  const newValues = isChecked
                    ? [...currentValues, option.value]
                    : currentValues.filter((v) => v !== option.value)
                  onAnswerChange(question.code, newValues)
                }}
                disabled={locked}
              />
              <Label htmlFor={`${question.code}-${option.value}`} className="font-medium text-slate-700">
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>
    </CardContent>
  )

  const renderTextQuestion = () => (
    <CardContent>
      <Textarea
        value={(question.answer as string) || ""}
        onChange={(e) => onAnswerChange(question.code, e.target.value)}
        placeholder="Digite sua resposta..."
        disabled={locked}
        className="min-h-24 resize-none"
      />
    </CardContent>
  )

  const renderNumberQuestion = () => (
    <CardContent>
      <Input
        type="number"
        value={question.answer || ""}
        onChange={(e) => {
          const value = e.target.value === "" ? null : Number(e.target.value)
          onAnswerChange(question.code, value)
        }}
        placeholder="Digite um número"
        disabled={locked}
      />
    </CardContent>
  )

  const renderDateQuestion = () => (
    <CardContent>
      <Input type="date" value={(question.answer as string) || ""} onChange={(e) => onAnswerChange(question.code, e.target.value)} disabled={locked} />
    </CardContent>
  )

  const renderCurrencyQuestion = () => {
    const decimals = question.config?.decimals ?? 2
    const currency = question.config?.currency ?? "BRL"
    const cents = question.answer?.amount_cents ?? null
    const display = cents != null ? (cents / 100).toFixed(decimals) : ""

    return (
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">{currency === "BRL" ? "R$" : currency}</span>
          <Input
            value={display}
            onChange={(e) => {
              const clean = e.target.value.replace(/\./g, "").replace(",", ".")
              const num = Number.isFinite(Number(clean)) ? Number(clean) : 0
              const next = { amount_cents: Math.round(num * 10 ** decimals), currency }
              onAnswerChange(question.code, next)
            }}
            placeholder={(0).toFixed(decimals)}
            disabled={locked}
            className="flex-1"
          />
        </div>
      </CardContent>
    )
  }

  /* ========= Attachments ========= */

  const renderAttachmentQuestion = () => {
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !token) return

      setUploadBusy(true)
      setUploadError(null)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            questionCode: question.code,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Falha ao criar URL de upload")

        const uploadResponse = await fetch(result.uploadUrl, {
          method: "PUT",
          headers: { "content-type": result.contentType },
          body: file,
        })

        if (!uploadResponse.ok) throw new Error("Falha no upload")

        const metadata = {
          bucket: result.bucket,
          objectKey: result.objectKey,
          filename: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }

        onAnswerChange(question.code, metadata)
      } catch (error: any) {
        setUploadError(error.message)
      } finally {
        setUploadBusy(false)
        e.target.value = ""
      }
    }

    return (
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              disabled={locked || uploadBusy}
              className="flex items-center gap-2 bg-transparent"
              onClick={() => document.getElementById(`file-${question.code}`)?.click()}
            >
              <Upload className="h-4 w-4" />
              {uploadBusy ? "Enviando..." : "Selecionar Arquivo"}
            </Button>
            <input id={`file-${question.code}`} type="file" onChange={handleFileSelect} className="hidden" disabled={locked || uploadBusy} />
          </div>

          {question.answer?.filename && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Arquivo enviado: {question.answer.filename}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-700">Erro: {uploadError}</span>
            </div>
          )}
        </div>
      </CardContent>
    )
  }

  /* ========= Tables (dynamic + fixed) ========= */

  const renderTableQuestion = () => {
    const cfg = question.config || {}
    const schema = cfg.table_schema || []
    const mode: "dynamic" | "fixed" = cfg.mode ?? "dynamic"
    const allowAdd = mode !== "fixed" && (cfg.allow_add_rows ?? true)
    const allowDelete = mode !== "fixed" && (cfg.allow_delete_rows ?? true) // reserved for future

    // Fixed rows definition coming from config
    const fixedDefs = (cfg.table_rows || []).map((r) => ({ code: r.code, title: r.title, subtitle: r.subtitle }))

    // Existing stored rows from backend (dynamicRows) might have row_index 1..N but not in order;
    // build a fast lookup by row_index so we don't rely on array position.
    const dynamicRows = question.table_rows || []
    const byIndex = new Map<number, { row_index: number; row: Record<string, any> }>()
    for (const r of dynamicRows) byIndex.set(r.row_index, r)

    // Build renderer rows:
    // - Fixed: use index+1 as the canonical row_index, pull any existing value by that index
    // - Dynamic: keep as is
    const rows =
      mode === "fixed"
        ? fixedDefs.map((r, idx) => {
            const row_index = idx + 1
            const match = byIndex.get(row_index)
            return { row_index, row: match?.row || {}, __meta: r }
          })
        : dynamicRows.map((r) => ({ ...r, __meta: undefined }))

    const fieldLabel = (field: TableSchemaField) => {
      if (!field.label) return field.key
      return (field.label["pt-BR"] || field.label["en"] || field.key)
    }

    return (
      <CardContent>
        <div className="space-y-4">
          {rows.map((row) => {
            return (
              <div key={row.row_index} className="rounded-lg border p-3 bg-slate-50/50 space-y-3">
                {row.__meta && (
                  <div className="mb-1">
                    <div className="text-sm font-medium">{(row.__meta.title && (row.__meta.title["pt-BR"] || Object.values(row.__meta.title)[0])) || ""}</div>
                    {row.__meta.subtitle && (
                      <div className="text-xs text-slate-500">
                        {row.__meta.subtitle["pt-BR"] || Object.values(row.__meta.subtitle)[0]}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${schema.length}, 1fr)` }}>
                  {schema.map((field) => {
                    const value = row.row?.[field.key]
                    const ro = !!field.readonly

                    if (field.type === "boolean") {
                      return (
                        <div key={`${row.row_index}-${field.key}`} className="flex items-center space-x-2">
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => {
                              if (onTableRowChange) {
                                const newRow = { ...row.row, [field.key]: checked }
                                onTableRowChange(question.code, row.row_index, newRow)
                              }
                            }}
                            disabled={locked || ro}
                          />
                          <Label className="text-sm">{fieldLabel(field)}</Label>
                        </div>
                      )
                    }

                    return (
                      <div key={`${row.row_index}-${field.key}`} className="flex flex-col">
                        <label className="text-xs font-medium mb-1">{fieldLabel(field)}</label>
                        <Input
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          value={value ?? ""}
                          onChange={(e) => {
                            if (onTableRowChange) {
                              const newValue =
                                field.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value
                              const newRow = { ...row.row, [field.key]: newValue }
                              onTableRowChange(question.code, row.row_index, newRow)
                            }
                          }}
                          disabled={locked || ro}
                          className="text-sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!locked && allowAdd && onAddTableRow && (
            <Button variant="outline" onClick={() => onAddTableRow(question.code)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Linha
            </Button>
          )}
        </div>
      </CardContent>
    )
  }


