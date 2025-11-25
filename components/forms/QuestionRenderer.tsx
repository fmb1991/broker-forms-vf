"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { FormLanguage } from "@/lib/languages"
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
   Types
   ========================= */

type I18n = Record<string, string>

type Option = { value: string; label: string; order?: number }

type TableSchemaField = {
  key: string
  // extended to support selects inside table rows
  type: "text" | "boolean" | "number" | "date" | "currency" | "single_select"
  label?: I18n | string
  required?: boolean
  readonly?: boolean
  // optional for selects
  options?: Option[]
}

type TableRow = { row_index: number; row: Record<string, any> }

type TableConfig = {
  currency?: string
  decimals?: number
  // your legacy (tech E&O) format:
  table_schema?: TableSchemaField[]
  // new format (cyber) we added in DB:
  columns?: any[]
  max_mb?: number
  allowed?: string[]
  mode?: "dynamic" | "fixed"
  allow_add_rows?: boolean
  allow_delete_rows?: boolean
  table_rows?: Array<{ code: string; title?: I18n; subtitle?: I18n }>
}

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
  label: I18n | string
  help?: I18n | string
  config?: TableConfig
  options?: Option[]
  answer: any
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

function i18nPick(obj: I18n | string | undefined, locale: string = "pt-BR", fallback = "") {
  if (!obj) return fallback
  if (typeof obj === "string") return obj
  return obj[locale] ?? obj["pt-BR"] ?? obj["en"] ?? Object.values(obj)[0] ?? fallback
}

/** Normalize table schema so we support BOTH formats:
 *  - legacy: config.table_schema (current Tech E&O)
 *  - new:    config.columns     (Cyber templates)
 */
function useNormalizedTableSchema(config: TableConfig | undefined, locale: string) {
  return useMemo<TableSchemaField[]>(() => {
    const cfg = config || {}

    // 1) Legacy path (already used by your working Tech E&O)
    if (Array.isArray(cfg.table_schema) && cfg.table_schema.length > 0) {
      return cfg.table_schema
    }

    // 2) New path (columns) used by Cyber templates
    if (Array.isArray(cfg.columns) && cfg.columns.length > 0) {
      return cfg.columns.map((c: any) => {
        // options may be { value, label: i18n|string }
        const opts: Option[] | undefined = Array.isArray(c.options)
          ? c.options.map((o: any) => ({
              value: String(o.value),
              label: i18nPick(o.label, locale, String(o.value)),
            }))
          : undefined

        const field: TableSchemaField = {
          key: String(c.key),
          type: (String(c.type) as TableSchemaField["type"]) || "text",
          label: c.label,
          required: !!c.required,
          readonly: !!c.readonly,
          options: opts,
        }
        return field
      })
    }

    // 3) nothing
    return []
  }, [config, locale])
}

