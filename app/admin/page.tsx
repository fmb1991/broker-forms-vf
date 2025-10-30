"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Settings,
  LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Template = {
  id: number;
  slug: string;
  product_code: string | null;
  industry_code: string | null;
  version: string | null;
  status: string | null;
};

type Mode = "hub" | "templates" | "forms";

export default function AdminPage() {
  // === Autenticación simple para todo el panel ===
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [mode, setMode] = useState<Mode>("hub");

  useEffect(() => {
    const saved = localStorage.getItem("adminSecret");
    if (saved) {
      setAdminSecret(saved);
      setIsAuthed(true);
      setMode("hub");
    }
  }, []);

  function handleLogin() {
    if (!adminSecret) {
      alert("Ingresa la contraseña");
      return;
    }
    localStorage.setItem("adminSecret", adminSecret);
    setIsAuthed(true);
    setMode("hub");
  }

  function handleLogout() {
    localStorage.removeItem("adminSecret");
    setAdminSecret("");
    setIsAuthed(false);
    setMode("hub");
  }

  // === Pantalla de login (paso 1) ===
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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

        <div className="container mx-auto px-4 py-8 max-w-xl">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Shield className="h-5 w-5 text-teal-600" />
                Autenticación
              </CardTitle>
              <CardDescription>
                Digita tu clave para entrar al panel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="admin-secret" className="text-slate-700 font-medium">
                    Clave del Administrador
                  </Label>
                  <Input
                    id="admin-secret"
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Digite seu ADMIN_SECRET"
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={!adminSecret}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // === Hub con dos botones (paso 2) ===
  if (mode === "hub") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full bg-white shadow-sm border-b border-slate-200">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="flex justify-between items-center">
              <Image
                src="/forters-logo.jpeg"
                alt="Forters"
                width={160}
                height={64}
                className="h-12 w-auto"
              />
              <Button variant="outline" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Panel Administrativo
            </h1>
            <p className="text-slate-600">
              Selecciona un módulo para continuar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Templates
                </CardTitle>
                <CardDescription>
                  Cargar templates y generar links de formularios.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Button onClick={() => setMode("templates")}>Ir a Templates</Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <LinkIcon className="h-5 w-5 text-orange-600" />
                  Forms (seguimiento)
                </CardTitle>
                <CardDescription>
                  Ver estado de formularios y descargar PDF/ZIP.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Button onClick={() => setMode("forms")}>Ir a Forms</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // === Módulo Templates (TU UI ORIGINAL, SIN CAMBIAR LA LÓGICA) ===
  if (mode === "templates") {
    return (
      <TemplatesModule
        adminSecretFromHub={adminSecret}
        onBack={() => setMode("hub")}
        onLogout={handleLogout}
      />
    );
  }

  // === Módulo Forms (nuevo) ===
  if (mode === "forms") {
    return (
      <FormsModule
        adminSecret={adminSecret}
        onBack={() => setMode("hub")}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

/* ===========================
   TEMPLATES MODULE (TU CÓDIGO)
   =========================== */
function TemplatesModule({
  adminSecretFromHub,
  onBack,
  onLogout,
}: {
  adminSecretFromHub: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  // --- Copia fiel de tu estado y lógica (solo movido a este componente) ---
  const [adminSecret, setAdminSecret] = useState(adminSecretFromHub || "");
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
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [hubspotDealId, setHubspotDealId] = useState<string>("");
  const [savingDeal, setSavingDeal] = useState<boolean>(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl =
    result?.form_id && result?.token
      ? `${origin}/f/${result.form_id}?lang=${lang}&t=${result.token}`
      : "";

  function extractTokenFromUrl(url: string): string {
    try {
      const u = new URL(url);
      return u.searchParams.get("t") || "";
    } catch {
      return "";
    }
  }

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
      toast({
        title: "Erro",
        description: json.error || "Erro ao listar templates",
        variant: "destructive",
      });
      return;
    }
    setTemplates(json.templates || []);
    if (json.templates?.length) setSelectedSlug(json.templates[0].slug);

    toast({
      title: "Sucesso",
      description: `${json.templates?.length || 0} templates carregados`,
    });
  }

  async function createLink() {
    setCreating(true);
    setError(null);
    setResult(null);
    setGeneratedToken("");
    setHubspotDealId("");

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
      toast({
        title: "Erro",
        description: json.error || "Erro ao criar link",
        variant: "destructive",
      });
      return;
    }

    setResult(json);

    const tokenFromResponse = json?.token || "";
    const tokenFromUrl =
      tokenFromResponse ||
      extractTokenFromUrl(`${origin}/f/${json?.form_id}?lang=${lang}&t=${json?.token}`);
    setGeneratedToken(tokenFromUrl);

    toast({
      title: "Link criado com sucesso",
      description: "O link seguro foi gerado e está pronto para uso",
    });
  }

  async function copyUrl() {
    if (!formUrl) return;
    try {
      await navigator.clipboard.writeText(formUrl);
      toast({
        title: "URL copiada",
        description: "A URL foi copiada para a área de transferência",
      });
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Copie manualmente a URL",
        variant: "destructive",
      });
    }
  }

  async function saveHubspotDeal() {
    if (!generatedToken) {
      return toast({
        title: "Gere o link primeiro",
        description: "Precisamos do token do link para salvar o Deal ID.",
        variant: "destructive",
      });
    }
    if (!hubspotDealId || !/^\d+$/.test(hubspotDealId)) {
      return toast({
        title: "Deal ID inválido",
        description: "Cole apenas números (ex.: 41368145976).",
        variant: "destructive",
      });
    }

    try {
      setSavingDeal(true);
      const res = await fetch("/api/admin/set-hubspot-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: generatedToken,
          hubspot_deal_id: hubspotDealId,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        throw new Error(j.error || "Falha ao salvar Deal ID");
      }
      toast({
        title: "Deal ID salvo",
        description: "O formulário foi vinculado ao negócio do HubSpot.",
      });
    } catch (e: any) {
      toast({
        title: "Erro ao salvar Deal ID",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setSavingDeal(false);
    }
  }

  // === UI de Templates (tu diseño original) ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <Image
              src="/forters-logo.jpeg"
              alt="Forters"
              width={160}
              height={64}
              className="h-12 w-auto"
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBack}>
                ← Volver
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Painel Administrativo</h1>
          <p className="text-slate-600">Geração de links seguros para questionários de seguros</p>
        </div>

        <div className="space-y-6">
          {/* Autenticación propia del módulo (dejas igual tu experiencia) */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Shield className="h-5 w-5 text-teal-600" />
                Autenticação (Templates)
              </CardTitle>
              <CardDescription>Digite sua chave secreta para acessar os templates</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="admin-secret" className="text-slate-700 font-medium">
                    Chave Secreta do Administrador
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="admin-secret"
                      type={showPassword ? "text" : "password"}
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="Digite seu ADMIN_SECRET"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={loadTemplates}
                  disabled={!adminSecret}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Carregar Templates
                </Button>
              </div>
            </CardContent>
          </Card>

          {templates.length > 0 && (
            <>
              <Card className="bg-blue-50/50 backdrop-blur-sm border-blue-200">
                <CardHeader className="bg-blue-100/50">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Configuração do Questionário
                  </CardTitle>
                  <CardDescription>Selecione o template e configure as informações da empresa</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <Label htmlFor="template-select" className="text-slate-700 font-medium">
                      Produto / Template
                    </Label>
                    <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.slug} value={t.slug}>
                            {(t.product_code || "produto") +
                              " / " +
                              (t.industry_code || "indústria") +
                              " v" +
                              (t.version || "-") +
                              " — " +
                              t.slug}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-slate-700 font-medium">
                      Nome da Empresa
                    </Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: Empresa Exemplo SA"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700 font-medium mb-3 block">
                      Informações de Contato
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="contact-name" className="text-sm text-slate-600">
                          Nome do Contato
                        </Label>
                        <Input
                          id="contact-name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Nome completo"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email" className="text-sm text-slate-600">
                          Email
                        </Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="email@empresa.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-phone" className="text-sm text-slate-600">
                          Telefone
                        </Label>
                        <Input
                          id="contact-phone"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+55 11 99999-9999"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language" className="text-slate-700 font-medium">
                        Idioma do Questionário
                      </Label>
                      <Select value={lang} onValueChange={setLang}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="es-419">Español (LatAm)</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ttl" className="text-slate-700 font-medium">
                        Validade (minutos)
                      </Label>
                      <Input
                        id="ttl"
                        type="number"
                        value={ttl}
                        onChange={(e) => setTtl(Number(e.target.value || 0))}
                        className="mt-2"
                        min="1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <LinkIcon className="h-5 w-5 text-orange-600" />
                    Geração do Link Seguro
                  </CardTitle>
                  <CardDescription>
                    Crie um link seguro e temporário para o questionário
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button
                    onClick={createLink}
                    disabled={!selectedSlug || !company || !adminSecret || creating}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto"
                    size="lg"
                  >
                    {creating ? "Gerando Link..." : "Gerar Link Seguro"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {formUrl && (
            <Card className="bg-green-50/50 backdrop-blur-sm border-green-200">
              <CardHeader className="bg-green-100/50">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <LinkIcon className="h-5 w-5 text-green-600" />
                  Link Gerado com Sucesso
                </CardTitle>
                <CardDescription>Compartilhe este link seguro com o cliente</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      URL do Questionário
                    </Label>
                    <div className="font-mono text-sm text-slate-600 break-all bg-slate-50 p-3 rounded border">
                      {formUrl}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <Button onClick={copyUrl} variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Copy className="h-4 w-4" />
                      Copiar URL
                    </Button>
                    <Button
                      onClick={() => window.open(formUrl, "_blank")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir Link
                    </Button>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-white p-4">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      HubSpot Deal ID (opcional)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="Cole o número do negócio (ex.: 41368145976)"
                        value={hubspotDealId}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
                          setHubspotDealId(onlyDigits);
                        }}
                        className="md:col-span-2"
                      />
                      <Button
                        type="button"
                        onClick={saveHubspotDeal}
                        disabled={!generatedToken || !hubspotDealId || savingDeal}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {savingDeal ? "Salvando..." : "Salvar Deal ID"}
                      </Button>
                    </div>

                    {!generatedToken && (
                      <p className="text-xs text-amber-600 mt-2">
                        Gere o link primeiro para capturar o token e permitir o salvamento do Deal ID.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="bg-red-50/50 backdrop-blur-sm border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Erro:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   FORMS MODULE (NUEVO)
   ======================= */
function FormsModule({
  adminSecret,
  onBack,
  onLogout,
}: {
  adminSecret: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState<string>("");

  async function load(page = 1) {
    const res = await fetch(`/api/formsadmin/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, status, q, page, pageSize: 20 }),
    });
    if (!res.ok) {
      alert("No autorizado o error cargando los formularios");
      return;
    }
    const json = await res.json();
    setRows(json.data || []);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function downloadPdf(formId: string) {
    const res = await fetch(`/api/formsadmin/pdf/${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret }),
    });
    if (!res.ok) {
      alert("Error generando PDF");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form_${formId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadZip(formId: string) {
    const res = await fetch(`/api/formsadmin/zip/${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret }),
    });
    if (!res.ok) {
      alert("Error generando ZIP");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form_${formId}_attachments.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <Image
              src="/forters-logo.jpeg"
              alt="Forters"
              width={160}
              height={64}
              className="h-12 w-auto"
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBack}>
                ← Volver
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar empresa..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button onClick={() => load(1)}>Buscar</Button>
        </div>

        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Empresa</th>
              <th className="p-2">Status</th>
              <th className="p-2">Respondidas</th>
              <th className="p-2">Anexos</th>
              <th className="p-2">Creado</th>
              <th className="p-2">Vence</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.form_id} className="border-t">
                <td className="p-2">{r.respondent_company ?? "-"}</td>
                <td className="p-2">{r.computed_status}</td>
                <td className="p-2">
                  {r.answered_questions}/{r.required_questions}
                </td>
                <td className="p-2">{r.attachments_count}</td>
                <td className="p-2">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="p-2">
                  {r.due_at ? new Date(r.due_at).toLocaleDateString() : "-"}
                </td>
                <td className="p-2 space-x-2">
                  <button
                    className="underline"
                    onClick={() => downloadPdf(r.form_id)}
                  >
                    Descargar PDF
                  </button>
                  <button
                    className="underline"
                    onClick={() => downloadZip(r.form_id)}
                  >
                    Descargar ZIP
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

