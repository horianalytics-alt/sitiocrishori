import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, CheckCircle, Image as ImageIcon, Loader2, Save, X, Calendar, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { 
  getEventosSazonais, 
  toggleEventoSazonalAtivo, 
  toggleEfeitoGlobalSazonal,
  criarEventoSazonal, 
  excluirEventoSazonal,
  getSiteContent,
  updateSiteContent
} from "@/lib/site-content.functions"
import { normalizeGallery, type GalleryPhoto } from "@/lib/gallery"
import { MediaManager } from "@/components/admin/MediaManager"

type EventoSazonal = {
  id: string
  nome: string
  emoji: string
  ativo: boolean
  efeito_global_ativo: boolean
  data_inicio: string | null
  data_fim: string | null
  is_system: boolean
}

export function EventosSazonaisManager() {
  const queryClient = useQueryClient()
  const [selectedEventoId, setSelectedEventoId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)

  // Form para novo evento
  const [novoNome, setNovoNome] = useState("")
  const [novoEmoji, setNovoEmoji] = useState("🎉")
  const [novaDataInicio, setNovaDataInicio] = useState("")
  const [novaDataFim, setNovaDataFim] = useState("")

  // Galeria do evento selecionado
  const [galleryItems, setGalleryItems] = useState<GalleryPhoto[]>([])

  // Query dos eventos
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["eventos_sazonais"],
    queryFn: () => getEventosSazonais(),
  })

  // Seleciona o primeiro evento ou o ativo por padrão
  useEffect(() => {
    if (eventos.length > 0 && !selectedEventoId) {
      const active = eventos.find((e: EventoSazonal) => e.ativo)
      setSelectedEventoId(active ? active.id : eventos[0].id)
    }
  }, [eventos, selectedEventoId])

  const selectedEvento = eventos.find((e: EventoSazonal) => e.id === selectedEventoId)

  // Query da galeria do evento selecionado
  const sectionKey = selectedEvento ? `gallery_sazonal_${selectedEvento.id}` : null
  const { data: sectionData, isLoading: isLoadingGallery } = useQuery({
    queryKey: ["site-content", sectionKey],
    queryFn: () => getSiteContent({ data: sectionKey! }),
    enabled: !!sectionKey,
  })

  useEffect(() => {
    if (sectionData) {
      setGalleryItems(normalizeGallery(sectionData))
    } else {
      setGalleryItems([])
    }
  }, [sectionData, sectionKey])

  // Mutation: Toggle Ativo
  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      toggleEventoSazonalAtivo({ data: { id, ativo } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos_sazonais"] })
      queryClient.invalidateQueries({ queryKey: ["evento_sazonal_ativo"] })
      toast.success("Status do tema atualizado!")
    },
    onError: (err: any) => toast.error("Erro ao alterar status: " + err.message),
  })

  // Mutation: Toggle Efeito Global no Site Todo
  const toggleGlobalEfeitoMutation = useMutation({
    mutationFn: ({ id, efeito_global_ativo }: { id: string; efeito_global_ativo: boolean }) =>
      toggleEfeitoGlobalSazonal({ data: { id, efeito_global_ativo } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos_sazonais"] })
      queryClient.invalidateQueries({ queryKey: ["efeito_global_ativo"] })
      toast.success("Efeito global atualizado com sucesso!")
    },
    onError: (err: any) => toast.error("Erro ao alterar efeito global: " + err.message),
  })

  // Mutation: Criar Evento
  const createMutation = useMutation({
    mutationFn: (data: { nome: string; emoji: string; data_inicio?: string | null; data_fim?: string | null }) =>
      criarEventoSazonal({ data }),
    onSuccess: (newEvento: any) => {
      queryClient.invalidateQueries({ queryKey: ["eventos_sazonais"] })
      setIsCreateOpen(false)
      setNovoNome("")
      setNovoEmoji("🎉")
      setNovaDataInicio("")
      setNovaDataFim("")
      setSelectedEventoId(newEvento.id)
      toast.success("Novo evento criado com sucesso!")
    },
    onError: (err: any) => toast.error("Erro ao criar evento: " + err.message),
  })

  // Mutation: Excluir Evento
  const deleteMutation = useMutation({
    mutationFn: (id: string) => excluirEventoSazonal({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos_sazonais"] })
      setSelectedEventoId(null)
      toast.success("Evento excluído!")
    },
    onError: (err: any) => toast.error("Erro ao excluir: " + err.message),
  })

  // Mutation: Salvar Galeria do Evento
  const saveGalleryMutation = useMutation({
    mutationFn: () => {
      if (!sectionKey) throw new Error("Nenhum evento selecionado")
      return updateSiteContent({ data: { section: sectionKey, content: galleryItems } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", sectionKey] })
      toast.success(`Mídias de ${selectedEvento?.nome} salvas com sucesso!`)
    },
    onError: (err: any) => toast.error("Erro ao salvar galeria: " + err.message),
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoNome.trim()) {
      toast.error("Informe o nome do evento")
      return
    }
    createMutation.mutate({
      nome: novoNome.trim(),
      emoji: novoEmoji.trim() || "🎉",
      data_inicio: novaDataInicio || null,
      data_fim: novaDataFim || null,
    })
  }

  const handleDelete = (evento: EventoSazonal) => {
    if (evento.is_system) {
      toast.error("Eventos pré-criados do sistema não podem ser removidos.")
      return
    }
    if (window.confirm(`Tem certeza que deseja excluir o evento "${evento.nome}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(evento.id)
    }
  }

  function formatarVigencia(inicio: string | null, fim: string | null) {
    if (!inicio && !fim) return "📅 Vigência contínua"
    const fData = (d: string) => {
      const parts = d.split("-")
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
    }
    if (inicio && fim) return `📅 ${fData(inicio)} até ${fData(fim)}`
    if (inicio) return `📅 A partir de ${fData(inicio)}`
    return `📅 Até ${fData(fim!)}`
  }

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
      {/* Topo com Título e Botão Criar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1E2229] flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-[#FE8330]" /> Eventos Sazonais
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ative temas especiais no site e gerencie galerias de fotos e vídeos para cada ocasião.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FE8330] text-white font-black text-sm rounded-2xl hover:bg-[#E06B1B] shadow-md shadow-[#FE8330]/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Criar Novo Evento
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#FE8330] animate-spin" />
        </div>
      )}

      {/* Grid de Cards de Eventos */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventos.map((evento: EventoSazonal) => {
            const isSelected = selectedEventoId === evento.id
            return (
              <div
                key={evento.id}
                className={`flex flex-col justify-between p-6 rounded-[2rem] border-2 transition-all min-h-[260px] relative ${
                  isSelected
                    ? "border-[#FE8330] bg-orange-50/20 shadow-lg shadow-[#FE8330]/10"
                    : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
                }`}
              >
                {/* Botão Deletar (apenas criados pelo admin) */}
                {!evento.is_system && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(evento)
                    }}
                    title="Excluir evento"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Conteúdo Central */}
                <div className="text-center space-y-3 pt-2">
                  <div className="text-5xl md:text-6xl select-none">{evento.emoji}</div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1E2229] tracking-tight">
                    {evento.nome}
                  </h3>

                  {/* Status do Evento */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {evento.ativo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-800 border border-green-200">
                        ✅ Ativo no site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-200/70 text-gray-600">
                        ⭕ Inativo
                      </span>
                    )}

                    {evento.efeito_global_ativo && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                        🌟 Efeito global
                      </span>
                    )}
                  </div>

                  {/* Datas de Vigência */}
                  <p className="text-xs font-semibold text-gray-500 pt-1">
                    {formatarVigencia(evento.data_inicio, evento.data_fim)}
                  </p>
                </div>

                {/* Ações do Card */}
                <div className="pt-6 space-y-2">
                  {/* Botão de Toggle Ativar/Desativar */}
                  <button
                    type="button"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate({ id: evento.id, ativo: !evento.ativo })}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      evento.ativo
                        ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        : "bg-[#FE8330] text-white hover:bg-[#E06B1B] shadow-md shadow-[#FE8330]/20"
                    }`}
                  >
                    {toggleMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : evento.ativo ? (
                      "Desativar Tema"
                    ) : (
                      "Ativar no Site"
                    )}
                  </button>

                  {/* Botão de Toggle Efeito em Todo o Site */}
                  <button
                    type="button"
                    disabled={toggleGlobalEfeitoMutation.isPending}
                    onClick={() =>
                      toggleGlobalEfeitoMutation.mutate({
                        id: evento.id,
                        efeito_global_ativo: !evento.efeito_global_ativo,
                      })
                    }
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      evento.efeito_global_ativo
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                  >
                    {toggleGlobalEfeitoMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : evento.efeito_global_ativo ? (
                      "🌟 Efeito em todo o site: ATIVO"
                    ) : (
                      "🌟 Ativar efeito em todo o site"
                    )}
                  </button>

                  {/* Botão Selecionar Mídias */}
                  <button
                    type="button"
                    onClick={() => setSelectedEventoId(evento.id)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#1E2229] text-white"
                        : "bg-white border text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {isSelected ? "Editando Mídias" : "Gerenciar Fotos/Vídeos"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Seção da Galeria do Evento Selecionado */}
      {selectedEvento && (
        <div className="pt-8 border-t border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-[#1E2229] flex items-center gap-2">
                <span>{selectedEvento.emoji}</span>
                <span>Mídias de {selectedEvento.nome}</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Envie fotos e vídeos exclusivos deste tema. Eles serão exibidos com prioridade quando o tema estiver ativo.
              </p>
            </div>
          </div>

          {isLoadingGallery ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#FE8330] animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <MediaManager
                items={galleryItems}
                onChange={setGalleryItems}
                folder={`sazonais_${selectedEvento.id}`}
                showTags={false}
                onUploadingChange={setMediaUploading}
              />

              <button
                type="button"
                disabled={mediaUploading || saveGalleryMutation.isPending}
                onClick={() => saveGalleryMutation.mutate()}
                className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl hover:bg-[#E06B1B] shadow-lg shadow-[#FE8330]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saveGalleryMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Salvando Mídias...</>
                ) : (
                  <><Save className="w-5 h-5" /> SALVAR MÍDIAS DE {selectedEvento.nome.toUpperCase()}</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal: Criar Novo Evento */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[#1E2229]">Criar Novo Evento</h3>
              <p className="text-sm text-gray-500">Cadastre um novo tema sazonal para o sítio.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Nome do Evento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Festa da Primavera"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-bold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Emoji Representativo
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={novoEmoji}
                    onChange={e => setNovoEmoji(e.target.value)}
                    className="w-20 px-3 py-3 bg-gray-50 rounded-xl border text-center text-2xl font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {["🌸", "🎉", "🔥", "🍂", "☀️", "🏖️", "🎊", "🥂"].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNovoEmoji(em)}
                        className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-lg flex items-center justify-center cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Data Início (opcional)
                  </label>
                  <input
                    type="date"
                    value={novaDataInicio}
                    onChange={e => setNovaDataInicio(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Data Fim (opcional)
                  </label>
                  <input
                    type="date"
                    value={novaDataFim}
                    onChange={e => setNovaDataFim(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-4 mt-2 bg-[#FE8330] text-white font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#E06B1B] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
                ) : (
                  "SALVAR EVENTO"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
