import Image from "next/image";

interface FooterFortersProps {
  lang?: string;
}

export default function FooterForters({ lang = "pt" }: FooterFortersProps) {
  const l = lang.toLowerCase();

  const locationTitle = l.startsWith("en") ? "LOCATION" : l.startsWith("es") ? "UBICACIÓN" : "LOCALIZAÇÃO";
  const headquarters = "Sede Principal: São Paulo, Brasil";
  const officesLabel = l.startsWith("en") ? "Local Offices:" : l.startsWith("es") ? "Oficinas Locales:" : "Escritórios Locais:";
  const contactTitle = l.startsWith("en") ? "CONTACT" : "CONTACTO";
  const tagline = l.startsWith("en")
    ? "Insurance and risk infrastructure designed for companies operating in the digital economy."
    : l.startsWith("es")
    ? "Seguros e infraestructura de riesgo diseñados para empresas que operan en la economía digital."
    : "Seguros e infraestrutura de risco projetados para empresas que operam na economia digital.";
  const copyright = l.startsWith("en")
    ? "© 2026 CoverCap. All rights reserved."
    : l.startsWith("es")
    ? "© 2026 CoverCap. Todos los derechos reservados."
    : "© 2026 CoverCap. Todos os direitos reservados.";

  return (
    <footer className="border-t border-[#1E2A38] bg-[#0E1B24]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-3">

          {/* Logo and Tagline */}
          <div className="lg:col-span-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative h-8 w-8 flex-shrink-0">
                <Image
                  src="/covercap-logo-white.png"
                  alt="CoverCap"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">COVERCAP</span>
            </div>
            <p className="text-sm leading-relaxed text-[#7A8B9A]">
              {tagline}
            </p>
          </div>

          {/* Office Locations */}
          <div className="lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {locationTitle}
            </h3>
            <div className="space-y-3 text-sm text-[#94A3B8]">
              <p className="font-medium text-white">{headquarters}</p>
              <div>
                <p className="mb-2 font-medium text-[#C5D0DB]">{officesLabel}</p>
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
              {contactTitle}
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
          <p className="text-sm text-[#7A8B9A]">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
