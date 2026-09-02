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
  fim_semana_tipo_preco: "fixo" | "por_pessoa"
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
  fim_semana_tipo_preco: "fixo",
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
        fim_semana_tipo_preco: ((config as any).fim_semana_tipo_preco as "fixo" | "por_pessoa") || "fixo",
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

        {/* Seção Simulador de Orçamento */}
        <div className="pt-6 border-t border-gray-100 space-y-4">
          <div>
            <h3 className="text-xl font-black text-[#1E2229]">Simulador de Orçamento</h3>
            <p className="text-sm text-gray-500">Defina os preços base utilizados para calcular a estimativa exibida aos visitantes no site.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50/50 border border-orange-100 p-6 rounded-2xl">
            {/* Festa */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Valor base Festa (R$ por pessoa)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 select-none">R$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-bold"
                  placeholder="Ex: 80"
                  value={form.preco_base_festa || ""}
                  onChange={e => setForm(f => ({ ...f, preco_base_festa: Number(e.target.value) }))}
                />
              </div>
              <p className="text-xs text-gray-400">Multiplicado pelo número de convidados (ex: 50 pessoas × R$ 80 = R$ 4.000).</p>
            </div>

            {/* Final de Semana */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">
                Valor base Final de Semana
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 select-none">R$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-bold"
                  placeholder="Ex: 2500"
                  value={form.preco_base_fim_semana || ""}
                  onChange={e => setForm(f => ({ ...f, preco_base_fim_semana: Number(e.target.value) }))}
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="fim_semana_tipo_preco"
                    value="fixo"
                    checked={form.fim_semana_tipo_preco === "fixo"}
                    onChange={() => setForm(f => ({ ...f, fim_semana_tipo_preco: "fixo" }))}
                    className="accent-[#FE8330] w-4 h-4 cursor-pointer"
                  />
                  <span>R$ Fixo (pacote/diária)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="fim_semana_tipo_preco"
                    value="por_pessoa"
                    checked={form.fim_semana_tipo_preco === "por_pessoa"}
                    onChange={() => setForm(f => ({ ...f, fim_semana_tipo_preco: "por_pessoa" }))}
                    className="accent-[#FE8330] w-4 h-4 cursor-pointer"
                  />
                  <span>R$ Por pessoa</span>
                </label>
              </div>
            </div>
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

      <div className="pt-4">
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="w-full py-5 min-h-14 bg-[#FE8330] text-white font-black text-base uppercase tracking-wider rounded-2xl hover:bg-[#E06B1B] shadow-lg shadow-[#FE8330]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="w-5 h-5" /> SALVAR CONFIGURAÇÕES</>
          )}
        </button>
      </div>
    </div>
  )
}
