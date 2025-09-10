import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Globe, Users, Phone, Mail, MapPin } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/forters-logo.jpeg" alt="Forters" width={120} height={40} className="h-10 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#produtos" className="text-sm font-medium hover:text-primary transition-colors">
              Produtos
            </a>
            <a href="#sobre" className="text-sm font-medium hover:text-primary transition-colors">
              Sobre
            </a>
            <a href="#contato" className="text-sm font-medium hover:text-primary transition-colors">
              Contato
            </a>
            <Button
              asChild
              className="bg-[color:var(--color-forters-teal)] hover:bg-[color:var(--color-forters-teal)]/90"
            >
              <a href="/admin">Admin</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-[color:var(--color-forters-light-blue)] text-[color:var(--color-forters-teal)]"
          >
            Licenciada pela SUSEP
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 text-[color:var(--color-forters-navy)]">
            Proteção Financeira Global para Empresas Latino-Americanas
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance">
            Soluções especializadas em linhas financeiras com presença internacional. Proteja sua empresa contra riscos
            financeiros com nossa expertise global.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[color:var(--color-forters-teal)] hover:bg-[color:var(--color-forters-teal)]/90"
            >
              Conheça Nossas Soluções
            </Button>
            <Button size="lg" variant="outline">
              Entre em Contato
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-[color:var(--color-forters-light-blue)]/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-[color:var(--color-forters-teal)] mb-4" />
                <CardTitle className="text-lg">Especialistas em Linhas Financeiras</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Soluções especializadas para proteger seus ativos financeiros
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <Globe className="h-12 w-12 mx-auto text-[color:var(--color-forters-teal)] mb-4" />
                <CardTitle className="text-lg">Presença Internacional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Proteção global para seus negócios em expansão</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <div className="h-12 w-12 mx-auto bg-[color:var(--color-forters-teal)] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">T</span>
                </div>
                <CardTitle className="text-lg">Tecnologia Avançada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Plataformas digitais para gerenciar seus seguros com facilidade
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-[color:var(--color-forters-teal)] mb-4" />
                <CardTitle className="text-lg">Equipe Dedicada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Profissionais experientes para atender suas necessidades
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produtos" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[color:var(--color-forters-navy)]">
              Nossos Produtos
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Conheça nossas soluções especializadas para proteger sua empresa contra riscos financeiros
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-[color:var(--color-forters-light-blue)]/50">
                <CardTitle className="text-[color:var(--color-forters-teal)]">RC Profissional</CardTitle>
                <CardDescription>Proteção para profissionais contra reclamações de terceiros</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm">
                  <li>• Cobertura para erros e omissões profissionais</li>
                  <li>• Proteção contra processos de terceiros</li>
                  <li>• Custos de defesa legal</li>
                  <li>• Indenizações por danos causados a clientes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-[color:var(--color-forters-light-blue)]/50">
                <CardTitle className="text-[color:var(--color-forters-teal)]">D&O</CardTitle>
                <CardDescription>Proteção pessoal para diretores e administradores</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm">
                  <li>• Proteção contra ataques hackers</li>
                  <li>• Cobertura para vazamento de dados</li>
                  <li>• Multas e reclamações de clientes</li>
                  <li>• Custos de investigações</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-[color:var(--color-forters-light-blue)]/50">
                <CardTitle className="text-[color:var(--color-forters-teal)]">Cyber</CardTitle>
                <CardDescription>Proteção contra riscos cibernéticos</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm">
                  <li>• Proteção financeira contra ataques</li>
                  <li>• Recuperação de dados</li>
                  <li>• Notificações para clientes</li>
                  <li>• Gestão de crises cibernéticas</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-[color:var(--color-forters-light-blue)]/50">
                <CardTitle className="text-[color:var(--color-forters-teal)]">Crime/BBB</CardTitle>
                <CardDescription>Proteção contra crimes financeiros</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm">
                  <li>• Cobertura para fraudes internas</li>
                  <li>• Proteção contra roubo</li>
                  <li>• Falsificação de documentos</li>
                  <li>• Crimes cibernéticos financeiros</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-[color:var(--color-forters-light-blue)]/50">
                <CardTitle className="text-[color:var(--color-forters-teal)]">Crimes Financeiros</CardTitle>
                <CardDescription>Proteção especializada contra fraudes</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm">
                  <li>• Fraudes por funcionários</li>
                  <li>• Transferências fraudulentas</li>
                  <li>• Falsificação de cheques</li>
                  <li>• Crimes eletrônicos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="py-16 px-4 bg-[color:var(--color-forters-light-blue)]/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[color:var(--color-forters-navy)]">Forters no Mundo</h2>
            <p className="text-lg text-muted-foreground">Escritórios correspondentes em diversos países</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6 text-center">
            {[
              { country: "Brasil", city: "São Paulo" },
              { country: "México", city: "Cidade do México" },
              { country: "Colômbia", city: "Bogotá" },
              { country: "Estados Unidos", city: "Miami" },
              { country: "E outros", city: "Diversos locais" },
            ].map((location, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <MapPin className="h-8 w-8 mx-auto text-[color:var(--color-forters-teal)] mb-3" />
                  <h3 className="font-semibold text-[color:var(--color-forters-navy)]">{location.country}</h3>
                  <p className="text-sm text-muted-foreground">{location.city}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[color:var(--color-forters-navy)]">
              Entre em Contato com a Forters
            </h2>
            <p className="text-lg text-muted-foreground">Nossa equipe está pronta para atender suas necessidades</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <Phone className="h-8 w-8 mx-auto text-[color:var(--color-forters-teal)] mb-3" />
                <h3 className="font-semibold mb-2">Telefone</h3>
                <p className="text-sm text-muted-foreground">+55 11 94051-6104</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <Mail className="h-8 w-8 mx-auto text-[color:var(--color-forters-teal)] mb-3" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground">contato@forters.com.br</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-8 w-8 mx-auto bg-[color:var(--color-forters-teal)] rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <h3 className="font-semibold mb-2">Formulários</h3>
                <Button asChild variant="outline" size="sm">
                  <a href="/admin">Acessar Admin</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[color:var(--color-forters-navy)] text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Image
                src="/forters-logo.jpeg"
                alt="Forters"
                width={120}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm opacity-80">© 2025 Forters. Todos os direitos reservados.</p>
              <p className="text-xs opacity-60 mt-1">Corretora licenciada pela SUSEP</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
