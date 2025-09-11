import "./globals.css";

export const metadata = {
  title: "Forters - Proteção Financeira Global",
  description:
    "Soluções especializadas em linhas financeiras para empresas latino-americanas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
