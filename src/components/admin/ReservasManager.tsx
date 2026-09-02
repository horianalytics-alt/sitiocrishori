import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Trash2, Copy, MessageCircle, Check, X, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  getReservasAdmin,
  upsertReserva,
  deleteReserva,
  updateReservaStatus,
} from "@/lib/site-content.functions"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-600" },
}

const TIPO_LABELS: Record<string, string> = {
  final_de_semana: "Final de semana",
  festa: "Festa",
}

export function ReservasManager() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("todos")
  const [mesFilter, setMesFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const queryKey = ["reservas", "admin", statusFilter, mesFilter]

  const { data: reservas = [] } = useQuery({
    queryKey,
    queryFn: () =>
      getReservasAdmin({
        data: {
          status: statusFilter !== "todos" ? statusFilter : undefined,
          mes: mesFilter || undefined,
        },
      }),
  })

  const resMutation = useMutation({
    mutationFn: (data: any) => upsertReserva({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("Reserva salva!")
      setShowForm(false)
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteReserva({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("Reserva excluída!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status_novo: string }) =>
      updateReservaStatus({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("Status atualizado!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  function handleCopyLink(linkUnico: string) {
    const url = `${window.location.origin}/reserva/${linkUnico}`
    navigator.clipboard.writeText(url)
    toast.success("Link copiado!")
  }

  function handleWhatsApp(whatsapp: string) {
    const num = whatsapp.replace(/\D/g, "")
    window.open(`https://wa.me/55${num}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <h2 className="text-2xl font-bold">Reservas Recebidas</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FE8330]/10 text-[#FE8330] font-bold text-sm hover:bg-[#FE8330]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Ocultar formulário" : "Bloquear data / Nova reserva"}
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <input
            type="month"
            value={mesFilter}
            onChange={e => setMesFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ring-[#FE8330]/30"
          />
          {mesFilter && (
            <button
              onClick={() => setMesFilter("")}
              className="px-3 py-2 rounded-xl border text-sm text-gray-500 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-xl border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Bloquear Agenda / Nova Reserva Manual</h3>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={e => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const get = (name: string) =>
                (form.elements.namedItem(name) as HTMLInputElement)?.value ?? ""
              resMutation.mutate({
                data_inicio: get("start"),
                data_fim: get("end"),
                cliente_nome: get("nome"),
                cliente_telefone: get("tel"),
                valor_total: parseFloat(get("val") || "0"),
              })
              form.reset()
            }}
          >
            <input name="start" type="date" className="p-4 rounded-2xl border" required />
            <input name="end" type="date" className="p-4 rounded-2xl border" required />
            <input name="nome" placeholder="Nome do Cliente" className="p-4 rounded-2xl border" required />
            <input name="tel" placeholder="WhatsApp do Cliente" className="p-4 rounded-2xl border" />
            <input name="val" type="number" placeholder="Valor (R$)" className="p-4 rounded-2xl border" />
            <button
              type="submit"
              className="py-4 bg-[#FE8330] text-white font-bold rounded-2xl hover:bg-[#E06B1B] transition-colors"
            >
              SALVAR RESERVA
            </button>
          </form>
        </div>
      )}

      {/* Reserva cards */}
      {(reservas as any[]).length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border text-center text-gray-400">
          Nenhuma reserva encontrada com esses filtros.
        </div>
      ) : (
        <div className="grid gap-4">
          {(reservas as any[]).map(res => {
            const status = res.status_novo ?? res.status ?? "pendente"
            const statusCfg = STATUS_LABELS[status] ?? STATUS_LABELS.pendente!
            return (
              <div
                key={res.id}
                className="bg-white p-5 md:p-6 rounded-3xl border shadow-sm space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-black text-lg">{res.cliente_nome ?? "—"}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {res.tipo_evento && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {TIPO_LABELS[res.tipo_evento] ?? res.tipo_evento}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {res.data_evento
                        ? new Date(res.data_evento).toLocaleDateString("pt-BR")
                        : res.data_inicio
                          ? `${new Date(res.data_inicio).toLocaleDateString("pt-BR")} até ${new Date(res.data_fim).toLocaleDateString("pt-BR")}`
                          : "—"}
                      {res.num_convidados ? ` · ${res.num_convidados} convidados` : ""}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {res.whatsapp && (
                    <p><span className="font-semibold">WhatsApp:</span> {res.whatsapp}</p>
                  )}
                  {(res.cliente_telefone && !res.whatsapp) && (
                    <p><span className="font-semibold">Telefone:</span> {res.cliente_telefone}</p>
                  )}
                  {res.mensagem && (
                    <p className="sm:col-span-2 text-gray-600 italic">"{res.mensagem}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Status dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === res.id ? null : res.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-bold hover:bg-gray-50"
                    >
                      Alterar status <ChevronDown className="w-4 h-4" />
                    </button>
                    {openMenu === res.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border rounded-2xl shadow-lg z-10 min-w-[160px] overflow-hidden">
                        {["pendente", "confirmado", "cancelado"].map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              statusMutation.mutate({ id: res.id, status_novo: s })
                              setOpenMenu(null)
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${status === s ? "text-[#FE8330]" : ""}`}
                          >
                            {status === s && <Check className="w-3 h-3" />}
                            {STATUS_LABELS[s]?.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Copy link */}
                  {res.link_unico && (
                    <button
                      onClick={() => handleCopyLink(res.link_unico)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4" /> Copiar Link
                    </button>
                  )}

                  {/* WhatsApp */}
                  {(res.whatsapp || res.cliente_telefone) && (
                    <button
                      onClick={() => handleWhatsApp(res.whatsapp ?? res.cliente_telefone)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-bold hover:bg-green-100"
                    >
                      <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm("Excluir esta reserva?")) delMutation.mutate(res.id)
                    }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
