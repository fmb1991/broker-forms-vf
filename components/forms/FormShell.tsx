"use client"

import type React from "react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

type FormShellProps = {
  company?: string
  status: "draft" | "submitted"
  children: React.ReactNode
  onSubmit: () => void
  submitting: boolean
  /** Language from URL, e.g. "pt-BR", "es", "es-419", "en" */
  lang?: string
}

function normalizeLang(lang?: string): "pt-BR" | "es-419" | "en" {
  if (!lang) return "pt-BR"
  const lower = lang.toLowerCase()

  if (lower.startsWith("pt")) return "pt-BR"
  if (lower.startsWith("es")) return "es-419"
  if (lower.startsWith("en")) return "en"

  return "pt-BR"
}

export function FormShell({
  company,
  status,
  children,
  onSubmit,
  submitting,
  lang,
}: FormShellProps) {
  const locked = status === "submitted"
  const langNorm = normalizeLang(lang)

  // ---- i18n strings ----
  let title = "Questionário de Seguros"
  let companyLabel = "Empresa"
  let submittedLabel = "Enviado"
  let btnIdle = "Enviar Questionário"
  let btnSubmitting = "Enviando..."
  let btnSubmitted = "Enviado"

  if (langNorm === "es-419") {
    title = "Cuestionario de Seguros"
    companyLabel = "Empresa"
    submittedLabel = "Enviado"
    btnIdle = "Enviar cuestionario"
    btnSubmitting = "Enviando..."
    btnSubmitted = "Enviado"
  } else if (langNorm === "en") {
    title = "Insurance Form"
    companyLabel = "Company"
    submittedLabel = "Submitted"
    btnIdle = "Submit form"
    btnSubmitting = "Submitting..."
    btnSubmitted = "Submitted"
  }

  const buttonLabel = locked ? btnSubmitted : submitting ? btnSubmitting : btnIdle

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with logo */}
      <div className="w-full bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex justify-center">
            <Image
              src="/forters-logo.jpeg"
              alt="Forters"
              width={200}
              height={80}
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <span>
              {companyLabel}: {company || "Não informada"}
            </span>
            {locked && (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>{submittedLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Questions container */}
        <div className="space-y-6 mb-24">{children}</div>

        {/* Sticky submit bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex justify-end">
              <Button
                onClick={onSubmit}
                disabled={submitting || locked}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-32"
              >
                {buttonLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
