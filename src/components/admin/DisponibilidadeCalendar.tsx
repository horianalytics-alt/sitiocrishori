import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, XCircle, AlertCircle, Save } from "lucide-react"
import { toast } from "sonner"
import { getDisponibilidade, setDisponibilidade } from "@/lib/site-content.functions"

type DisponibilidadeStatus = "disponivel" | "ocupado" | "reservado"

const STATUS_CONFIG = {
  disponivel: {
    label: "Disponível",
    badge: "🟢 Disponível",
    bg: "bg-green-100 hover:bg-green-200",
    text: "text-green-800",
    border: "border-green-300",
  },
  ocupado: {
    label: "Ocupado",
    badge: "🔴 Ocupado",
    bg: "bg-red-100 hover:bg-red-200",
    text: "text-red-800",
    border: "border-red-300",
  },
  reservado: {
    label: "Reservado",
    badge: "🟡 Reservado",
    bg: "bg-yellow-100 hover:bg-yellow-200",
    text: "text-yellow-800",
    border: "border-yellow-300",
  },
} as const

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function DisponibilidadeCalendar() {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [obsText, setObsText] = useState("")

  const queryClient = useQueryClient()
  const queryKey = ["disponibilidade", viewYear, viewMonth]

  const { data: registros = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getDisponibilidade({ data: { ano: viewYear, mes: viewMonth } }),
  })

  const statusMap = new Map<string, { status: DisponibilidadeStatus; observacao?: string }>(
    (registros as any[]).map((r) => [r.data, { status: r.status, observacao: r.observacao }]),
  )

  const setMutation = useMutation({
    mutationFn: (payload: { data: string; status: string; observacao?: string }) =>
      setDisponibilidade({ data: payload }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("✅ Salvo com sucesso!")
    },
    onError: () => toast.error("❌ Erro ao salvar, tente novamente"),
  })

  function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr)
    const existing = statusMap.get(dateStr)
    setObsText(existing?.observacao ?? "")
  }

  function handleSetStatus(newStatus: DisponibilidadeStatus) {
    if (!selectedDate) return
    setMutation.mutate({
      data: selectedDate,
      status: newStatus,
      observacao: obsText.trim() || undefined,
    })
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const selectedEntry = selectedDate ? statusMap.get(selectedDate) : null
  const selectedStatus: DisponibilidadeStatus = selectedEntry?.status ?? "disponivel"

  // Formatar data selecionada legível
  const dataSelecionadaFormatada = selectedDate
    ? selectedDate.split("-").reverse().join("/")
    : null

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
      
      {/* Título e Descrição Clara */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-[#1E2229]">
          Calendário de Disponibilidade
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Defina as datas livres e ocupadas para os visitantes consultarem no site.
        </p>
      </div>

      {/* Instrução visível no topo */}
      <div className="p-4 bg-orange-50/80 border-2 border-orange-200/80 rounded-2xl text-center text-[#1E2229] font-bold text-sm sm:text-base flex items-center justify-center gap-2">
        <span>👆</span>
        <span>Toque em uma data para marcá-la como disponível ou ocupada</span>
      </div>

      {/* Navegação entre Meses */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border">
        <button
          type="button"
          onClick={prevMonth}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center rounded-xl bg-white border hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <span className="text-lg md:text-xl font-black text-[#1E2229]">
          {MONTHS_PT[viewMonth - 1]} de {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center rounded-xl bg-white border hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Grade do Calendário */}
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="text-center text-xs sm:text-sm font-black text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />
            const dateStr = toDateStr(viewYear, viewMonth, day)
            const entry = statusMap.get(dateStr)
            const status: DisponibilidadeStatus = entry?.status ?? "disponivel"
            const cfg = STATUS_CONFIG[status]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleSelectDate(dateStr)}
                className={`
                  relative aspect-square min-h-[48px] sm:min-h-[60px] flex flex-col items-center justify-center rounded-2xl text-base sm:text-lg font-black transition-all cursor-pointer
                  ${cfg.bg} ${cfg.text}
                  ${isSelected ? "ring-4 ring-[#FE8330] scale-105 shadow-md z-10" : ""}
                  ${isToday && !isSelected ? "ring-2 ring-gray-400" : ""}
                `}
              >
                <span>{day}</span>
                {entry?.observacao && (
                  <span className="w-2 h-2 rounded-full bg-current opacity-75 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legenda das cores SEMPRE VISÍVEL abaixo do calendário */}
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base font-bold text-gray-700">
        <div className="flex items-center gap-2">
          <span>🟢</span>
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔴</span>
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🟡</span>
          <span>Reservado</span>
        </div>
      </div>

      {/* Painel simples ao tocar numa data (sem modal complexo) */}
      {selectedDate && (
        <div className="p-5 sm:p-6 bg-orange-50/40 border-2 border-[#FE8330]/40 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/60 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Data selecionada
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#1E2229]">
                {dataSelecionadaFormatada}
              </h3>
            </div>
            <div className="self-start sm:self-auto">
              <span className="text-xs font-bold text-gray-500 mr-2">Status atual:</span>
              <span className="text-sm font-black text-[#1E2229]">
                {STATUS_CONFIG[selectedStatus].badge}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 block">
              Altere o status tocando em um dos botões abaixo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={setMutation.isPending}
                onClick={() => handleSetStatus("disponivel")}
                className="min-h-[52px] py-3.5 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" /> Marcar Disponível
              </button>

              <button
                type="button"
                disabled={setMutation.isPending}
                onClick={() => handleSetStatus("ocupado")}
                className="min-h-[52px] py-3.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" /> Marcar Ocupado
              </button>

              <button
                type="button"
                disabled={setMutation.isPending}
                onClick={() => handleSetStatus("reservado")}
                className="min-h-[52px] py-3.5 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <AlertCircle className="w-5 h-5" /> Marcar Reservado
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-1.5">
            <label className="text-xs font-bold text-gray-500 block">
              Observação da data (opcional):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder='Ex: "Casamento da família Silva"'
                value={obsText}
                onChange={e => setObsText(e.target.value)}
                className="flex-1 px-4 py-3.5 rounded-xl border bg-white text-base focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-medium"
              />
              <button
                type="button"
                disabled={setMutation.isPending}
                onClick={() => handleSetStatus(selectedStatus)}
                className="min-h-[52px] px-6 rounded-xl bg-[#1E2229] hover:bg-black text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" /> Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
