import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Users, 
  Sparkles, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  X
} from "lucide-react"
import { toast } from "sonner"
import { 
  getPacotesAdmin, 
  criarPacote, 
  atualizarPacote, 
  excluirPacote, 
  reordenarPacotes 
} from "@/lib/site-content.functions"

type Pacote = {
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
  created_at: string
}

type PacoteFormData = {
  id?: string
  nome: string
  num_pessoas: string
  preco_total: string
  preco_por_pessoa: string
  itens_texto: string
  destaque: boolean
  texto_destaque: string
  ativo: boolean
}

const EMPTY_FORM: PacoteFormData = {
  nome: "",
  num_pessoas: "",
  preco_total: "",
  preco_por_pessoa: "",
  itens_texto: "",
  destaque: false,
  texto_destaque: "Mais Popular",
  ativo: true,
}

export function PacotesManager() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<PacoteFormData>(EMPTY_FORM)
  const [pacoteToDelete, setPacoteToDelete] = useState<Pacote | null>(null)

  const { data: pacotes = [], isLoading } = useQuery({
    queryKey: ["pacotes_admin"],
    queryFn: () => getPacotesAdmin(),
  }) as { data: Pacote[]; isLoading: boolean }

  const saveMutation = useMutation({
    mutationFn: async (data: PacoteFormData) => {
      const itens = data.itens_texto
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean)

      const payload = {
        nome: data.nome,
        num_pessoas: data.num_pessoas ? parseInt(data.num_pessoas, 10) : null,
        preco_total: data.preco_total ? parseFloat(data.preco_total) : null,
        preco_por_pessoa: data.preco_por_pessoa ? parseFloat(data.preco_por_pessoa) : null,
        itens_incluidos: itens,
        destaque: data.destaque,
        texto_destaque: data.destaque ? data.texto_destaque : null,
        ativo: data.ativo,
      }

      if (data.id) {
        return atualizarPacote({ data: { id: data.id, ...payload } })
      } else {
        return criarPacote({ data: payload })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacotes_admin"] })
      queryClient.invalidateQueries({ queryKey: ["pacotes_publica"] })
      toast.success("✅ Salvo com sucesso!")
      setIsModalOpen(false)
      setFormData(EMPTY_FORM)
    },
    onError: () => {
      toast.error("❌ Erro ao salvar, tente novamente")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excluirPacote({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacotes_admin"] })
      queryClient.invalidateQueries({ queryKey: ["pacotes_publica"] })
      toast.success("✅ Pacote excluído com sucesso!")
      setPacoteToDelete(null)
    },
    onError: () => {
      toast.error("❌ Erro ao salvar, tente novamente")
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; ordem: number }[]) =>
      reordenarPacotes({ data: { updates } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacotes_admin"] })
      queryClient.invalidateQueries({ queryKey: ["pacotes_publica"] })
    },
    onError: () => {
      toast.error("❌ Erro ao salvar, tente novamente")
    },
  })

  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (pacote: Pacote) => {
    const itens = Array.isArray(pacote.itens_incluidos)
      ? pacote.itens_incluidos.join("\n")
      : ""

    setFormData({
      id: pacote.id,
      nome: pacote.nome,
      num_pessoas: pacote.num_pessoas !== null ? String(pacote.num_pessoas) : "",
      preco_total: pacote.preco_total !== null ? String(pacote.preco_total) : "",
      preco_por_pessoa: pacote.preco_por_pessoa !== null ? String(pacote.preco_por_pessoa) : "",
      itens_texto: itens,
      destaque: pacote.destaque ?? false,
      texto_destaque: pacote.texto_destaque ?? "Mais Popular",
      ativo: pacote.ativo ?? true,
    })
    setIsModalOpen(true)
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= pacotes.length) return

    const current = pacotes[index]
    const target = pacotes[targetIndex]
    if (!current || !target) return

    reorderMutation.mutate([
      { id: current.id, ordem: target.ordem },
      { id: target.id, ordem: current.ordem },
    ])
  }

  const formatMoney = (val: number | null) => {
    if (val === null || isNaN(val)) return null
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Topo com Botão e Descrição */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[#1E2229] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#FE8330]" />
            Gerenciar Pacotes de Locação
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Crie opções prontas para os visitantes escolherem no site. Campos não preenchidos não aparecem para o cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[52px] px-6 py-3.5 rounded-2xl bg-[#FE8330] hover:bg-[#E06B1B] text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-[#FE8330]/20 transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          ➕ Criar Pacote
        </button>
      </div>

      {/* Lista de Pacotes em Cards */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FE8330] animate-spin" />
        </div>
      ) : pacotes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FE8330] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900">Nenhum pacote cadastrado</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Clique no botão acima "➕ Criar Pacote" para cadastrar sua primeira opção de locação ou evento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pacotes.map((pacote, idx) => (
            <div
              key={pacote.id}
              className={`p-6 rounded-3xl bg-white border-2 transition-all space-y-4 flex flex-col justify-between ${
                pacote.destaque ? "border-[#FE8330] shadow-md shadow-[#FE8330]/10" : "border-gray-100 shadow-sm"
              } ${!pacote.ativo ? "opacity-60 bg-gray-50/70" : ""}`}
            >
              <div className="space-y-3">
                {/* Header do Card com Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {pacote.destaque && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FE8330] text-white uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        {pacote.texto_destaque || "Mais Popular"}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        pacote.ativo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {pacote.ativo ? "🟢 Ativo no site" : "⚪ Oculto"}
                    </span>
                  </div>

                  {/* Botões de Reordenação */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0 || reorderMutation.isPending}
                      onClick={() => handleMove(idx, "up")}
                      className="w-9 h-9 rounded-xl border bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 disabled:opacity-30 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pacotes.length - 1 || reorderMutation.isPending}
                      onClick={() => handleMove(idx, "down")}
                      className="w-9 h-9 rounded-xl border bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 disabled:opacity-30 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nome do Pacote */}
                <h3 className="text-xl font-black text-[#1E2229] tracking-tight">{pacote.nome}</h3>

                {/* Preços e Capacidade */}
                <div className="flex flex-wrap items-baseline gap-3 pt-1">
                  {pacote.preco_total !== null && (
                    <div className="text-2xl font-black text-[#FE8330]">
                      {formatMoney(pacote.preco_total)}
                      <span className="text-xs text-gray-500 font-bold ml-1">total</span>
                    </div>
                  )}

                  {pacote.preco_por_pessoa !== null && (
                    <div className="text-lg font-black text-gray-800">
                      {formatMoney(pacote.preco_por_pessoa)}
                      <span className="text-xs text-gray-500 font-bold ml-1">/ pessoa</span>
                    </div>
                  )}

                  {pacote.num_pessoas !== null && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 text-xs font-bold text-gray-700">
                      <Users className="w-3.5 h-3.5" />
                      Até {pacote.num_pessoas} pessoas
                    </div>
                  )}
                </div>

                {/* Lista de Itens Incluídos */}
                {Array.isArray(pacote.itens_incluidos) && pacote.itens_incluidos.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                      Itens Incluídos:
                    </span>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      {pacote.itens_incluidos.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Botões de Ação do Card */}
              <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(pacote)}
                  className="flex-1 min-h-[52px] px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPacoteToDelete(pacote)}
                  className="min-h-[52px] px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Pacote */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header do Modal */}
            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1E2229]">
                  {formData.id ? "Editar Pacote" : "➕ Criar Novo Pacote"}
                </h3>
                <p className="text-xs text-[#FE8330] font-bold mt-0.5">
                  💡 Campos não preenchidos não aparecem para o cliente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Formulário */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Nome do Pacote */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">
                  Nome do pacote *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Final de Semana em Família"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl border bg-gray-50 text-base focus:bg-white focus:ring-2 ring-[#FE8330]/30 outline-none"
                />
              </div>

              {/* Número de pessoas (opcional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">
                  Número de pessoas (opcional)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 30"
                  value={formData.num_pessoas}
                  onChange={e => setFormData({ ...formData, num_pessoas: e.target.value })}
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl border bg-gray-50 text-base focus:bg-white focus:ring-2 ring-[#FE8330]/30 outline-none"
                />
              </div>

              {/* Preço total e Preço por pessoa em grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">
                    Preço total (opcional, R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 3500.00"
                    value={formData.preco_total}
                    onChange={e => setFormData({ ...formData, preco_total: e.target.value })}
                    className="w-full min-h-[52px] px-4 py-3 rounded-2xl border bg-gray-50 text-base focus:bg-white focus:ring-2 ring-[#FE8330]/30 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">
                    Preço por pessoa (opcional, R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 65.00"
                    value={formData.preco_por_pessoa}
                    onChange={e => setFormData({ ...formData, preco_por_pessoa: e.target.value })}
                    className="w-full min-h-[52px] px-4 py-3 rounded-2xl border bg-gray-50 text-base focus:bg-white focus:ring-2 ring-[#FE8330]/30 outline-none"
                  />
                </div>
              </div>

              {/* Lista de Itens Incluídos */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">
                  Lista de itens incluídos (um por linha)
                </label>
                <p className="text-xs text-gray-400">
                  Cada linha escrita abaixo se tornará um item com ícone ✅ no card.
                </p>
                <textarea
                  rows={5}
                  placeholder={`Hospedagem completa para até 30 pessoas\nPiscina aquecida liberada\nÁrea de churrasco equipada\nCampo de futebol e salão de jogos`}
                  value={formData.itens_texto}
                  onChange={e => setFormData({ ...formData, itens_texto: e.target.value })}
                  className="w-full p-4 rounded-2xl border bg-gray-50 text-base focus:bg-white focus:ring-2 ring-[#FE8330]/30 outline-none leading-relaxed"
                />
              </div>

              {/* Destaque e Texto de Destaque */}
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/60 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.destaque}
                    onChange={e => setFormData({ ...formData, destaque: e.target.checked })}
                    className="w-5 h-5 rounded text-[#FE8330] focus:ring-[#FE8330] accent-[#FE8330]"
                  />
                  <span className="font-black text-sm text-gray-900">
                    ⭐ Destacar este pacote no site
                  </span>
                </label>

                {formData.destaque && (
                  <div className="space-y-1 pl-8">
                    <label className="text-xs font-bold text-gray-600">
                      Texto do Badge de Destaque
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mais Popular, Melhor Custo-Benefício..."
                      value={formData.texto_destaque}
                      onChange={e => setFormData({ ...formData, texto_destaque: e.target.value })}
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2 ring-[#FE8330]/30"
                    />
                  </div>
                )}
              </div>

              {/* Toggle Ativo / Inativo */}
              <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-5 h-5 rounded text-[#FE8330] focus:ring-[#FE8330] accent-[#FE8330]"
                  />
                  <span className="font-bold text-sm text-gray-900">
                    Exibir este pacote no site público (Ativo)
                  </span>
                </label>
              </div>
            </div>

            {/* Rodapé Fixo com Botão Salvar */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[52px] px-6 rounded-2xl bg-white border hover:bg-gray-100 font-bold text-gray-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!formData.nome.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate(formData)}
                className="min-h-[52px] px-8 rounded-2xl bg-[#FE8330] hover:bg-[#E06B1B] text-white font-black text-base shadow-lg shadow-[#FE8330]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
                ) : (
                  <><Check className="w-5 h-5" /> Salvar Pacote</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {pacoteToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] max-w-sm w-full space-y-4 text-center shadow-2xl border">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-[#1E2229]">Excluir Pacote?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tem certeza que deseja excluir o pacote <strong>"{pacoteToDelete.nome}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPacoteToDelete(null)}
                className="min-h-[52px] rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-base cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(pacoteToDelete.id)}
                className="min-h-[52px] rounded-2xl bg-red-600 hover:bg-red-700 font-black text-white text-base shadow-lg shadow-red-600/20 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sim, excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
