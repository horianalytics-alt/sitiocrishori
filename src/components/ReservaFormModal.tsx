import { useState } from 'react'
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Users, 
  PartyPopper, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Sun,
  Home
} from 'lucide-react'
import { toast } from 'sonner'
import { DayPicker, type DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"
import { format, startOfDay } from "date-fns"
import "react-day-picker/dist/style.css"
import { useQuery } from '@tanstack/react-query'
import { criarReservaPublica, getDisponibilidadePublica } from '@/lib/site-content.functions'

export type TipoEvento = 'day_use' | 'festa' | 'final_de_semana'

type FormModalProps = {
  onClose: () => void
  initialData?: {
    tipo_evento?: TipoEvento
    num_convidados?: number
    data_evento?: Date | null
    pacote_nome?: string | undefined
    pacote_id?: string | undefined
  }
  adminPhone: string
}

const GUEST_CONFIG: Record<TipoEvento, { min: number; max: number; default: number; chips: number[]; hint: string }> = {
  day_use: {
    min: 1,
    max: 50,
    default: 20,
    chips: [5, 10, 15, 20, 30, 50],
    hint: "Capacidade para até 50 pessoas durante o dia (saída até às 18h)",
  },
  festa: {
    min: 10,
    max: 500,
    default: 50,
    chips: [20, 40, 60, 80, 100, 150, 200],
    hint: "Espaço amplo com capacidade para até 500 convidados",
  },
  final_de_semana: {
    min: 1,
    max: 30,
    default: 15,
    chips: [5, 10, 15, 20, 30],
    hint: "Capacidade máxima de pernoite para até 30 pessoas",
  },
}

export function ReservaFormModal({ onClose, initialData, adminPhone }: FormModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [pacoteNome, setPacoteNome] = useState<string | undefined>(initialData?.pacote_nome)

  // PASSO 1: Contato (inalterado)
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  // PASSO 2: Tipo de Evento (day_use, festa, final_de_semana)
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>(
    initialData?.tipo_evento || 'festa'
  )

  // PASSO 3: Convidados (varia por tipo)
  const [numConvidados, setNumConvidados] = useState<number>(() => {
    if (initialData?.num_convidados) return initialData.num_convidados
    return GUEST_CONFIG[initialData?.tipo_evento || 'festa'].default
  })

  // PASSO 4: Data (Data única para Day Use / Festa, ou De/Até para Final de Semana)
  const initialDateStr = initialData?.data_evento 
    ? initialData.data_evento.toISOString().slice(0, 10) 
    : ""

  const [dataEvento, setDataEvento] = useState<string>(initialDateStr)
  const [dataInicio, setDataInicio] = useState<string>(initialDateStr)
  const [dataFim, setDataFim] = useState<string>("")
  const [calendarSingle, setCalendarSingle] = useState<Date | undefined>(
    initialData?.data_evento ? initialData.data_evento : undefined
  )
  const [calendarRange, setCalendarRange] = useState<DateRange | undefined>(() => {
    if (initialData?.data_evento) {
      return { from: initialData.data_evento, to: undefined }
    }
    return undefined
  })
  const [mensagem, setMensagem] = useState("")

  // Buscar disponibilidade pública para destacar datas
  const { data: disponibilidade = [] } = useQuery({
    queryKey: ['disponibilidade_publica'],
    queryFn: () => getDisponibilidadePublica(),
  }) as { data: { data: string; status?: string; observacao?: string | null }[] }

  // Mapear dias do calendário
  const dayModifiers = {
    disponivel: [] as Date[],
    ocupado: [] as Date[],
    reservado: [] as Date[]
  }

  disponibilidade.forEach(d => {
    const data = startOfDay(new Date(d.data + "T00:00:00"))
    if (d.status === 'disponivel') dayModifiers.disponivel.push(data)
    else if (d.status === 'ocupado') dayModifiers.ocupado.push(data)
    else if (d.status === 'reservado') dayModifiers.reservado.push(data)
  })

  // Troca de tipo no passo 2
  const handleSelectTipo = (tipo: TipoEvento) => {
    setTipoEvento(tipo)
    const cfg = GUEST_CONFIG[tipo]
    setNumConvidados(prev => Math.min(Math.max(prev, cfg.min), cfg.max))
  }

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

  const todayStr = new Date().toISOString().slice(0, 10)

  // Validação por passo
  const canGoNext = () => {
    if (step === 1) {
      return nome.trim().length >= 3 && whatsapp.trim().length >= 10
    }
    if (step === 2) {
      return !!tipoEvento
    }
    if (step === 3) {
      const cfg = GUEST_CONFIG[tipoEvento]
      return numConvidados >= cfg.min && numConvidados <= cfg.max
    }
    if (step === 4) {
      if (tipoEvento === 'final_de_semana') {
        return !!dataInicio && !!dataFim && dataFim >= dataInicio
      }
      return !!dataEvento
    }
    return true
  }

  const handleNext = () => {
    if (!canGoNext()) {
      if (step === 1) toast.error("Por favor, preencha seu nome e WhatsApp com DDD.")
      if (step === 4) {
        if (tipoEvento === 'final_de_semana') {
          if (!dataInicio || !dataFim) {
            toast.error("Por favor, escolha as datas de entrada e saída.")
          } else if (dataFim < dataInicio) {
            toast.error("A data de saída não pode ser anterior à data de entrada.")
          }
        } else {
          toast.error("Por favor, escolha uma data para o evento.")
        }
      }
      return
    }
    setStep(s => Math.min(5, s + 1))
  }

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1))
  }

  // Sincronizar seleção do calendário
  const handleSingleSelect = (day: Date | undefined) => {
    setCalendarSingle(day)
    if (day) {
      setDataEvento(format(day, "yyyy-MM-dd"))
    } else {
      setDataEvento("")
    }
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    setCalendarRange(range)
    if (range?.from) {
      const fromStr = format(range.from, "yyyy-MM-dd")
      setDataInicio(fromStr)
      if (range.to) {
        const toStr = format(range.to, "yyyy-MM-dd")
        setDataFim(toStr)
      } else {
        setDataFim("")
      }
    } else {
      setDataInicio("")
      setDataFim("")
    }
  }

  // Envio final (Passo 5)
  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      const observacaoFinal = pacoteNome 
        ? `[Pacote: ${pacoteNome}] ${mensagem.trim()}`.trim()
        : mensagem.trim() || undefined

      const finalInicio = tipoEvento === 'final_de_semana' ? dataInicio : dataEvento
      const finalFim = tipoEvento === 'final_de_semana' ? dataFim : dataEvento

      const data = await criarReservaPublica({
        data: {
          cliente_nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          data_evento: finalInicio,
          data_inicio: finalInicio,
          data_fim: finalFim,
          num_convidados: numConvidados,
          tipo_evento: tipoEvento,
          mensagem: observacaoFinal,
        }
      })

      const urlBase = window.location.origin
      const linkUnico = `${urlBase}/reserva/${data.link_unico}`

      let tipoNome = 'Festa ou Confraternização'
      if (tipoEvento === 'day_use') tipoNome = '☀️ Day Use (08h às 18h)'
      if (tipoEvento === 'final_de_semana') tipoNome = '🌿 Final de Semana Completo (Pernoite)'

      let dataTexto = ''
      if (tipoEvento === 'final_de_semana') {
        const dIni = dataInicio ? dataInicio.split('-').reverse().join('/') : 'A combinar'
        const dFim = dataFim ? dataFim.split('-').reverse().join('/') : 'A combinar'
        dataTexto = `*De ${dIni} até ${dFim}*`
      } else {
        dataTexto = `*${dataEvento ? dataEvento.split('-').reverse().join('/') : 'A combinar'}*`
      }

      const zapMsg = `Olá! Meu nome é *${nome}* e acabei de solicitar uma pré-reserva no site.\n\n${pacoteNome ? `🎁 Pacote: *${pacoteNome}*\n` : ''}📌 Tipo de Evento: *${tipoNome}*\n📅 Data/Período: ${dataTexto}\n👥 Convidados: *${numConvidados} pessoas*\n${mensagem ? `💬 Observação: ${mensagem}\n` : ''}\n🔗 Meu link de acompanhamento:\n${linkUnico}`

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

  const currentGuestCfg = GUEST_CONFIG[tipoEvento]

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
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#FE8330]">
                Passo {step} de 5
              </span>
              <h2 className="text-sm font-bold text-gray-700">
                {step === 1 && "Identificação"}
                {step === 2 && "Tipo de Evento"}
                {step === 3 && "Número de Convidados"}
                {step === 4 && "Data Desejada"}
                {step === 5 && "Resumo & Confirmação"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Dinâmico do Passo */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          
          {/* PASSO 1: Identificação (Nome + WhatsApp) — INALTERADO */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Qual é o seu nome?
                </h3>
                <p className="text-sm text-gray-500">
                  Queremos te chamar pelo nome e enviar o seu orçamento exclusivo.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Seu nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Oliveira"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full min-h-[52px] px-4 py-3.5 bg-gray-50 rounded-2xl border text-base font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
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
                  <p className="text-xs text-gray-400">
                    Enviaremos os detalhes e link exclusivo para este número.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: Tipo de Evento (3 opções de igual tamanho empilhadas no mobile) */}
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

              <div className="flex flex-col gap-3">
                {/* Opção 1: Day Use */}
                <button
                  type="button"
                  onClick={() => handleSelectTipo('day_use')}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                    tipoEvento === 'day_use'
                      ? 'border-[#FE8330] bg-orange-50/60 shadow-md shadow-[#FE8330]/10 ring-2 ring-[#FE8330]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                    ☀️
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-[#1E2229]">Day Use</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      Aproveite o dia completo no sítio. Entrada pela manhã e saída até às 18h.
                    </p>
                  </div>
                </button>

                {/* Opção 2: Festa ou Confraternização */}
                <button
                  type="button"
                  onClick={() => handleSelectTipo('festa')}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                    tipoEvento === 'festa'
                      ? 'border-[#FE8330] bg-orange-50/60 shadow-md shadow-[#FE8330]/10 ring-2 ring-[#FE8330]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FE8330] flex items-center justify-center text-2xl shrink-0">
                    🎉
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-[#1E2229]">Festa ou Confraternização</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      Celebrações, aniversários, casamentos ou eventos de 1 dia com estrutura exclusiva.
                    </p>
                  </div>
                </button>

                {/* Opção 3: Final de Semana Completo */}
                <button
                  type="button"
                  onClick={() => handleSelectTipo('final_de_semana')}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                    tipoEvento === 'final_de_semana'
                      ? 'border-[#FE8330] bg-orange-50/60 shadow-md shadow-[#FE8330]/10 ring-2 ring-[#FE8330]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-2xl shrink-0">
                    🌿
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-[#1E2229]">Final de Semana Completo</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      Com pernoite na casa principal. Entrada na sexta ou sábado e saída no domingo.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: Quantidade de Convidados (varia por tipo) */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 text-center">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Quantos convidados?
                </h3>
                <p className="text-sm text-gray-500">
                  {currentGuestCfg.hint}
                </p>
              </div>

              <div className="p-6 bg-orange-50/60 rounded-3xl border border-orange-100 space-y-5">
                <div className="text-5xl sm:text-6xl font-black text-[#FE8330]">
                  {numConvidados}
                  <span className="text-xl sm:text-2xl font-bold text-gray-600 ml-2">pessoas</span>
                </div>

                <input
                  type="range"
                  min={currentGuestCfg.min}
                  max={currentGuestCfg.max}
                  step={tipoEvento === 'festa' ? 5 : 1}
                  value={numConvidados}
                  onChange={e => setNumConvidados(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FE8330]"
                />

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {currentGuestCfg.chips.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumConvidados(n)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        numConvidados === n
                          ? 'bg-[#FE8330] text-white border-[#FE8330] shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {n} pessoas
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: Data (Data única para Day Use/Festa vs De/Até para Final de Semana) */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  {tipoEvento === 'final_de_semana' ? "Escolha a data de entrada e saída" : "Qual data você prefere?"}
                </h3>
                <p className="text-sm text-gray-500">
                  {tipoEvento === 'final_de_semana' 
                    ? "Selecione o dia do check-in e check-out no sítio."
                    : "Escolha o dia previsto para o seu evento."}
                </p>
              </div>

              {/* Campos de Input */}
              {tipoEvento === 'final_de_semana' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      De (Entrada): *
                    </label>
                    <input
                      type="date"
                      required
                      value={dataInicio}
                      min={todayStr}
                      onChange={e => {
                        const newIni = e.target.value
                        setDataInicio(newIni)
                        if (dataFim && newIni > dataFim) {
                          setDataFim(newIni)
                        }
                        const fromD = newIni ? new Date(newIni + "T00:00:00") : undefined
                        const toD = dataFim ? new Date(dataFim + "T00:00:00") : undefined
                        setCalendarRange({ from: fromD, to: toD })
                      }}
                      className="w-full min-h-[52px] px-4 py-3 bg-gray-50 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Até (Saída): *
                    </label>
                    <input
                      type="date"
                      required
                      value={dataFim}
                      min={dataInicio || todayStr}
                      onChange={e => {
                        setDataFim(e.target.value)
                        const fromD = dataInicio ? new Date(dataInicio + "T00:00:00") : undefined
                        const toD = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined
                        setCalendarRange({ from: fromD, to: toD })
                      }}
                      className="w-full min-h-[52px] px-4 py-3 bg-gray-50 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEvento}
                    min={todayStr}
                    onChange={e => {
                      setDataEvento(e.target.value)
                      setCalendarSingle(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)
                    }}
                    className="w-full min-h-[52px] px-4 py-3.5 bg-gray-50 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                </div>
              )}

              {/* Calendário Visual com Disponibilidade Integrada */}
              <div className="p-3 sm:p-4 bg-[#FAF8F5] rounded-3xl border border-gray-200/80 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500 mb-1">
                  Toque no calendário para selecionar uma data:
                </span>

                {tipoEvento === 'final_de_semana' ? (
                  <DayPicker
                    mode="range"
                    selected={calendarRange}
                    onSelect={handleRangeSelect}
                    locale={ptBR}
                    modifiers={dayModifiers}
                    modifiersClassNames={{
                      disponivel: "bg-green-100 text-green-800 font-bold",
                      ocupado: "bg-red-100 text-red-500 line-through opacity-70",
                      reservado: "bg-yellow-100 text-yellow-700 opacity-80"
                    }}
                    className="mx-auto custom-calendar scale-95 origin-top"
                  />
                ) : (
                  <DayPicker
                    mode="single"
                    selected={calendarSingle}
                    onSelect={handleSingleSelect}
                    locale={ptBR}
                    modifiers={dayModifiers}
                    modifiersClassNames={{
                      disponivel: "bg-green-100 text-green-800 font-bold",
                      ocupado: "bg-red-100 text-red-500 line-through opacity-70",
                      reservado: "bg-yellow-100 text-yellow-700 opacity-80"
                    }}
                    className="mx-auto custom-calendar scale-95 origin-top"
                  />
                )}

                {/* Legenda de cores */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-gray-200 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    <span className="text-gray-700">Disponível</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                    <span className="text-gray-700">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                    <span className="text-gray-700">Reservado</span>
                  </div>
                </div>
              </div>

              {/* Observações Opcionais */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Alguma observação ou dúvida? (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Gostaria de saber sobre horário de som, bebidas..."
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 rounded-2xl border text-sm focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                />
              </div>
            </div>
          )}

          {/* PASSO 5: Resumo e Confirmação */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                  Quase lá! Tudo certo?
                </h3>
                <p className="text-sm text-gray-500">
                  Confira os detalhes da sua solicitação antes de enviar:
                </p>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border space-y-3 text-sm">
                {pacoteNome && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-medium">Pacote:</span>
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
                  <span className="text-gray-500 font-medium">Tipo de Evento:</span>
                  <span className="font-bold text-gray-900">
                    {tipoEvento === 'day_use' && '☀️ Day Use (08h às 18h)'}
                    {tipoEvento === 'festa' && '🎉 Festa ou Confraternização'}
                    {tipoEvento === 'final_de_semana' && '🌿 Final de Semana Completo'}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 font-medium">Convidados:</span>
                  <span className="font-bold text-gray-900">{numConvidados} pessoas</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 font-medium">
                    {tipoEvento === 'final_de_semana' ? "Período:" : "Data desejada:"}
                  </span>
                  <span className="font-black text-[#FE8330]">
                    {tipoEvento === 'final_de_semana' ? (
                      `De ${dataInicio ? dataInicio.split('-').reverse().join('/') : 'A combinar'} até ${dataFim ? dataFim.split('-').reverse().join('/') : 'A combinar'}`
                    ) : (
                      dataEvento ? dataEvento.split('-').reverse().join('/') : 'A combinar'
                    )}
                  </span>
                </div>

                {mensagem && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-gray-500 font-medium">Observações:</span>
                    <span className="text-gray-700 text-xs italic">{mensagem}</span>
                  </div>
                )}
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