/* =========================
   Component
   ========================= */

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

  // language from ?lang= in the URL (pt-BR / en / es)
  const searchParams = useSearchParams()
  const langParam = (searchParams?.get("lang") as FormLanguage | null) || null
  const locale: FormLanguage | "pt-BR" = langParam || "pt-BR"

  const renderSectionTitle = () => {
    if (!sectionTitle) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-slate-300 flex-1" />
          <h2 className="text-lg font-semibold text-slate-700 px-4 py-2 bg-slate-100 rounded-full">
            {sectionTitle}
          </h2>
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
          <CardTitle className="text-lg font-semibold text-slate-800 leading-relaxed">
            {i18nPick(question.label, locale)}
          </CardTitle>
          {question.help && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {i18nPick(question.help, locale)}
            </p>
          )}
        </div>
      </div>
    </CardHeader>
  )

  /* ========= Scalars ========= */

  // Boolean answer with optional details text
  const renderBooleanQuestion = () => {
    const raw = question.answer
    const boolValue: boolean | null =
      raw && typeof raw === "object" ? (raw.value ?? null) : raw === true ? true : raw === false ? false : null
    const details: string =
      raw && typeof raw === "object" ? (raw.details ?? "") : ""

    return (
      <CardContent className="space-y-4">
        <RadioGroup
          value={boolValue === true ? "true" : boolValue === false ? "false" : ""}
          onValueChange={(value) => {
            const newBool = value === "true"
            const rawCurrent = question.answer
            const currentDetails =
              rawCurrent && typeof rawCurrent === "object" ? (rawCurrent.details ?? "") : ""
            onAnswerChange(question.code, {
              value: newBool,
              details: currentDetails,
            })
          }}
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

        <div>
          <Label htmlFor={`${question.code}-details`} className="text-sm text-slate-700">
            Comentários adicionais (opcional)
          </Label>
          <Textarea
            id={`${question.code}-details`}
            value={details}
            onChange={(e) => {
              const rawCurrent = question.answer
              const currentBool: boolean | null =
                rawCurrent && typeof rawCurrent === "object"
                  ? rawCurrent.value ?? null
                  : rawCurrent === true
                  ? true
                  : rawCurrent === false
                  ? false
                  : null
              onAnswerChange(question.code, {
                value: currentBool,
                details: e.target.value,
              })
            }}
            placeholder="Details"
            disabled={locked}
            className="mt-2 min-h-20 resize-none"
          />
        </div>
      </CardContent>
    )
  }

  const renderSingleSelect = () => (
    <CardContent>
      <Select value={question.answer || ""} onValueChange={(value) => onAnswerChange(question.code, value)} disabled={locked}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select" />
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
        placeholder="Type"
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
        placeholder="Número"
        disabled={locked}
      />
    </CardContent>
  )

  const renderDateQuestion = () => (
    <CardContent>
      <Input
        type="date"
        value={(question.answer as string) || ""}
        onChange={(e) => onAnswerChange(question.code, e.target.value)}
        disabled={locked}
      />
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
              {uploadBusy ? "Enviando..." : "File"}
            </Button>
            <input
              id={`file-${question.code}`}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={locked || uploadBusy}
            />
          </div>

          {question.answer?.filename && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Arquivo enviado: {question.answer.filename}
              </span>
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
    // Tolerant config (supports legacy table_schema AND new columns)
    const cfg = (question.config || {}) as TableConfig
    const schema = useNormalizedTableSchema(cfg, locale)
    const mode: "dynamic" | "fixed" = cfg.mode ?? "dynamic"
    const allowAdd = mode !== "fixed" && (cfg.allow_add_rows ?? true)
    // const allowDelete = mode !== "fixed" && (cfg.allow_delete_rows ?? true) // reserved

    // Fixed rows (legacy layout for Tech E&O)
    const fixedDefs = (cfg.table_rows || []).map((r) => ({ code: r.code, title: r.title, subtitle: r.subtitle }))

    // Existing stored rows from backend (dynamicRows)
    const dynamicRows = question.table_rows || []
    const byIndex = new Map<number, { row_index: number; row: Record<string, any> }>()
    for (const r of dynamicRows) byIndex.set(r.row_index, r)

    // Build rows for rendering
    const rows =
      mode === "fixed"
        ? fixedDefs.map((r, idx) => {
            const row_index = idx + 1
            const match = byIndex.get(row_index)
            return { row_index, row: match?.row || {}, __meta: r as any }
          })
        : dynamicRows.map((r) => ({ ...r, __meta: undefined }))

    const fieldLabel = (field: TableSchemaField) => {
      if (!field.label) return field.key
      return i18nPick(field.label as any, locale, field.key)
    }

    return (
      <CardContent>
        <div className="space-y-4">
          {/* If schema is empty, show a friendly hint instead of a blank card */}
          {schema.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Configuração de tabela sem colunas para <strong>{question.code}</strong>. Verifique se o backend envia
              <code> config.columns </code> ou <code> config.table_schema</code>.
            </div>
          )}

          {rows.map((row) => {
            return (
              <div key={row.row_index} className="rounded-lg border p-3 bg-slate-50/50 space-y-3">
                {row.__meta && (
                  <div className="mb-1">
                    <div className="text-sm font-medium">
                      {i18nPick(row.__meta.title as any, locale)}
                    </div>
                    {row.__meta.subtitle && (
                      <div className="text-xs text-slate-500">
                        {i18nPick(row.__meta.subtitle as any, locale)}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${schema.length || 1}, 1fr)` }}>
                  {schema.map((field) => {
                    const value = row.row?.[field.key]
                    const ro = !!field.readonly
                    const required = !!field.required

                    // BOOLEAN inside table
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

                    // SINGLE SELECT inside table (new)
                    if (field.type === "single_select") {
                      const opts = field.options || []
                      return (
                        <div key={`${row.row_index}-${field.key}`} className="flex flex-col">
                          <label className="text-xs font-medium mb-1">
                            {fieldLabel(field)} {required ? <span className="text-red-500">*</span> : null}
                          </label>
                          <Select
                            value={value ?? ""}
                            onValueChange={(val) => {
                              if (onTableRowChange) {
                                const newRow = { ...row.row, [field.key]: val }
                                onTableRowChange(question.code, row.row_index, newRow)
                              }
                            }}
                            disabled={locked || ro}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {opts.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }

                    // CURRENCY inside table (new) -> simple number input (no cents object)
                    if (field.type === "currency") {
                      return (
                        <div key={`${row.row_index}-${field.key}`} className="flex flex-col">
                          <label className="text-xs font-medium mb-1">
                            {fieldLabel(field)} {required ? <span className="text-red-500">*</span> : null}
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={value ?? ""}
                            onChange={(e) => {
                              if (onTableRowChange) {
                                const newValue = e.target.value === "" ? null : Number(e.target.value)
                                const newRow = { ...row.row, [field.key]: newValue }
                                onTableRowChange(question.code, row.row_index, newRow)
                              }
                            }}
                            disabled={locked || ro}
                            className="text-sm"
                          />
                        </div>
                      )
                    }

                    // NUMBER / DATE / TEXT (existing)
                    return (
                      <div key={`${row.row_index}-${field.key}`} className="flex flex-col">
                        <label className="text-xs font-medium mb-1">
                          {fieldLabel(field)} {required ? <span className="text-red-500">*</span> : null}
                        </label>
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

  const renderQuestionContent = () => {
    switch (question.type) {
      case "boolean":
        return renderBooleanQuestion()
      case "single_select":
        return renderSingleSelect()
      case "multi_select":
        return renderMultiSelect()
      case "text":
        return renderTextQuestion()
      case "number":
        return renderNumberQuestion()
      case "date":
        return renderDateQuestion()
      case "currency":
        return renderCurrencyQuestion()
      case "attachment":
        return renderAttachmentQuestion()
      case "table":
        return renderTableQuestion()
      default:
        return (
          <CardContent>
            <div className="text-slate-500">Tipo de pergunta não suportado: {question.type}</div>
          </CardContent>
        )
    }
  }

  return (
    <div>
      {renderSectionTitle()}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
        {renderQuestionHeader()}
        {renderQuestionContent()}
      </Card>
    </div>
  )
}
