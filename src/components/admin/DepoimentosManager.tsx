import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Trash2, Plus, Star, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import {
  getDepoimentosAdmin,
  aprovarDepoimento,
  deleteDepoimento,
  upsertDepoimento,
} from "@/lib/site-content.functions"

export function DepoimentosManager() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"pendentes" | "aprovados">("pendentes")
  const [showForm, setShowForm] = useState(false)

  const { data: todos = [] } = useQuery({
    queryKey: ["depoimentos", "admin"],
    queryFn: () => getDepoimentosAdmin(),
  })

  const pendentes = (todos as any[]).filter(d => !d.aprovado)
  const aprovados = (todos as any[]).filter(d => d.aprovado)

  const aprovarMutation = useMutation({
    mutationFn: (payload: { id: string; aprovado: boolean }) =>
      aprovarDepoimento({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depoimentos"] })
      toast.success("Depoimento atualizado!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDepoimento({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depoimentos"] })
      toast.success("Depoimento excluído!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const addMutation = useMutation({
    mutationFn: (data: any) => upsertDepoimento({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depoimentos"] })
      toast.success("Depoimento adicionado!")
      setShowForm(false)
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  const list = activeTab === "pendentes" ? pendentes : aprovados

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-xl border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold">Depoimentos</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FE8330]/10 text-[#FE8330] font-bold text-sm hover:bg-[#FE8330]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Ocultar formulário" : "Adicionar depoimento"}
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("pendentes")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === "pendentes" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-white border-gray-200 text-gray-500"}`}
          >
            ⏳ Aguardando Aprovação
            {pendentes.length > 0 && (
              <span className="ml-2 bg-yellow-400 text-white text-xs rounded-full px-2 py-0.5">
                {pendentes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("aprovados")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === "aprovados" ? "bg-green-50 border-green-200 text-green-800" : "bg-white border-gray-200 text-gray-500"}`}
          >
            ✅ Aprovados ({aprovados.length})
          </button>
        </div>
      </div>

      {/* Manual form */}
      {showForm && (
        <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-xl border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Novo Depoimento</h3>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={e => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const get = (name: string) =>
                (form.elements.namedItem(name) as HTMLInputElement)?.value ?? ""
              addMutation.mutate({
                nome: get("nome"),
                evento: get("evento"),
                depoimento: get("txt"),
                estrelas: 5,
                aprovado: true,
              })
              form.reset()
            }}
          >
            <input name="nome" placeholder="Nome do Cliente" className="p-4 rounded-2xl border" required />
            <input name="evento" placeholder="Tipo de Evento" className="p-4 rounded-2xl border" />
            <textarea
              name="txt"
              placeholder="Depoimento..."
              className="md:col-span-2 p-4 rounded-2xl border min-h-[100px]"
              required
            />
            <button
              type="submit"
              className="md:col-span-2 py-4 bg-[#FE8330] text-white font-black rounded-2xl"
            >
              ADICIONAR (já aprovado)
            </button>
          </form>
        </div>
      )}

      {/* Depoimentos list */}
      {list.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border text-center text-gray-400">
          {activeTab === "pendentes" ? "Nenhum depoimento aguardando aprovação." : "Nenhum depoimento aprovado ainda."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((dep: any) => (
            <div key={dep.id} className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{dep.nome}</p>
                  {dep.evento && (
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{dep.evento}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(dep.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {dep.estrelas && (
                  <div className="flex text-[#FE8330]">
                    {Array.from({ length: dep.estrelas }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm italic text-gray-600">"{dep.depoimento}"</p>

              {dep.foto_url && (
                <img
                  src={dep.foto_url}
                  alt="Foto do evento"
                  className="w-full h-32 object-cover rounded-xl"
                />
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {!dep.aprovado ? (
                  <button
                    onClick={() => aprovarMutation.mutate({ id: dep.id, aprovado: true })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-bold hover:bg-green-100 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Aprovar
                  </button>
                ) : (
                  <button
                    onClick={() => aprovarMutation.mutate({ id: dep.id, aprovado: false })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-bold hover:bg-yellow-100 transition-colors"
                  >
                    <X className="w-4 h-4" /> Rejeitar
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Deletar este depoimento?")) deleteMutation.mutate(dep.id)
                  }}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
