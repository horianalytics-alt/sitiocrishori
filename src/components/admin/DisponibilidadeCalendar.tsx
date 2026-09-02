import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getDisponibilidade, setDisponibilidade } from "@/lib/site-content.functions"

type DisponibilidadeStatus = "disponivel" | "ocupado" | "reservado"

const STATUS_CYCLE: DisponibilidadeStatus[] = ["disponivel", "ocupado", "reservado"]

const STATUS_CONFIG = {
  disponivel: {
    label: "Disponível",
    bg: "bg-green-100 hover:bg-green-200",
    text: "text-green-800",
    dot: "bg-green-500",
  },
  ocupado: {
    label: "Ocupado",
    bg: "bg-red-100 hover:bg-red-200",
    text: "text-red-800",
    dot: "bg-red-500",
  },
  reservado: {
    label: "Reservado",
    bg: "bg-yellow-100 hover:bg-yellow-200",
    text: "text-yellow-800",
    dot: "bg-yellow-500",
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
  const [editingDate, setEditingDate] = useState<string | null>(null)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  function handleDayClick(dateStr: string) {
    const current = statusMap.get(dateStr)?.status ?? "disponivel"
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]!
    const obs = statusMap.get(dateStr)?.observacao
    setMutation.mutate({ data: dateStr, status: next, ...(obs ? { observacao: obs } : {}) })
    toast.success(`${dateStr} → ${STATUS_CONFIG[next].label}`)
  }

  function handleSaveObs() {
    if (!editingDate) return
    const current = statusMap.get(editingDate)?.status ?? "disponivel"
    setMutation.mutate({ data: editingDate, status: current, observacao: obsText })
    toast.success("Observação salva!")
    setEditingDate(null)
    setObsText("")
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
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate())

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendário de Disponibilidade</h2>
        {isLoading && <Loader2 className="w-5 h-5 text-[#FE8330] animate-spin" />}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(STATUS_CONFIG) as [DisponibilidadeStatus, typeof STATUS_CONFIG["disponivel"]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
        <span className="text-xs text-gray-400 ml-2">Clique para alternar status · Clique direito para observação</span>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold">
          {MONTHS_PT[viewMonth - 1]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}

        {/* Day cells */}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const dateStr = toDateStr(viewYear, viewMonth, day)
          const entry = statusMap.get(dateStr)
          const status: DisponibilidadeStatus = entry?.status ?? "disponivel"
          const cfg = STATUS_CONFIG[status]
          const isToday = dateStr === todayStr
          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              onContextMenu={(e) => {
                e.preventDefault()
                setEditingDate(dateStr)
                setObsText(entry?.observacao ?? "")
              }}
              title={entry?.observacao ? `📝 ${entry.observacao}` : cfg.label}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all
                ${cfg.bg} ${cfg.text}
                ${isToday ? "ring-2 ring-[#FE8330] ring-offset-1" : ""}
              `}
            >
              {day}
              {entry?.observacao && (
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              )}
            </button>
          )
        })}
      </div>

      {/* Observation popover */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">Observação para {editingDate}</h3>
            <textarea
              className="w-full border rounded-2xl p-3 min-h-[80px] focus:outline-none focus:ring-2 ring-[#FE8330]/30"
              placeholder='Ex: "Casamento da família Silva"'
              value={obsText}
              onChange={e => setObsText(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingDate(null); setObsText("") }}
                className="flex-1 py-3 rounded-xl border font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveObs}
                className="flex-1 py-3 rounded-xl bg-[#FE8330] text-white font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
