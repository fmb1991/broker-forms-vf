import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function FooterForters() {
  return (
    <footer className="mt-16 bg-[#0F1B28] text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand + Tagline */}
          <div>
           
            <Image
              src="/forters-logo.png"
              alt="Forters"
              width={84}
              height={24}
            />
            <p className="mt-4 text-sm text-slate-300 leading-6">
              Soluções especializadas em linhas financeiras com alcance internacional
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide">NAVEGAÇÃO</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/" className="text-slate-300 hover:text-white">Início</Link></li>
              <li><Link href="/produtos" className="text-slate-300 hover:text-white">Nossos Produtos</Link></li>
              <li><Link href="/cobertura-internacional" className="text-slate-300 hover:text-white">Cobertura Internacional</Link></li>
              <li><Link href="/contato" className="text-slate-300 hover:text-white">Contato</Link></li>
            </ul>
          </div>

          {/* Escritórios */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide">ESCRITÓRIOS</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>São Paulo, Brasil</li>
              <li>Cidade do México, México</li>
              <li>Bogotá, Colômbia</li>
              <li>Miami, Estados Unidos</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide">LEGAL</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/privacidade" className="text-slate-300 hover:text-white">Política de Privacidade</Link></li>
              <li><Link href="/termos" className="text-slate-300 hover:text-white">Termos de Serviço</Link></li>
              <li><Link href="/cookies" className="text-slate-300 hover:text-white">Política de Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-400">
          © 2025 Forters. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
