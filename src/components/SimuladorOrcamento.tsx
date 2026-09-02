import { useState } from 'react'
import { Calculator, ArrowRight, Sparkles, Users } from 'lucide-react'
import { ReservaFormModal } from './ReservaFormModal'

type SimulatorProps = {
  precoFesta?: number | null
  precoFimSemana?: number | null
  fimSemanaTipo?: string | null
  adminPhone: string
  selectedDate?: Date | null
}

export function SimuladorOrcamento({
  precoFesta,
  precoFimSemana,
  fimSemanaTipo = 'fixo',
  adminPhone,
  selectedDate = null,
}: SimulatorProps) {
  const [tipoEvento, setTipoEvento] = useState<'festa' | 'final_de_semana'>('festa')
  const [convidados, setConvidados] = useState(50)
  const [showForm, setShowForm] = useState(false)

  // Cálculo da estimativa
  const calcularEstimativa = () => {
    if (tipoEvento === 'festa') {
      const precoPorPessoa = precoFesta && precoFesta > 0 ? precoFesta : 70
      return convidados * precoPorPessoa
    } else {
      if (fimSemanaTipo === 'por_pessoa') {
        const precoPorPessoa = precoFimSemana && precoFimSemana > 0 ? precoFimSemana : 120
        return convidados * precoPorPessoa
      }
      return precoFimSemana && precoFimSemana > 0 ? precoFimSemana : 2500
    }
  }

  const valorCalculado = calcularEstimativa()

  const handleConvidadosChange = (val: number) => {
    const clamped = Math.max(10, Math.min(200, val))
    // arredondar para o múltiplo de 10 mais próximo
    const rounded = Math.round(clamped / 10) * 10
    setConvidados(rounded || 10)
  }

  return (
    <>
      <div className="w-full max-w-3xl mx-auto bg-white p-6 sm:p-10 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-orange-100 shadow-2xl shadow-orange-950/5 space-y-8">
        
        {/* Header do Simulador */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FE8330]/10 text-[#FE8330] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Simulação Instantânea
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1E2229] tracking-tight">
            Monte sua proposta personalizada
          </h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-[45ch] mx-auto">
            Escolha a modalidade e a quantidade de convidados para obter uma estimativa em tempo real.
          </p>
        </div>

        <div className="space-y-8">
          {/* Passo 1: Tipo de Evento */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-widest text-[#FE8330]">
              Passo 1 • Selecione a modalidade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setTipoEvento('festa')}
                className={`flex items-center justify-center gap-3 p-5 rounded-2xl text-base sm:text-lg font-black border-2 transition-all cursor-pointer ${
                  tipoEvento === 'festa'
                    ? 'bg-[#1E2229] text-white border-[#1E2229] shadow-lg shadow-black/10 scale-[1.01]'
                    : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <span>🎉</span>
                <span>Festa & Eventos</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoEvento('final_de_semana')}
                className={`flex items-center justify-center gap-3 p-5 rounded-2xl text-base sm:text-lg font-black border-2 transition-all cursor-pointer ${
                  tipoEvento === 'final_de_semana'
                    ? 'bg-[#1E2229] text-white border-[#1E2229] shadow-lg shadow-black/10 scale-[1.01]'
                    : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <span>🌿</span>
                <span>Final de Semana</span>
              </button>
            </div>
          </div>

          {/* Passo 2: Convidados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-[#FE8330]">
                Passo 2 • Número de convidados
              </label>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200/80 px-3 py-1 rounded-xl">
                <Users className="w-4 h-4 text-[#FE8330]" />
                <span className="text-sm font-black text-[#1E2229]">{convidados} convidados</span>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50/80 p-5 sm:p-6 rounded-2xl border border-gray-100">
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={convidados}
                onChange={e => setConvidados(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FE8330]"
              />

              <div className="flex justify-between text-xs font-bold text-gray-400 select-none">
                <span>10</span>
                <span>50</span>
                <span>100</span>
                <span>150</span>
                <span>200 pessoas</span>
              </div>

              <div className="pt-2 flex items-center gap-3 justify-end">
                <span className="text-xs font-semibold text-gray-500">Ou digite o valor:</span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  step="10"
                  value={convidados}
                  onChange={e => handleConvidadosChange(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-center font-bold text-sm focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                />
              </div>
            </div>
          </div>

          {/* Passo 3: Estimativa Instantânea */}
          <div className="p-6 sm:p-8 rounded-[2rem] bg-linear-to-br from-orange-500/10 via-orange-500/5 to-transparent border-2 border-orange-200/70 text-center space-y-2">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FE8330]">
              Passo 3 • Sua Estimativa
            </p>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2229]">
              Estimativa para <span className="text-[#FE8330]">{convidados}</span> convidados:
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FE8330] pt-1">
              a partir de R$ {valorCalculado.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-400 pt-1">
              *Valores de referência sujeitos a confirmação de data e serviços adicionais.
            </p>
          </div>

          {/* Botão de Ação */}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full py-5 px-6 rounded-2xl bg-[#FE8330] text-white text-lg font-black uppercase tracking-wider hover:bg-[#E06B1B] shadow-xl shadow-[#FE8330]/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Quero reservar</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showForm && (
        <ReservaFormModal
          onClose={() => setShowForm(false)}
          initialData={{
            tipo_evento: tipoEvento,
            num_convidados: convidados,
            data_evento: selectedDate,
          }}
          adminPhone={adminPhone}
        />
      )}
    </>
  )
}
