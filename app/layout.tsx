import type React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata = {
  title: "Forters - Proteção Financeira Global",
  description: "Soluções especializadas em linhas financeiras para empresas latino-americanas",
  generator: "v0.app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
