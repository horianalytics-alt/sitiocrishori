import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Sparkles, Users, ArrowRight, Package, Loader2 } from "lucide-react"
import { getPacotesPublica } from "@/lib/site-content.functions"

export type PacotePublico = {
  id: string
  nome: string
  num_pessoas: number | null
  preco_total: number | null
  preco_por_pessoa: number | null
  itens_incluidos: string[]
  destaque: boolean
  texto_destaque: string | null
  ativo: boolean
  ordem: number
}

type NossosPacotesProps = {
  onSelectPacote: (pacote: PacotePublico) => void
  onCustomReserva: () => void
}

export function NossosPacotes({ onSelectPacote, onCustomReserva }: NossosPacotesProps) {
  const { data: pacotes = [], isLoading } = useQuery({
    queryKey: ["pacotes_publica"],
    queryFn: () => getPacotesPublica(),
  }) as { data: PacotePublico[]; isLoading: boolean }

  const formatMoney = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return null
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FE8330] animate-spin" />
      </div>
    )
  }

  if (pacotes.length === 0) {
    return null
  }

  return (
    <div className="space-y-12">
      {/* Grid de Cards de Pacotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
        {pacotes.map((pacote) => {
          const isDestaque = Boolean(pacote.destaque)
          const hasPrecoTotal = pacote.preco_total !== null && pacote.preco_total !== undefined
          const hasPrecoPessoa = pacote.preco_por_pessoa !== null && pacote.preco_por_pessoa !== undefined
          const hasNumPessoas = pacote.num_pessoas !== null && pacote.num_pessoas !== undefined
          const hasItens = Array.isArray(pacote.itens_incluidos) && pacote.itens_incluidos.length > 0

          return (
            <div
              key={pacote.id}
              className={`relative bg-white rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                isDestaque
                  ? "border-2 border-[#FE8330] shadow-2xl shadow-[#FE8330]/15 ring-4 ring-[#FE8330]/10 scale-[1.02] md:scale-105 z-10"
                  : "border border-gray-100 shadow-lg hover:shadow-xl"
              }`}
            >
              {/* Badge de Destaque Colorido */}
              {isDestaque && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FE8330] text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5" />
                  {pacote.texto_destaque || "Mais Popular"}
                </div>
              )}

              <div className="space-y-6">
                {/* Cabeçalho do Card */}
                <div className="space-y-3">
                  {hasNumPessoas && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-xs font-black text-[#FE8330] border border-orange-100">
                      <Users className="w-3.5 h-3.5" />
                      Até {pacote.num_pessoas} pessoas
                    </div>
                  )}

                  <h3 className="text-2xl sm:text-3xl font-black text-[#1E2229] tracking-tight leading-tight">
                    {pacote.nome}
                  </h3>
                </div>

                {/* Preços (apenas campos preenchidos) */}
                {(hasPrecoTotal || hasPrecoPessoa) && (
                  <div className="pt-2 pb-2 border-y border-gray-100/80 space-y-1">
                    {hasPrecoTotal && (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-[#1E2229] tracking-tight">
                          {formatMoney(pacote.preco_total)}
                        </span>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                          total
                        </span>
                      </div>
                    )}

                    {hasPrecoPessoa && (
                      <div className="flex items-baseline gap-1 text-sm font-bold text-gray-600">
                        <span>A partir de</span>
                        <span className="text-lg font-black text-[#FE8330]">
                          {formatMoney(pacote.preco_por_pessoa)}
                        </span>
                        <span className="text-xs text-gray-400">/ convidado</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Itens Incluídos com ícone verde */}
                {hasItens && (
                  <div className="space-y-3 pt-1">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400 block">
                      O que está incluso:
                    </span>
                    <ul className="space-y-2.5">
                      {pacote.itens_incluidos.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-gray-700 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Botão de Escolher este Pacote */}
              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => onSelectPacote(pacote)}
                  className={`w-full min-h-[52px] py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                    isDestaque
                      ? "bg-[#FE8330] hover:bg-[#E06B1B] text-white shadow-xl shadow-[#FE8330]/25"
                      : "bg-[#1E2229] hover:bg-black text-white shadow-lg"
                  }`}
                >
                  Escolher este pacote
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botão Secundário: Quero algo personalizado */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onCustomReserva}
          className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl text-base sm:text-lg font-black text-gray-700 hover:text-[#FE8330] hover:bg-orange-50/60 transition-all cursor-pointer group"
        >
          <span>Quero algo personalizado</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  )
}
