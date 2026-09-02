import { useState } from 'react'
import { X, ArrowLeft, ArrowRight, Calendar, Users, PartyPopper, MessageSquare, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { criarReservaPublica } from '@/lib/site-content.functions'

type FormModalProps = {
  onClose: () => void
  initialData?: {
    tipo_evento?: 'festa' | 'final_de_semana'
    num_convidados?: number
    data_evento?: Date | null
    pacote_nome?: string
    pacote_id?: string
  }
  adminPhone: string
}

export function ReservaFormModal({ onClose, initialData, adminPhone }: FormModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [pacoteNome, setPacoteNome] = useState<string | undefined>(initialData?.pacote_nome)

  // Estados dos 5 passos
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [tipoEvento, setTipoEvento] = useState<'festa' | 'final_de_semana'>(
    initialData?.tipo_evento || 'festa'
  )
  const [numConvidados, setNumConvidados] = useState<number>(
    initialData?.num_convidados || 30
  )
  const [dataEvento, setDataEvento] = useState<string>(() => {
    if (initialData?.data_evento) {
      try {
        return initialData.data_evento.toISOString().slice(0, 10)
      } catch {
        return ""
      }
    }
    return ""
  })
  const [mensagem, setMensagem] = useState("")

  // Formatação de telefone
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (clean.length <= 11) {
      setWhatsapp(clean)
    }
  }

  const formatPhoneDisplay = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
    }
    return clean
  }

  // Validação por passo
  const canGoNext = () => {
    if (step === 1) {
      return nome.trim().length >= 3 && whatsapp.trim().length >= 10
    }
    if (step === 2) {
      return !!tipoEvento
    }
    if (step === 3) {
      return numConvidados >= 5
    }
    if (step === 4) {
      return !!dataEvento
    }
    return true
  }

  const handleNext = () => {
    if (!canGoNext()) {
      if (step === 1) toast.error("Por favor, preencha seu nome e WhatsApp com DDD.")
      if (step === 4) toast.error("Por favor, escolha uma data para o evento.")
      return
    }
    setStep(s => Math.min(5, s + 1))
  }

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1))
  }

  // Envio final (Passo 5)
  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      const observacaoFinal = pacoteNome 
        ? `[Pacote: ${pacoteNome}] ${mensagem.trim()}`.trim()
        : mensagem.trim() || undefined

      const data = await criarReservaPublica({
        data: {
          cliente_nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          data_evento: dataEvento,
          num_convidados: numConvidados,
          tipo_evento: tipoEvento,
          mensagem: observacaoFinal,
        }
      })

      const urlBase = window.location.origin
      const linkUnico = `${urlBase}/reserva/${data.link_unico}`
      const tipoNome = tipoEvento === 'festa' ? 'Festa & Evento (1 Dia)' : 'Final de Semana'
      const dataFormatada = dataEvento ? dataEvento.split('-').reverse().join('/') : 'A combinar'

      const zapMsg = `Olá! Meu nome é *${nome}* e acabei de solicitar uma pré-reserva no site.\n\n${pacoteNome ? `🎁 Pacote: *${pacoteNome}*\n` : ''}📅 Data: *${dataFormatada}*\n👥 Convidados: *${numConvidados}*\n🎈 Tipo: *${tipoNome}*\n${mensagem ? `💬 Observação: ${mensagem}\n` : ''}\n🔗 Meu link de acompanhamento:\n${linkUnico}`

      const cleanPhone = (adminPhone || "11999999999").replace(/\D/g, "")
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(zapMsg)}`, '_blank')

      toast.success("✅ Solicitação enviada com sucesso!")
      onClose()
    } catch (err: any) {
      toast.error("❌ Erro ao enviar solicitação, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Barra de Progresso no Topo */}
        <div className="w-full bg-gray-100 h-2">
          <div 
            className="bg-[#FE8330] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Banner de Pacote Pré-selecionado */}
        {pacoteNome && (
          <div className="mx-5 sm:mx-6 mt-3 px-4 py-2 bg-orange-50/90 rounded-2xl border border-orange-200 flex items-center justify-between text-xs sm:text-sm font-bold text-orange-950">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-4 h-4 text-[#FE8330] shrink-0" />
              Pacote: <span className="text-[#FE8330] font-black">{pacoteNome}</span>
            </span>
            <button
              type="button"
              onClick={() => setPacoteNome(undefined)}
              className="text-orange-500 hover:text-orange-700 underline text-xs ml-2 cursor-pointer shrink-0 font-medium"
            >
              remover
            </button>
          </div>
        )}

        {/* Topo com Botão Fechar e Indicador de Passo */}
        <div className="p-5 sm:p-6 pb-2 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer mr-1"
                aria-label="Voltar passo"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#FE8330]">
                Passo {step} de 5
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                Solicitar Reserva
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Wizard */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* PASSO 1: Nome e WhatsApp */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Qual é o seu nome?
                </h3>
                <p className="text-sm text-gray-500">
                  Para personalizarmos o seu atendimento e seu cartão de reserva.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ex: Ana Clara Silva"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full min-h-[52px] px-4 py-3.5 bg-gray-50 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Seu WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={formatPhoneDisplay(whatsapp)}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className="w-full min-h-[52px] px-4 py-3.5 bg-gray-50 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                  <span className="text-[11px] text-gray-400">
                    Enviaremos a confirmação e detalhes diretamente no seu WhatsApp.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: Tipo de Evento */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Que tipo de evento você quer?
                </h3>
                <p className="text-sm text-gray-500">
                  Escolha o formato que melhor atende aos seus planos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoEvento('festa')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                    tipoEvento === 'festa'
                      ? 'border-[#FE8330] bg-orange-50/50 shadow-md shadow-[#FE8330]/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FE8330] flex items-center justify-center text-2xl shrink-0">
                    🎉
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#1E2229]">Festa ou Confraternização (1 Dia)</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Ideal para aniversários, casamentos, churrascos e eventos corporativos de um dia.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoEvento('final_de_semana')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                    tipoEvento === 'final_de_semana'
                      ? 'border-[#FE8330] bg-orange-50/50 shadow-md shadow-[#FE8330]/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-2xl shrink-0">
                    🌿
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#1E2229]">Final de Semana Completo</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Com pernoite na casa principal. Entrada na sexta ou sábado e saída no domingo.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: Quantidade de Convidados */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 text-center">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Quantos convidados?
                </h3>
                <p className="text-sm text-gray-500">
                  Arraste o controle ou toque em um dos números abaixo.
                </p>
              </div>

              <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 space-y-4">
                <div className="text-5xl sm:text-6xl font-black text-[#FE8330]">
                  {numConvidados}
                  <span className="text-xl sm:text-2xl font-bold text-gray-600 ml-2">pessoas</span>
                </div>

                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={numConvidados}
                  onChange={e => setNumConvidados(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FE8330]"
                />

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {[20, 40, 60, 80, 100, 150].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumConvidados(n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        numConvidados === n
                          ? 'bg-[#FE8330] text-white border-[#FE8330]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {n} pessoas
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: Data Desejada */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Qual data você prefere?
                </h3>
                <p className="text-sm text-gray-500">
                  Escolha o dia previsto para o seu momento no sítio.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEvento}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setDataEvento(e.target.value)}
                    className="w-full min-h-[52px] px-4 py-3.5 bg-gray-50 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Alguma observação ou dúvida? (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Gostaria de saber sobre horário de entrada e som ao vivo."
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASSO 5: Resumo e Envio */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Tudo pronto, {nome.split(" ")[0]}!
                </h3>
                <p className="text-sm text-gray-500">
                  Confira os detalhes da sua solicitação antes de enviar:
                </p>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border space-y-3 text-sm">
                {pacoteNome && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-medium">Pacote Escolhido:</span>
                    <span className="font-bold text-[#FE8330] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {pacoteNome}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 font-medium">Nome:</span>
                  <span className="font-bold text-gray-900">{nome}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 font-medium">WhatsApp:</span>
                  <span className="font-bold text-gray-900">{formatPhoneDisplay(whatsapp)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 font-medium">Tipo:</span>
                  <span className="font-bold text-gray-900">
                    {tipoEvento === 'festa' ? '🎉 Festa & Eventos (1 Dia)' : '🌿 Final de Semana'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 font-medium">Convidados:</span>
                  <span className="font-bold text-gray-900">{numConvidados} pessoas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Data desejada:</span>
                  <span className="font-black text-[#FE8330]">
                    {dataEvento ? dataEvento.split('-').reverse().join('/') : 'A combinar'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé com Botões de Navegação */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="w-full min-h-[52px] py-4 bg-[#FE8330] text-white font-black text-base rounded-2xl hover:bg-[#E06B1B] shadow-md shadow-[#FE8330]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Continuar <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalSubmit}
              className="w-full min-h-[52px] py-4 bg-emerald-600 text-white font-black text-base rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
              ) : (
                <>💬 ENVIAR PARA O WHATSAPP</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
