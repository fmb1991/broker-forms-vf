// app/success/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Obrigado — Forters',
  description: 'Obrigado por enviar o questionário. Próximos passos.'
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#172534] text-white">
     
      <header className="bg-white w-full">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-center">
          <img src="/forters-logo.jpeg" alt="Forters" className="h-14" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Obrigado por enviar o questionário!</h1>

        <p className="text-slate-300 max-w-3xl mx-auto text-lg leading-relaxed mb-8">
          Sua cotação está a caminho. Esse processo pode tardar até 15 dias. Entraremos em contato com você assim que tivermos as propostas de seguro.
        </p>

        {/* Steps card */}
        <section className="bg-[#263644] rounded-xl p-8 text-left shadow-md">
          <h2 className="text-center text-xl font-semibold text-white mb-6">Próximos Passos</h2>

          <ol className="space-y-6">
         
            <li className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-700 text-slate-200 font-bold">1</div>
              </div>
              <div>
                <div className="font-semibold text-white">Preenchimento de dados</div>
                <div className="text-slate-300 mt-1">Preencha o formulário e envie os documentos.</div>
              </div>
            </li>

         
            <li className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-500 font-bold">2</div>
              </div>
              <div>
                <div className="font-semibold text-white">
                  Cotação <span className="font-normal text-slate-300">(você está aqui)</span>
                </div>
                <div className="text-slate-300 mt-1">Buscaremos, junto às seguradoras parceiras, a melhor opção de cobertura para sua empresa.</div>
              </div>
            </li>

            
            <li className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-700 text-slate-200 font-bold">3</div>
              </div>
              <div>
                <div className="font-semibold text-white">Aprovação de cobertura e condições</div>
                <div className="text-slate-300 mt-1">Você escolherá a proposta que melhor atende às suas necessidades de limite e coberturas.</div>
              </div>
            </li>

          
            <li className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-700 text-slate-200 font-bold">4</div>
              </div>
              <div>
                <div className="font-semibold text-white">Renovação da apólice</div>
                <div className="text-slate-300 mt-1">Formalizaremos a contratação e sua cobertura será renovada, garantindo que sua empresa e operações permaneçam protegidas.</div>
              </div>
            </li>
          </ol>
        </section>

        <footer className="mt-8 text-center">
          <a
            href="https://www.forters.com.br"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 underline"
          >
            Visite-nos para mais informações
          </a>
        </footer>
      </main>
    </div>
  );
}

