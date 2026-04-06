"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Send, CheckCircle } from "lucide-react"

type Section = {
  id: string
  label: string
  subtitle?: string
  totalFields: number
  completedFields: number
}

type FormShellProps = {
  company?: string
  status: "draft" | "submitted"
  children: React.ReactNode
  onSubmit: () => void
  submitting: boolean
  lang?: string
  sections?: Section[]
  activeSection?: string
  onSectionChange?: (id: string) => void
  totalFields?: number
  completedFields?: number
  onLanguageChange?: (lang: string) => void
}

export function FormShell({
  company,
  status,
  children,
  onSubmit,
  submitting,
  lang = "pt-BR",
  sections,
  activeSection,
  onSectionChange,
  totalFields = 0,
  completedFields = 0,
  onLanguageChange,
}: FormShellProps) {
  const locked = status === "submitted"
  const langNorm = lang.toLowerCase()

  function getTitle() {
    if (langNorm.startsWith("en")) return "Insurance Form"
    if (langNorm.startsWith("es")) return "Cuestionario de Seguros"
    return "Questionário de Seguros"
  }

  function getButtonLabel() {
    if (locked) {
      if (langNorm.startsWith("en")) return "Submitted"
      if (langNorm.startsWith("es")) return "Enviado"
      return "Enviado"
    }
    if (submitting) {
      if (langNorm.startsWith("en")) return "Submitting..."
      if (langNorm.startsWith("es")) return "Enviando..."
      return "Enviando..."
    }
    if (langNorm.startsWith("en")) return "Submit form"
    if (langNorm.startsWith("es")) return "Enviar cuestionario"
    return "Enviar Questionário"
  }

  function getCompanyLabel() {
    if (langNorm.startsWith("en")) return "Company:"
    if (langNorm.startsWith("es")) return "Empresa:"
    return "Empresa:"
  }

  function getNotInformed() {
    if (langNorm.startsWith("en")) return "Not informed"
    if (langNorm.startsWith("es")) return "No informada"
    return "Não informada"
  }

  function getSentBadge() {
    if (langNorm.startsWith("en")) return "Submitted"
    if (langNorm.startsWith("es")) return "Enviado"
    return "Enviado"
  }

  function getHeroSubtitle() {
    if (langNorm.startsWith("en"))
      return "Complete the form to get a personalized insurance quote for your company."
    if (langNorm.startsWith("es"))
      return "Complete el formulario para obtener una cotización personalizada de seguro para su empresa."
    return "Preencha o formulário para obter uma cotização personalizada de seguro para sua empresa."
  }

  function getFooter() {
    if (langNorm.startsWith("en"))
      return "Global Financial Protection · © 2026 CoverCap. All rights reserved."
    if (langNorm.startsWith("es"))
      return "Protección Financiera Global · © 2026 CoverCap. Todos los derechos reservados."
    return "Proteção Financeira Global · © 2026 CoverCap. Todos os direitos reservados."
  }

  function getNextLabel() {
    if (langNorm.startsWith("en")) return "Next"
    if (langNorm.startsWith("es")) return "Siguiente"
    return "Próximo"
  }

  function getAllCompleteText() {
    if (langNorm.startsWith("en")) return "All fields completed!"
    if (langNorm.startsWith("es")) return "¡Todos los campos completados!"
    return "Todos os campos preenchidos!"
  }

  function getFieldsLabel() {
    if (langNorm.startsWith("en")) return "Completed fields:"
    if (langNorm.startsWith("es")) return "Campos completados:"
    return "Campos preenchidos:"
  }

  function getProgressLabel() {
    if (langNorm.startsWith("en")) return "Progress:"
    if (langNorm.startsWith("es")) return "Progreso:"
    return "Progresso:"
  }

  function getCompletionHint() {
    const remaining = totalFields - completedFields
    if (remaining <= 0) return null
    if (langNorm.startsWith("en"))
      return `Complete ${remaining} more field${remaining === 1 ? "" : "s"}`
    if (langNorm.startsWith("es"))
      return `Completa ${remaining} campo${remaining === 1 ? "" : "s"} más`
    return `Preencha mais ${remaining} campo${remaining === 1 ? "" : "s"}`
  }

  const progress = Math.round((completedFields / Math.max(totalFields, 1)) * 100)

  const hasSections = Array.isArray(sections) && sections.length > 0
  const activeSectionData = hasSections
    ? sections!.find((s) => s.id === activeSection) || sections![0]
    : null
  const effectiveActiveId = activeSectionData?.id
  const isLastSection = hasSections
    ? sections![sections!.length - 1]?.id === effectiveActiveId
    : true

  const langButtons = [
    { label: "PT", code: "pt-BR", active: langNorm.startsWith("pt") },
    { label: "EN", code: "en", active: langNorm.startsWith("en") },
    { label: "ES", code: "es", active: langNorm.startsWith("es") },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ── Sticky dark header ── */}
      <header className="sticky top-0 z-20 w-full bg-[#0A1628] shadow-lg border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <img
            src="/Covercap%201.2%20Scondary_v2.PNG"
            alt="CoverCap"
            className="h-10 w-auto"
          />

          <div className="flex items-center gap-4">
            {/* Fields counter pill — hidden on mobile */}
            <div className="hidden md:flex bg-white/5 rounded-lg px-4 py-2 backdrop-blur-sm items-center gap-4">
              <span className="text-sm font-medium text-white">{getFieldsLabel()}</span>
              <span className="text-sm font-bold text-[#FF5722]">
                {completedFields}/{totalFields}
              </span>
              <div className="w-px h-6 bg-white/20" />
              <span className="text-sm font-medium text-white">{getProgressLabel()}</span>
              <span className="text-sm font-bold text-[#FF5722]">{progress}%</span>
            </div>

            {/* Language switcher */}
            <div className="bg-white/10 rounded-lg p-1 flex items-center gap-1">
              {langButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => onLanguageChange?.(btn.code)}
                  className={
                    btn.active
                      ? "bg-[#FF5722] text-white px-3 py-1.5 rounded text-sm font-medium"
                      : "text-white/70 hover:text-white px-3 py-1.5 rounded text-sm font-medium transition-all"
                  }
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile-only fields counter bar ── */}
      <div className="md:hidden bg-[#0A1628] border-t border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {getFieldsLabel()}{" "}
            <span className="font-bold text-[#FF5722]">
              {completedFields}/{totalFields}
            </span>
          </span>
          <span className="text-sm font-medium text-white">
            {getProgressLabel()}{" "}
            <span className="font-bold text-[#FF5722]">{progress}%</span>
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Hero banner ── */}
        <div className="bg-gradient-to-r from-[#0A1628] to-[#1a2942] rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-3">{getTitle()}</h2>
          <p className="text-slate-300 mb-6 text-base">{getHeroSubtitle()}</p>

          {/* Company + sent badge */}
          <div className="flex items-center gap-3 mb-6 text-slate-300 text-sm">
            <span>
              {getCompanyLabel()} {company || getNotInformed()}
            </span>
            {locked && (
              <div className="flex items-center gap-1 text-green-400 font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>{getSentBadge()}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#FF5722] h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Sectioned layout ── */}
        {hasSections ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Tab bar */}
            <div className="border-b border-gray-200 bg-gray-50 flex overflow-x-auto">
              {sections!.map((section) => {
                const isActive = section.id === effectiveActiveId
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => onSectionChange?.(section.id)}
                    className={
                      isActive
                        ? "border-b-2 border-[#FF5722] text-[#FF5722] bg-white flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all"
                        : "border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all"
                    }
                  >
                    <span>{section.label}</span>
                    <span
                      className={
                        isActive
                          ? "ml-1 text-xs px-2 py-0.5 rounded-full bg-[#FF5722]/10 text-[#FF5722]"
                          : "ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600"
                      }
                    >
                      {section.completedFields}/{section.totalFields}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Section content */}
            <div className="p-6">
              {activeSectionData && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#0A1628] mb-1">
                    {activeSectionData.label}
                  </h3>
                  {activeSectionData.subtitle && (
                    <p className="text-sm text-gray-500">{activeSectionData.subtitle}</p>
                  )}
                </div>
              )}
              {children}
            </div>

            {/* Bottom action bar */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: completion hint */}
              <div>
                {completedFields >= totalFields && totalFields > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle size={18} />
                    <span>{getAllCompleteText()}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">{getCompletionHint()}</span>
                )}
              </div>

              {/* Right: next or submit */}
              {isLastSection ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting || locked}
                  className="bg-gradient-to-r from-[#FF5722] to-[#ff6e42] hover:from-[#ff6e42] hover:to-[#FF5722] text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {getButtonLabel()}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!sections || !onSectionChange) return
                    const currentIdx = sections.findIndex((s) => s.id === effectiveActiveId)
                    const next = sections[currentIdx + 1]
                    if (next) onSectionChange(next.id)
                  }}
                  className="px-6 py-3 rounded-lg font-semibold text-[#0A1628] bg-gray-200 hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                  {getNextLabel()}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Flat layout (no sections) — backward compatible ── */
          <div className="space-y-6 mb-24">
            {children}

            {/* Sticky floating submit bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
              <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex justify-end">
                  <Button
                    onClick={onSubmit}
                    disabled={submitting || locked}
                    size="lg"
                    className="bg-gradient-to-r from-[#FF5722] to-[#ff6e42] hover:from-[#ff6e42] hover:to-[#FF5722] text-white min-w-32"
                  >
                    {getButtonLabel()}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E2A38] bg-[#0E1B24] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-3">

            {/* Logo and tagline */}
            <div className="lg:col-span-1">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative h-8 w-8 flex-shrink-0">
                  <img src="/Covercap%201.2%20Scondary_v2.PNG" alt="CoverCap" className="h-8 w-auto object-contain" />
                </div>
                <span className="text-xl font-bold text-white tracking-wide">COVERCAP</span>
              </div>
              <p className="text-sm leading-relaxed text-[#7A8B9A]">
                {langNorm.startsWith("en")
                  ? "Insurance and risk infrastructure designed for companies operating in the digital economy."
                  : langNorm.startsWith("es")
                  ? "Seguros e infraestructura de riesgo diseñados para empresas que operan en la economía digital."
                  : "Seguros e infraestrutura de risco projetados para empresas que operam na economia digital."}
              </p>
            </div>

            {/* Locations */}
            <div className="lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {langNorm.startsWith("en") ? "LOCATION" : langNorm.startsWith("es") ? "UBICACIÓN" : "LOCALIZAÇÃO"}
              </h3>
              <div className="space-y-3 text-sm text-[#94A3B8]">
                <p className="font-medium text-white">Sede Principal: São Paulo, Brasil</p>
                <div>
                  <p className="mb-2 font-medium text-[#C5D0DB]">
                    {langNorm.startsWith("en") ? "Local Offices:" : langNorm.startsWith("es") ? "Oficinas Locales:" : "Escritórios Locais:"}
                  </p>
                  <ul className="ml-4 space-y-1.5">
                    <li className="flex items-start">
                      <span className="mr-2 text-[#FF5722]">•</span>
                      <span>Ciudad de México, México</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-[#FF5722]">•</span>
                      <span>Bogotá, Colombia</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {langNorm.startsWith("en") ? "CONTACT" : "CONTACTO"}
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.linkedin.com/company/covercap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E2A38] text-white transition-all hover:bg-[#FF5722]"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  href="mailto:ola@covercap.co"
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E2A38] text-white transition-all hover:bg-[#FF5722]"
                  aria-label="Email"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 h-px w-full bg-[#2A3847]" />

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-[#7A8B9A]">{getFooter()}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
