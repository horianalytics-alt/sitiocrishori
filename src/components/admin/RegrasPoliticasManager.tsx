import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  getRegrasPoliticas,
  upsertRegraPolitica,
  deleteRegraPolitica,
  reorderRegrasPoliticas,
} from "@/lib/site-content.functions"

const DEFAULT_REGRAS = [
  { titulo: "Check-in e Check-out", conteudo: "Check-in a partir das 15h. Check-out até as 12h do dia seguinte.", ordem: 0 },
  { titulo: "Cancelamento", conteudo: "Cancelamentos com mais de 30 dias de antecedência recebem reembolso integral do sinal.", ordem: 1 },
  { titulo: "Som e Música", conteudo: "Música ambiente até as 22h em dias de semana e meia-noite nos finais de semana.", ordem: 2 },
  { titulo: "Pets", conteudo: "Animais de estimação são bem-vindos. Informe com antecedência.", ordem: 3 },
  { titulo: "Capacidade", conteudo: "Capacidade máxima de 80 pessoas para eventos e 20 para hospedagem.", ordem: 4 },
  { titulo: "Limpeza", conteudo: "O sítio deve ser entregue nas mesmas condições que foi recebido. Taxa de limpeza adicional pode ser cobrada.", ordem: 5 },
]

type Regra = {
  id?: string
  titulo: string
  conteudo: string
  ordem: number
}

export function RegrasPoliticasManager() {
  const queryClient = useQueryClient()
  const [editMap, setEditMap] = useState<Record<string, Regra>>({})

  const { data: regras = [], isLoading } = useQuery({
    queryKey: ["regras_politicas"],
    queryFn: () => getRegrasPoliticas(),
  })

  const upsertMutation = useMutation({
    mutationFn: (data: any) => upsertRegraPolitica({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras_politicas"] })
      toast.success("Regra salva!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRegraPolitica({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras_politicas"] })
      toast.success("Regra excluída!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderRegrasPoliticas({ data: orderedIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regras_politicas"] }),
    onError: (err: any) => toast.error("Erro ao reordenar: " + err.message),
  })

  const list = (regras as any[]).length > 0 ? (regras as any[]) : []

  function getEditing(regra: any): Regra {
    return editMap[regra.id ?? regra.ordem] ?? regra
  }

  function setField(id: string, field: keyof Regra, value: string) {
    setEditMap(prev => ({
      ...prev,
      [id]: { ...(prev[id] as Regra), [field]: value } as Regra,
    }))
  }

  function handleSave(regra: any) {
    const editing = getEditing(regra)
    upsertMutation.mutate({ ...regra, ...editing })
    if (regra.id) setEditMap(prev => { const n = { ...prev }; delete n[regra.id]; return n })
  }

  function handleMove(idx: number, dir: -1 | 1) {
    const newList = [...list]
    const swap = idx + dir
    if (swap < 0 || swap >= newList.length) return;
    [newList[idx], newList[swap]] = [newList[swap], newList[idx]]
    const ids = newList.map((r: any) => r.id).filter(Boolean)
    reorderMutation.mutate(ids)
  }

  async function handleSeedDefaults() {
    for (const r of DEFAULT_REGRAS) {
      await upsertRegraPolitica({ data: r })
    }
    queryClient.invalidateQueries({ queryKey: ["regras_politicas"] })
    toast.success("Regras padrão criadas!")
  }

  function handleAddNew() {
    const newRegra = { titulo: "Nova Regra", conteudo: "", ordem: list.length }
    upsertMutation.mutate(newRegra)
  }

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold">Regras e Políticas</h2>
        <div className="flex gap-2">
          {list.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2 rounded-xl border text-sm font-bold hover:bg-gray-50"
            >
              Criar regras padrão
            </button>
          )}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FE8330]/10 text-[#FE8330] font-bold text-sm hover:bg-[#FE8330]/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Regra
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#FE8330] animate-spin" />
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          Nenhuma regra cadastrada. Crie regras padrão ou adicione manualmente.
        </div>
      )}

      <div className="space-y-4">
        {list.map((regra: any, idx: number) => {
          const key = regra.id ?? String(idx)
          const editing = getEditing(regra)
          const isDirty =
            editing.titulo !== regra.titulo || editing.conteudo !== regra.conteudo
          return (
            <div key={key} className="p-5 bg-gray-50 rounded-3xl border space-y-3">
              <div className="flex items-start gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 mt-1 shrink-0">
                  <button
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === list.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    className="w-full font-bold text-base bg-white rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                    value={editing.titulo ?? regra.titulo}
                    onChange={e => setField(key, "titulo", e.target.value)}
                    placeholder="Título da regra"
                  />
                  <textarea
                    className="w-full text-sm bg-white rounded-xl px-3 py-2 border min-h-[80px] focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                    value={editing.conteudo ?? regra.conteudo}
                    onChange={e => setField(key, "conteudo", e.target.value)}
                    placeholder="Conteúdo da regra..."
                  />
                </div>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (regra.id && confirm("Excluir esta regra?")) {
                      deleteMutation.mutate(regra.id)
                    }
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  aria-label="Excluir regra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isDirty && (
                <button
                  onClick={() => handleSave(regra)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FE8330] text-white text-sm font-bold hover:bg-[#E06B1B] transition-colors"
                >
                  <Save className="w-4 h-4" /> Salvar alterações
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
