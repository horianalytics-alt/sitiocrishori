import { useState } from 'react'
import { Calculator, ArrowRight, User } from 'lucide-react'
import { ReservaFormModal } from './ReservaFormModal'

type SimulatorProps = {
  precoFesta: number
  precoFimSemana: number
  adminPhone: string
  selectedDate: Date | null
}

export function SimuladorOrcamento({ precoFesta, precoFimSemana, adminPhone, selectedDate }: SimulatorProps) {
  const [tipoEvento, setTipoEvento] = useState<'festa' | 'final_de_semana'>('final_de_semana')
  const [convidados, setConvidados] = useState(20)
  const [showForm, setShowForm] = useState(false)

  // Cálculo de estimativa simples (só para dar uma ideia ao cliente)
  // O valor final sempre é negociado no WhatsApp
  const precoBase = tipoEvento === 'festa' ? (precoFesta || 1500) : (precoFimSemana || 2500)
  
  // Taxa extra por convidado acima de 20 pessoas (exemplo: R$ 30 por pessoa)
  const convidadosExtra = Math.max(0, convidados - 20)
  const estimativa = precoBase + (convidadosExtra * 30)

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border shadow-xl flex flex-col items-center text-center space-y-6">
        <div className="w-12 h-12 bg-[#FE8330]/10 rounded-2xl flex items-center justify-center text-[#FE8330] mb-2">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black">Simule seu Evento</h3>
        <p className="text-sm text-gray-500 max-w-[30ch]">
          Descubra uma estimativa de valor para o seu momento inesquecível.
        </p>

        <div className="w-full space-y-5 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tipo de Evento</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setTipoEvento('final_de_semana')}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-colors ${tipoEvento === 'final_de_semana' ? 'bg-[#1E2229] text-white border-[#1E2229]' : 'bg-gray-50 text-gray-500'}`}
              >
                Fim de Semana
              </button>
              <button 
                onClick={() => setTipoEvento('festa')}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-colors ${tipoEvento === 'festa' ? 'bg-[#1E2229] text-white border-[#1E2229]' : 'bg-gray-50 text-gray-500'}`}
              >
                Festa (1 Dia)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Nº de Convidados</label>
              <span className="font-black text-xl text-[#FE8330]">{convidados}</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max={tipoEvento === 'festa' ? "100" : "40"} 
              step="5" 
              value={convidados}
              onChange={(e) => setConvidados(Number(e.target.value))}
              className="w-full accent-[#FE8330]" 
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border flex justify-between items-center mt-4">
            <span className="text-sm font-bold text-gray-500">Estimativa a partir de</span>
            <span className="text-2xl font-black text-[#1E2229]">
              R$ {estimativa.toLocaleString('pt-BR')}
            </span>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="w-full py-4 mt-2 rounded-xl bg-[#FE8330] text-white font-black hover:bg-[#E06B1B] transition-colors flex items-center justify-center gap-2"
          >
            AVANÇAR PARA RESERVA <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showForm && (
        <ReservaFormModal
          onClose={() => setShowForm(false)}
          initialData={{
            tipo_evento: tipoEvento,
            num_convidados: convidados,
            data_evento: selectedDate
          }}
          adminPhone={adminPhone}
        />
      )}
    </>
  )
}
