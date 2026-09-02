import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getConfigSite, updateConfigSite } from "@/lib/site-content.functions"

type ConfigForm = {
  id?: string
  countdown_mensagem: string
  datas_quase_lotadas: string
  instagram_usuario: string
  instagram_token: string
  whatsapp_contato: string
  preco_base_festa: number
  preco_base_fim_semana: number
  mapa_embed_url: string
  mapa_texto: string
}

const EMPTY_FORM: ConfigForm = {
  countdown_mensagem: "",
  datas_quase_lotadas: "",
  instagram_usuario: "",
  instagram_token: "",
  whatsapp_contato: "",
  preco_base_festa: 0,
  preco_base_fim_semana: 0,
  mapa_embed_url: "",
  mapa_texto: "",
}

export function ConfigSiteManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ConfigForm>(EMPTY_FORM)

  const { data: config, isLoading } = useQuery({
    queryKey: ["config_site"],
    queryFn: () => getConfigSite(),
  })

  useEffect(() => {
    if (config) {
      setForm({
        id: (config as any).id,
        countdown_mensagem: (config as any).countdown_mensagem ?? "",
        datas_quase_lotadas: (config as any).datas_quase_lotadas ?? "",
        instagram_usuario: (config as any).instagram_usuario ?? "",
        instagram_token: (config as any).instagram_token ?? "",
        whatsapp_contato: (config as any).whatsapp_contato ?? "",
        preco_base_festa: (config as any).preco_base_festa ?? 0,
        preco_base_fim_semana: (config as any).preco_base_fim_semana ?? 0,
        mapa_embed_url: (config as any).mapa_embed_url ?? "",
        mapa_texto: (config as any).mapa_texto ?? "",
      })
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: (data: ConfigForm) => updateConfigSite({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config_site"] })
      toast.success("Configurações salvas!")
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  })

  if (isLoading) {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border flex justify-center">
        <Loader2 className="w-6 h-6 text-[#FE8330] animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
      <h2 className="text-2xl font-bold">Configurações Gerais</h2>

      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Mensagem de Urgência / Contador
          </label>
          <textarea
            className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20 min-h-[80px]"
            placeholder='Ex: "Dezembro quase lotado — restam 2 finais de semana"'
            value={form.countdown_mensagem}
            onChange={e => setForm(f => ({ ...f, countdown_mensagem: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Datas Quase Lotadas
          </label>
          <textarea
            className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20 min-h-[80px]"
            placeholder="Ex: 2026-12-20, 2026-12-21"
            value={form.datas_quase_lotadas}
            onChange={e => setForm(f => ({ ...f, datas_quase_lotadas: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Usuário do Instagram</label>
            <div className="flex items-center border rounded-2xl overflow-hidden focus-within:ring-2 ring-[#FE8330]/20">
              <span className="px-4 py-4 bg-gray-50 text-gray-400 text-sm border-r select-none">@</span>
              <input
                className="flex-1 p-4 focus:outline-none bg-transparent"
                placeholder="sitiocrishori"
                value={form.instagram_usuario}
                onChange={e => setForm(f => ({ ...f, instagram_usuario: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Token da API do Instagram</label>
            <input
              type="password"
              className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20 bg-transparent"
              placeholder="IGQWR..."
              value={form.instagram_token}
              onChange={e => setForm(f => ({ ...f, instagram_token: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">WhatsApp Principal</label>
            <div className="flex items-center border rounded-2xl overflow-hidden focus-within:ring-2 ring-[#FE8330]/20">
              <span className="px-4 py-4 bg-gray-50 text-gray-400 text-sm border-r select-none">+55</span>
              <input
                className="flex-1 p-4 focus:outline-none bg-transparent"
                placeholder="11999999999"
                value={form.whatsapp_contato}
                onChange={e => setForm(f => ({ ...f, whatsapp_contato: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Preço Base - Festa (R$)</label>
            <input
              type="number"
              className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20"
              value={form.preco_base_festa || ""}
              onChange={e => setForm(f => ({ ...f, preco_base_festa: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Preço Base - Fim de Semana (R$)</label>
            <input
              type="number"
              className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20"
              value={form.preco_base_fim_semana || ""}
              onChange={e => setForm(f => ({ ...f, preco_base_fim_semana: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Google Maps Embed URL</label>
          <input
            className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20"
            placeholder="Link do iframe do Google Maps"
            value={form.mapa_embed_url}
            onChange={e => setForm(f => ({ ...f, mapa_embed_url: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Texto de Localização / Distância</label>
          <textarea
            className="w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 ring-[#FE8330]/20 min-h-[80px]"
            placeholder="Ex: Apenas 40 min de SP..."
            value={form.mapa_texto}
            onChange={e => setForm(f => ({ ...f, mapa_texto: e.target.value }))}
          />
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate(form)}
        disabled={saveMutation.isPending}
        className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl hover:bg-[#E06B1B] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saveMutation.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
        ) : (
          <><Save className="w-5 h-5" /> SALVAR CONFIGURAÇÕES</>
        )}
      </button>
    </div>
  )
}
