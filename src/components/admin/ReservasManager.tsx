import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Copy, Check, X, Plus, Calendar, Users, MessageCircle, PartyPopper } from "lucide-react"
import { toast } from "sonner"
import {
  getReservasAdmin,
  upsertReserva,
  deleteReserva,
  updateReservaStatus,
} from "@/lib/site-content.functions"

const STATUS_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  pendente: { label: "Pendente", badge: "🟡 Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmado: { label: "Confirmado", badge: "🟢 Confirmado", color: "bg-green-100 text-green-800 border-green-200" },
  cancelado: { label: "Cancelado", badge: "🔴 Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
}

const TIPO_LABELS: Record<string, string> = {
  final_de_semana: "🌿 Final de Semana",
  festa: "🎉 Festa & Eventos",
  day_use: "☀️ Day Use",
}

export function ReservasManager() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("todos")
  const [mesFilter, setMesFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [reservaParaExcluir, setReservaParaExcluir] = useState<any | null>(null)

  const queryKey = ["reservas", "admin", statusFilter, mesFilter]

  const { data: reservas = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      getReservasAdmin({
        data: {
          ...(statusFilter !== "todos" ? { status: statusFilter } : {}),
          ...(mesFilter ? { mes: mesFilter } : {}),
        },
      }),
  })

  const resMutation = useMutation({
    mutationFn: (data: any) => upsertReserva({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("✅ Salvo com sucesso!")
      setShowForm(false)
    },
    onError: () => toast.error("❌ Erro ao salvar, tente novamente"),
  })

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteReserva({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("✅ Reserva excluída com sucesso!")
      setReservaParaExcluir(null)
    },
    onError: () => toast.error("❌ Erro ao salvar, tente novamente"),
  })

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status_novo: string }) =>
      updateReservaStatus({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("✅ Salvo com sucesso!")
    },
    onError: () => toast.error("❌ Erro ao salvar, tente novamente"),
  })

  function handleCopyLink(res: any) {
    if (!res.link_unico) return
    const url = `${window.location.origin}/reserva/${res.link_unico}`
    navigator.clipboard.writeText(url)
    setCopiedId(res.id)
    toast.success("Link copiado com sucesso!")
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  function handleWhatsApp(whatsappNumber: string, nomeCliente: string) {
    const clean = (whatsappNumber || "").replace(/\D/g, "")
    if (!clean) {
      toast.error("Número de WhatsApp não informado")
      return
    }
    const msg = `Olá ${nomeCliente}! Tudo bem? Estou entrando em contato sobre a sua reserva no Sítio Cris Hori.`
    window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Header & Filtros */}
      <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1E2229]">
              Gestão de Reservas
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Acompanhe pedidos recebidos pelo site e altere o status das reservas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="min-h-[52px] px-6 py-3.5 rounded-2xl bg-[#FE8330] text-white font-black text-base hover:bg-[#E06B1B] shadow-md shadow-[#FE8330]/20 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            {showForm ? "Ocultar Formulário" : "Bloquear Data / Nova Reserva"}
          </button>
        </div>

        {/* Linha de Filtros Grandes */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Filtrar por Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full min-h-[52px] px-4 py-3 rounded-2xl border text-base font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 ring-[#FE8330]/30 cursor-pointer"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">🟡 Pendentes</option>
              <option value="confirmado">🟢 Confirmados</option>
              <option value="cancelado">🔴 Cancelados</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Filtrar por Mês
            </label>
            <div className="flex gap-2">
              <input
                type="month"
                value={mesFilter}
                onChange={e => setMesFilter(e.target.value)}
                className="w-full min-h-[52px] px-4 py-3 rounded-2xl border text-base font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 ring-[#FE8330]/30"
              />
              {mesFilter && (
                <button
                  type="button"
                  onClick={() => setMesFilter("")}
                  className="min-h-[52px] px-4 rounded-2xl border bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer"
                  title="Limpar filtro de mês"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro Manual (Um campo por linha) */}
      {showForm && (
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
          <div className="border-b pb-3">
            <h3 className="text-xl md:text-2xl font-black text-[#1E2229]">
              Cadastrar Reserva Manualmente
            </h3>
            <p className="text-sm text-gray-500">Bloqueie datas ou adicione uma reserva feita fora do site.</p>
          </div>

          <form
            className="space-y-4"
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
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Nome do Cliente *</label>
              <input
                name="nome"
                required
                placeholder="Ex: Carlos Eduardo"
                className="w-full min-h-[52px] px-4 py-3.5 rounded-2xl border bg-gray-50 text-base font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">WhatsApp do Cliente</label>
              <input
                name="tel"
                placeholder="Ex: (11) 99999-9999"
                className="w-full min-h-[52px] px-4 py-3.5 rounded-2xl border bg-gray-50 text-base font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Data de Início *</label>
                <input
                  name="start"
                  type="date"
                  required
                  className="w-full min-h-[52px] px-4 py-3.5 rounded-2xl border bg-gray-50 text-base font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Data de Término *</label>
                <input
                  name="end"
                  type="date"
                  required
                  className="w-full min-h-[52px] px-4 py-3.5 rounded-2xl border bg-gray-50 text-base font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Valor Total Combinado (R$)</label>
              <input
                name="val"
                type="number"
                placeholder="Ex: 3500"
                className="w-full min-h-[52px] px-4 py-3.5 rounded-2xl border bg-gray-50 text-base font-medium focus:outline-none focus:ring-2 ring-[#FE8330]/30"
              />
            </div>

            <button
              type="submit"
              disabled={resMutation.isPending}
              className="w-full min-h-[52px] py-4 bg-[#FE8330] text-white font-black text-base rounded-2xl hover:bg-[#E06B1B] shadow-md shadow-[#FE8330]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              SALVAR RESERVA
            </button>
          </form>
        </div>
      )}

      {/* Lista de Reservas em Cards Completos */}
      {isLoading && (
        <div className="bg-white p-12 rounded-3xl border text-center text-gray-500 font-bold">
          Carregando reservas...
        </div>
      )}

      {!isLoading && (reservas as any[]).length === 0 && (
        <div className="bg-white p-12 rounded-3xl border text-center text-gray-400 font-bold">
          Nenhuma reserva encontrada com os filtros selecionados.
        </div>
      )}

      {!isLoading && (reservas as any[]).length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {(reservas as any[]).map((res: any) => {
            const statusKey = res.status_novo ?? res.status ?? "pendente"
            const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG["pendente"]!
            const isCopied = copiedId === res.id

            const dataFormatada = res.data_evento
              ? new Date(res.data_evento).toLocaleDateString("pt-BR")
              : res.data_inicio
                ? `${new Date(res.data_inicio).toLocaleDateString("pt-BR")} até ${new Date(res.data_fim).toLocaleDateString("pt-BR")}`
                : "A combinar"

            const clientPhone = res.whatsapp || res.cliente_telefone || ""

            return (
              <div
                key={res.id}
                className="bg-white p-6 sm:p-7 rounded-[2rem] border-2 border-gray-100 hover:border-gray-200 shadow-sm space-y-5 transition-all"
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                      Cliente
                    </span>
                    <h3 className="text-2xl font-black text-[#1E2229]">
                      {res.cliente_nome ?? "Cliente não informado"}
                    </h3>
                  </div>

                  {/* Status Colorido */}
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black border ${statusCfg.color} self-start sm:self-auto`}
                  >
                    {statusCfg.badge}
                  </span>
                </div>

                {/* Informações em Destaque */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/60 text-[#FE8330] flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase block">Data</span>
                      <span className="text-sm font-black text-gray-800">{dataFormatada}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase block">Convidados</span>
                      <span className="text-sm font-black text-gray-800">
                        {res.num_convidados ? `${res.num_convidados} pessoas` : "Não informado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0">
                      <PartyPopper className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase block">Tipo</span>
                      <span className="text-sm font-black text-gray-800">
                        {TIPO_LABELS[res.tipo_evento] ?? res.tipo_evento ?? "Não especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observação / Mensagem se houver */}
                {res.mensagem && (
                  <div className="p-3.5 bg-orange-50/40 rounded-xl border border-orange-100/60 text-sm text-gray-700 italic">
                    <strong className="not-italic text-gray-900 font-bold">Mensagem do cliente: </strong>
                    "{res.mensagem}"
                  </div>
                )}

                {/* Três botões visíveis de ação + Copiar Link */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  {/* 1. Confirmar */}
                  <button
                    type="button"
                    disabled={statusMutation.isPending || statusKey === "confirmado"}
                    onClick={() => statusMutation.mutate({ id: res.id, status_novo: "confirmado" })}
                    className={`min-h-[52px] px-4 py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      statusKey === "confirmado"
                        ? "bg-green-100 text-green-800 opacity-60 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    }`}
                  >
                    <Check className="w-5 h-5" /> Confirmar
                  </button>

                  {/* 2. Cancelar */}
                  <button
                    type="button"
                    disabled={statusMutation.isPending || statusKey === "cancelado"}
                    onClick={() => statusMutation.mutate({ id: res.id, status_novo: "cancelado" })}
                    className={`min-h-[52px] px-4 py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      statusKey === "cancelado"
                        ? "bg-red-100 text-red-800 opacity-60 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    }`}
                  >
                    <X className="w-5 h-5" /> Cancelar
                  </button>

                  {/* 3. WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(clientPhone, res.cliente_nome || "")}
                    className="min-h-[52px] px-4 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" /> WhatsApp
                  </button>

                  {/* 4. Copiar Link com feedback de 2s */}
                  {res.link_unico ? (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(res)}
                      className={`min-h-[52px] px-4 py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        isCopied
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"
                      }`}
                    >
                      <Copy className="w-5 h-5" />
                      {isCopied ? "Link copiado!" : "🔗 Copiar link"}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Excluir no rodapé com confirmação */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setReservaParaExcluir(res)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir esta reserva
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal simples de confirmação de exclusão */}
      {reservaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#1E2229]">Tem certeza?</h4>
              <p className="text-sm text-gray-500 mt-1">
                Esta ação não pode ser desfeita e removerá os dados desta reserva.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReservaParaExcluir(null)}
                className="min-h-[52px] rounded-xl border border-gray-300 font-bold text-base hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={delMutation.isPending}
                onClick={() => delMutation.mutate(reservaParaExcluir.id)}
                className="min-h-[52px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-base cursor-pointer"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
