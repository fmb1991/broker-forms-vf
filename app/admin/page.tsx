"use client";

import { useState } from "react";

type Template = {
  id: number;
  slug: string;
  product_code: string | null;
  industry_code: string | null;
  version: string | null;
  status: string | null;
};

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [lang, setLang] = useState("pt-BR");
  const [ttl, setTtl] = useState(60 * 24 * 30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ form_id?: string; token?: string } | null>(null);

  async function loadTemplates() {
    setError(null);
    setTemplates([]);
    setSelectedSlug("");
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adminSecret }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erro ao listar templates");
      return;
    }
    setTemplates(json.templates || []);
    if (json.templates?.length) setSelectedSlug(json.templates[0].slug);
  }

  async function createLink() {
    setCreating(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adminSecret,
        templateSlug: selectedSlug,
        company,
        contact: { name: contactName, email: contactEmail, phone: contactPhone },
        ttlMinutes: ttl,
      }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(json.error || "Erro ao criar link");
      return;
    }
    setResult(json);
  }

  const formUrl =
    result?.form_id && result?.token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/f/${result.form_id}?lang=${lang}&t=${result.token}`
      : "";

  async function copyUrl() {
    if (!formUrl) return;
    try {
      await navigator.clipboard.writeText(formUrl);
      alert("URL copiada!");
    } catch {
      alert("Copie manualmente a URL.");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Admin — Gerar link seguro
      </h1>

      <div className="grid gap-3">
        <label>
          Admin secret
          <input
            type="password"
            className="border rounded p-2 w-full"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Digite seu ADMIN_SECRET"
          />
        </label>

        <button className="px-3 py-2 rounded border w-fit" onClick={loadTemplates}>
          Carregar templates
        </button>

        {templates.length > 0 && (
          <>
            <label>
              Produto / Template
              <select
                className="border rounded p-2 w-full"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {(t.product_code || "produto") +
                      " / " +
                      (t.industry_code || "indústria") +
                      " v" +
                      (t.version || "-") +
                      " — " +
                      t.slug}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Empresa (pré-preenchido)
              <input
                className="border rounded p-2 w-full"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Empresa Exemplo SA"
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label>
                Contato — Nome
                <input
                  className="border rounded p-2 w-full"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  className="border rounded p-2 w-full"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </label>
              <label>
                Telefone
                <input
                  className="border rounded p-2 w-full"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label>
                Idioma do link
                <select
                  className="border rounded p-2 w-full"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="es-419">Español (LatAm)</option>
                  <option value="en">English</option>
                </select>
              </label>

              <label>
                Validade (minutos)
                <input
                  className="border rounded p-2 w-full"
                  type="number"
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value || 0))}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded border"
                onClick={createLink}
                disabled={!selectedSlug || !company || !adminSecret || creating}
              >
                {creating ? "Criando..." : "Criar link"}
              </button>
            </div>
          </>
        )}

        {error && <div style={{ color: "red" }}>Erro: {error}</div>}

        {formUrl && (
          <div className="border rounded p-3">
            <div><b>URL:</b></div>
            <div style={{ wordBreak: "break-all", marginTop: 6 }}>{formUrl}</div>
            <div style={{ marginTop: 8 }}>
              <button className="px-3 py-2 rounded border" onClick={copyUrl}>Copiar URL</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
