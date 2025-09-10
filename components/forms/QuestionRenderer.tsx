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
  type: "boolean" | "single_select" | "multi_select" | "date" | "currency" | "text" | "number" | "attachment" | "table"
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
          <div className="h-px bg-slate-300 flex-1"></div>
          <h2 className="text-lg font-semibold text-slate-700 px-4 py-2 bg-slate-100 rounded-full">{sectionTitle}</h2>
          <div className="h-px bg-slate-300 flex-1"></div>
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
      <Select
        value={question.answer || ""}
        onValueChange={(value) => onAnswerChange(question.code, value)}
        disabled={locked}
      >
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

  const renderTableQuestion = () => {
    const schema = question.config?.table_schema || []
    const rows = question.table_rows || []

    const fieldLabel = (field: TableSchemaField) => {
      if (!field.label) return field.key
      return field.label["pt-BR"] || field.label["en"] || field.key
    }

    return (
      <CardContent>
        <div className="space-y-4">
          {/* Table header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${schema.length}, 1fr)` }}>
            {schema.map((field) => (
              <div key={`header-${field.key}`} className="font-semibold text-slate-700 p-2 bg-slate-50 rounded">
                {fieldLabel(field)}
              </div>
            ))}
          </div>

          {/* Table rows */}
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.row_index}
                className="grid gap-4 p-3 bg-slate-50/50 rounded-lg border"
                style={{ gridTemplateColumns: `repeat(${schema.length}, 1fr)` }}
              >
                {schema.map((field) => {
                  const value = row.row?.[field.key]

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
                          disabled={locked}
                        />
                        <Label className="text-sm">{fieldLabel(field)}</Label>
                      </div>
                    )
                  }

                  return (
                    <Input
                      key={`${row.row_index}-${field.key}`}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={value || ""}
                      onChange={(e) => {
                        if (onTableRowChange) {
                          const newValue =
                            field.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value
                          const newRow = { ...row.row, [field.key]: newValue }
                          onTableRowChange(question.code, row.row_index, newRow)
                        }
                      }}
                      disabled={locked}
                      className="text-sm"
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {!locked && onAddTableRow && (
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
