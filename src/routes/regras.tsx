import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getRegrasPoliticas } from '@/lib/site-content.functions'
import { FileText, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/regras')({
  component: RegrasPage,
})

function RegrasPage() {
  const { data: regras = [], isLoading } = useQuery({
    queryKey: ['regras_politicas'],
    queryFn: () => getRegrasPoliticas(),
  })

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 md:py-24 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#FE8330] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para o início
          </Link>
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FE8330]/10 text-[#FE8330]">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1E2229]">
              Regras e Políticas
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-[60ch]">
              Para garantir a melhor experiência para todos os nossos hóspedes, estabelecemos algumas regras importantes para a convivência e uso do espaço.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {(regras as any[]).map((regra, i) => (
              <div key={regra.id || i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-xl font-bold text-[#1E2229] flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm text-gray-500">
                    {i + 1}
                  </span>
                  {regra.titulo}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-11">
                  {regra.conteudo}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
