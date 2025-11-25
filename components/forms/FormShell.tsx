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
  // NEW: pass current language
  lang?: string
}

export function FormShell({
  company,
  status,
  children,
  onSubmit,
  submitting,
  lang = "pt-BR",
}: FormShellProps) {
  const locked = status === "submitted"

  const langNorm = lang.toLowerCase()

  function getTitle() {
    if (langNorm.startsWith("en")) return "Insurance Form"
    if (langNorm === "es" || langNorm === "es-419") return "Cuestionario de Seguros"
    return "Questionário de Seguros"
  }

  function getButtonLabel() {
    if (locked) {
      if (langNorm.startsWith("en")) return "Submitted"
      if (langNorm === "es" || langNorm === "es-419") return "Enviado"
      return "Enviado"
    }

    if (submitting) {
      if (langNorm.startsWith("en")) return "Submitting..."
      if (langNorm === "es" || langNorm === "es-419") return "Enviando..."
      return "Enviando..."
    }

    // default labels when NOT submitted
    if (langNorm.startsWith("en")) return "Submit form"
    if (langNorm === "es" || langNorm === "es-419") return "Enviar cuestionario"
    return "Enviar Questionário"
  }

  function getCompanyLabel() {
    if (langNorm.startsWith("en")) return "Company:"
    if (langNorm === "es" || langNorm === "es-419") return "Empresa:"
    return "Empresa:"
  }

  function getNotInformed() {
    if (langNorm.startsWith("en")) return "Not informed"
    if (langNorm === "es" || langNorm === "es-419") return "No informada"
    return "Não informada"
  }

  function getSentBadge() {
    if (langNorm.startsWith("en")) return "Submitted"
    if (langNorm === "es" || langNorm === "es-419") return "Enviado"
    return "Enviado"
  }

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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{getTitle()}</h1>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <span>
              {getCompanyLabel()} {company || getNotInformed()}
            </span>
            {locked && (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>{getSentBadge()}</span>
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
                {getButtonLabel()}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

