import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Save, Loader2, Upload, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
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
  mapa_cidade: string
  mapa_distancia: string
  mapa_tempo: string
  mapa_link_direto: string
  foto_fallback: string
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
  mapa_cidade: "Ibiúna, SP",
  mapa_distancia: "65 km de São Paulo",
  mapa_tempo: "50 min de viagem",
  mapa_link_direto: "",
  foto_fallback: "",
}

export function ConfigSiteManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ConfigForm>(EMPTY_FORM)
  const [isUploadingFallback, setIsUploadingFallback] = useState(false)

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
        mapa_cidade: (config as any).mapa_cidade ?? "Ibiúna, SP",
        mapa_distancia: (config as any).mapa_distancia ?? "65 km de São Paulo",
        mapa_tempo: (config as any).mapa_tempo ?? "50 min de viagem",
        mapa_link_direto: (config as any).mapa_link_direto ?? "",
        foto_fallback: (config as any).foto_fallback ?? "",
      })
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: (data: ConfigForm) => updateConfigSite({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config_site"] })
      toast.success("✅ Salvo com sucesso!")
    },
    onError: () => toast.error("❌ Erro ao salvar, tente novamente"),
  })

  const handleFallbackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB.")
      return
    }

    setIsUploadingFallback(true)
    try {
      const url = import.meta.env['VITE_SUPABASE_URL']
      const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error("Sessão expirada. Entre novamente no painel.")

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const path = `fallback/${crypto.randomUUID()}.${ext}`

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", `${url}/storage/v1/object/midia-sitio/${path}`)
        xhr.setRequestHeader("authorization", `Bearer ${token}`)
        xhr.setRequestHeader("apikey", key)
        xhr.setRequestHeader("x-upsert", "false")
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Falha no upload")))
        xhr.onerror = () => reject(new Error("Falha de rede"))
        const formData = new FormData()
        formData.append("file", file)
        xhr.send(formData)
      })

      const publicUrl = `/api/public/media?path=${encodeURIComponent(path)}`
      setForm(f => ({ ...f, foto_fallback: publicUrl }))
      toast.success("✅ Foto de reserva enviada com sucesso!")
    } catch (err: any) {
      toast.error("❌ Erro ao enviar foto de reserva: " + err.message)
    } finally {
      setIsUploadingFallback(false)
    }
  }

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

        {/* Seção Como Chegar / Google Maps */}
        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200/80 space-y-5">
          <div>
            <h3 className="text-lg font-black text-[#1E2229] flex items-center gap-2">
              📍 Localização & Como Chegar (Google Maps)
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Configure o mapa interativo exibido na homepage e as informações de viagem para os visitantes.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">
              Link do Google Maps (embed) *
            </label>
            <p className="text-xs text-gray-500 font-medium">
              💡 Abra o Google Maps, encontre o local, clique em Compartilhar → Incorporar um mapa, e cole o link aqui
            </p>
            <input
              className="w-full min-h-[52px] px-4 py-3 rounded-2xl border bg-white text-base focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-medium"
              placeholder="Ex: https://www.google.com/maps/embed?pb=... ou cole a tag <iframe>"
              value={form.mapa_embed_url}
              onChange={e => {
                const raw = e.target.value
                const match = raw.match(/src=["']([^"']+)["']/)
                setForm(f => ({ ...f, mapa_embed_url: match && match[1] ? match[1] : raw.trim() }))
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">
              Link direto do Google Maps (para abrir no app/celular)
            </label>
            <input
              className="w-full min-h-[52px] px-4 py-3 rounded-2xl border bg-white text-base focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-medium"
              placeholder="Ex: https://maps.app.goo.gl/... ou https://maps.google.com/?q=..."
              value={form.mapa_link_direto}
              onChange={e => setForm(f => ({ ...f, mapa_link_direto: e.target.value.trim() }))}
            />
          </div>

          {/* Três informações em linha configuráveis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                📍 Cidade
              </label>
              <input
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border bg-white text-sm font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                placeholder="Ex: Ibiúna, SP"
                value={form.mapa_cidade}
                onChange={e => setForm(f => ({ ...f, mapa_cidade: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                🚗 Distância de São Paulo
              </label>
              <input
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border bg-white text-sm font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                placeholder="Ex: 65 km de São Paulo"
                value={form.mapa_distancia}
                onChange={e => setForm(f => ({ ...f, mapa_distancia: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                ⏱️ Tempo médio
              </label>
              <input
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border bg-white text-sm font-bold focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                placeholder="Ex: 50 min de viagem"
                value={form.mapa_tempo}
                onChange={e => setForm(f => ({ ...f, mapa_tempo: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Foto de Reserva (Fallback) */}
        <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-200/80 space-y-3">
          <div>
            <label className="text-base font-black text-[#1E2229] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#FE8330]" />
              Foto de Reserva (fallback)
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Esta foto será exibida no site caso qualquer imagem da galeria falhe ao carregar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="URL da imagem ou envie pelo botão ao lado..."
              value={form.foto_fallback}
              onChange={e => setForm(f => ({ ...f, foto_fallback: e.target.value }))}
              className="flex-1 min-h-[52px] px-4 py-3 rounded-2xl border bg-white text-base focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-medium"
            />
            <label className="min-h-[52px] px-6 rounded-2xl bg-[#FE8330] hover:bg-[#E06B1B] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FE8330]/20 transition-all shrink-0">
              {isUploadingFallback ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="w-4 h-4" /> Escolher Foto</>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleFallbackUpload} />
            </label>
          </div>

          {form.foto_fallback && (
            <div className="mt-3 rounded-2xl overflow-hidden border w-full max-w-xs aspect-video bg-gray-50 relative">
              <img src={form.foto_fallback} className="w-full h-full object-cover" alt="" />
            </div>
          )}
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
