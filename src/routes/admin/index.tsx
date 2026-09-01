import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { 
  getSiteContent, 
  updateSiteContent, 
  getReservasAdmin, 
  upsertReserva, 
  deleteReserva,
  getDepoimentos,
  upsertDepoimento,
  type HeroContent, 
  type InfrastructureItem, 
  type FAQItem 
} from '@/lib/site-content.functions'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Home, Grid, MessageCircle, Upload, Image as ImageIcon, Calendar, Star, Eye, X, Sparkles } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { normalizeGallery, SEASONAL_SECTIONS, type GalleryPhoto } from "@/lib/gallery"
import { MediaManager } from "@/components/admin/MediaManager"
import { SitePreviewModal } from "@/components/admin/SitePreviewModal"



export const Route = createFileRoute('/admin/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'hero'],
        queryFn: () => getSiteContent({ data: 'hero' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'infrastructure'],
        queryFn: () => getSiteContent({ data: 'infrastructure' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'faq'],
        queryFn: () => getSiteContent({ data: 'faq' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'gallery'],
        queryFn: () => getSiteContent({ data: 'gallery' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['depoimentos'],
        queryFn: () => getDepoimentos(),
      })
    ])
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("hero")

  // Queries
  const { data: heroContent } = useSuspenseQuery({
    queryKey: ['site-content', 'hero'],
    queryFn: () => getSiteContent({ data: 'hero' }),
  }) as { data: HeroContent }

  const { data: infrastructureContent } = useSuspenseQuery({
    queryKey: ['site-content', 'infrastructure'],
    queryFn: () => getSiteContent({ data: 'infrastructure' }),
  }) as { data: InfrastructureItem[] }

  const { data: galleryContent } = useSuspenseQuery({
    queryKey: ['site-content', 'gallery'],
    queryFn: () => getSiteContent({ data: 'gallery' }),
  }) as { data: unknown }


  const { data: faqContent } = useSuspenseQuery({
    queryKey: ['site-content', 'faq'],
    queryFn: () => getSiteContent({ data: 'faq' }),
  }) as { data: FAQItem[] }

  const { data: reservas = [] } = useQuery({
    queryKey: ['reservas', 'admin'],
    queryFn: () => getReservasAdmin(),
  }) as { data: any[] }

  const { data: depoimentos } = useSuspenseQuery({
    queryKey: ['depoimentos'],
    queryFn: () => getDepoimentos(),
  }) as { data: any[] }

  // Seasonal galleries
  const seasonalQueries = SEASONAL_SECTIONS.map(s => useQuery({
    queryKey: ['site-content', s.id],
    queryFn: () => getSiteContent({ data: s.id }),
  }))

  // Forms
  const [heroForm, setHeroForm] = useState(heroContent)
  const [infraForm, setInfraForm] = useState(infrastructureContent)
  const [galleryForm, setGalleryForm] = useState<GalleryPhoto[]>(() => normalizeGallery(galleryContent))
  const [faqForm, setFaqForm] = useState(faqContent)
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [seasonTab, setSeasonTab] = useState<string>(SEASONAL_SECTIONS[0].id)
  const [seasonalForms, setSeasonalForms] = useState<Record<string, GalleryPhoto[]>>({})
  const seasonalKey = SEASONAL_SECTIONS.map((s, i) => `${s.id}:${JSON.stringify(seasonalQueries[i]?.data ?? null)}`).join('|')

  useEffect(() => {
    setSeasonalForms(prev => {
      const next = { ...prev }
      SEASONAL_SECTIONS.forEach((s, i) => {
        if (next[s.id] === undefined && seasonalQueries[i]?.data !== undefined) {
          next[s.id] = normalizeGallery(seasonalQueries[i]?.data)
        }
      })
      return next
    })
  }, [seasonalKey])


  // Mutations
  const updateContentMutation = useMutation({
    mutationFn: (data: { section: string; content: any }) => updateSiteContent({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-content', variables.section] })
      toast.success(`Conteúdo de ${variables.section} atualizado!`)
    },
    onError: (error: any) => toast.error('Erro: ' + error.message),
  })

  const resMutation = useMutation({
    mutationFn: (data: any) => upsertReserva({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas', 'admin'] })
      toast.success('Reserva salva!')
    },
  })

  const delResMutation = useMutation({
    mutationFn: (id: string) => deleteReserva({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas', 'admin'] })
      toast.success('Reserva excluída!')
    },
  })

  const depMutation = useMutation({
    mutationFn: (data: any) => upsertDepoimento({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depoimentos'] })
      toast.success('Depoimento salvo!')
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'infra' | 'hero' | 'gallery' | 'testimonial', index?: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tipo e tamanho (ex: max 5MB)
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.')
      return
    }

    const uploadId = index !== undefined ? `${type}-${index}` : type
    setIsUploading(uploadId)
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${type}/${crypto.randomUUID()}.${fileExt}`

      const { data, error } = await supabase.storage.from('images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
      
      if (error) {
        if (error.message.includes('Bucket not found') || error.message.includes('not_found')) {
          throw new Error('O armazenamento de imagens não foi encontrado. Atualize a página e tente novamente.')
        }
        if (error.status === 401 || error.status === 403) {
          throw new Error('Sua sessão não tem permissão para enviar imagens. Entre novamente no painel.')
        }
        throw error
      }

      const imageUrl = `/api/public/image?path=${encodeURIComponent(data.path)}`
      
      if (type === 'infra' && index !== undefined && infraForm && infraForm[index]) {
        const newInfra = [...infraForm];
        const item = newInfra[index];
        if (item) {
          item.image = imageUrl;
          setInfraForm(newInfra);
        }
      } else if (type === 'hero' && heroForm) {
        setHeroForm({ ...heroForm, hero_image: imageUrl });
      } else if (type === 'gallery' && galleryForm) {
        setGalleryForm([...galleryForm, { url: imageUrl, tag: 'ambos' }])
      }

      toast.success('Upload concluído com sucesso!')
    } catch (e: any) { 
      toast.error(`Falha no upload: ${e.message}`) 
    } finally { 
      setIsUploading(null) 
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 md:py-10 px-4 space-y-8 md:space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-black text-[#1E2229]">Painel Administrativo</h1>
        <p className="text-muted-foreground text-base md:text-lg">Gerenciamento completo do Sítio</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-col md:flex-row md:flex-wrap h-auto gap-0 md:gap-2 bg-transparent p-0 mb-6 md:mb-8 border-b md:border-0 border-gray-100">
          {[
            { id: "hero", icon: Home, label: "Hero" },
            { id: "reservas", icon: Calendar, label: "Reservas" },
            { id: "infra", icon: Grid, label: "Estrutura" },
            { id: "gallery", icon: ImageIcon, label: "Galeria" },
            { id: "dep", icon: Star, label: "Depoimentos" },
            { id: "faq", icon: MessageCircle, label: "FAQ" },
          ].map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              activeValue={activeTab} 
              onClick={setActiveTab}
              className="w-full md:flex-1 md:min-w-[120px] min-h-[52px] py-3 px-4 text-sm rounded-none md:rounded-2xl border-0 md:border bg-white/50 md:bg-white data-[state=active]:bg-transparent md:data-[state=active]:bg-[#FE8330] data-[state=active]:text-[#FE8330] md:data-[state=active]:text-white shadow-none md:shadow-sm transition-all border-b border-gray-100 md:border-transparent last:border-b-0"
            >
              <tab.icon className="w-5 h-5 mr-3 md:w-4 md:mr-2 shrink-0" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="hero" activeValue={activeTab}>
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold">Conteúdo Principal</h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Título (Headline)</label>
                <textarea className="w-full p-4 rounded-2xl border focus:ring-2 ring-[#FE8330]/20 min-h-[100px]" value={heroForm?.headline || ""} onChange={e => setHeroForm({...heroForm, headline: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Subtítulo</label>
                <textarea className="w-full p-4 rounded-2xl border focus:ring-2 ring-[#FE8330]/20 min-h-[80px]" value={heroForm?.subheadline || ""} onChange={e => setHeroForm({...heroForm, subheadline: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Número WhatsApp</label>
                  <input className="w-full p-4 rounded-2xl border" value={heroForm?.whatsapp_number || ""} onChange={e => setHeroForm({...heroForm, whatsapp_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Texto do Botão (CTA)</label>
                  <input className="w-full p-4 rounded-2xl border" value={heroForm?.cta_text || ""} onChange={e => setHeroForm({...heroForm, cta_text: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Badges (Separados por vírgula)</label>
                <input className="w-full p-4 rounded-2xl border" value={heroForm?.badges?.join(", ") || ""} onChange={e => setHeroForm({...heroForm, badges: e.target.value.split(",").map(s => s.trim())})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Imagem de Fundo (Hero)</label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                  <input className="w-full sm:flex-1 p-4 rounded-2xl border" value={heroForm?.hero_image || ""} onChange={e => setHeroForm({...heroForm, hero_image: e.target.value})} placeholder="URL da imagem ou faça upload..." />
                  <label className="cursor-pointer bg-[#FE8330]/10 text-[#FE8330] p-4 min-h-12 rounded-2xl hover:bg-[#FE8330]/20 transition-colors flex items-center justify-center gap-2">
                    {isUploading === 'hero' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="font-bold text-sm uppercase">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero')} />
                  </label>
                </div>
                {heroForm?.hero_image && (
                  <div className="mt-4 rounded-2xl overflow-hidden border w-full max-w-md aspect-video bg-gray-50">
                    <img src={heroForm.hero_image} className="w-full h-full object-cover" alt="Preview Hero" />
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => updateContentMutation.mutate({ section: 'hero', content: heroForm })} className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl hover:bg-[#E06B1B] transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> SALVAR HERO
            </button>

          </div>
        </TabsContent>

        <TabsContent value="reservas" activeValue={activeTab}>
          <div className="space-y-6">
            <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Bloquear Agenda / Nova Reserva</h2>
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" onSubmit={e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  data_inicio: (form.elements.namedItem('start') as HTMLInputElement).value,
                  data_fim: (form.elements.namedItem('end') as HTMLInputElement).value,
                  cliente_nome: (form.elements.namedItem('nome') as HTMLInputElement).value,
                  cliente_telefone: (form.elements.namedItem('tel') as HTMLInputElement).value,
                  valor_total: parseFloat((form.elements.namedItem('val') as HTMLInputElement).value || "0"),
                };
                resMutation.mutate(data);
                form.reset();
              }}>
                <input name="start" type="date" className="p-4 rounded-2xl border" required />
                <input name="end" type="date" className="p-4 rounded-2xl border" required />
                <input name="nome" placeholder="Nome do Cliente" className="p-4 rounded-2xl border" required />
                <input name="tel" placeholder="WhatsApp do Cliente" className="p-4 rounded-2xl border" />
                <input name="val" type="number" placeholder="Valor (R$)" className="p-4 rounded-2xl border" />
                <button type="submit" className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-bold rounded-2xl hover:bg-[#E06B1B]">BLOQUEAR DATA</button>
              </form>
            </div>

            <div className="grid gap-4">
              {reservas.map(res => (
                <div key={res.id} className="bg-white p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <p className="font-black text-lg">{res.cliente_nome}</p>
                    <p className="text-sm text-muted-foreground">{new Date(res.data_inicio).toLocaleDateString()} até {new Date(res.data_fim).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <span className="font-bold text-[#FE8330]">R$ {res.valor_total}</span>
                    <button onClick={() => delResMutation.mutate(res.id)} className="p-3 min-h-11 min-w-11 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl" aria-label="Excluir reserva"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="infra" activeValue={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {infraForm?.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4">
                <input className="w-full text-xl font-bold bg-transparent" value={item.title || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].title = e.target.value; setInfraForm(f) }} />
                <textarea className="w-full text-sm text-muted-foreground bg-transparent" value={item.description || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].description = e.target.value; setInfraForm(f) }} />
                <div className="flex gap-2">
                  <input className="flex-1 text-xs p-2 bg-gray-50 rounded-lg" value={item.image || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].image = e.target.value; setInfraForm(f) }} />
                  <label className="cursor-pointer bg-gray-100 p-3 min-h-11 min-w-11 flex items-center justify-center rounded-lg" aria-label="Enviar imagem">
                    <Upload className="w-4 h-4" />
                    <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'infra', idx)} />
                  </label>
                </div>
                <button onClick={() => setInfraForm((infraForm || []).filter((_, i) => i !== idx))} className="text-red-500 text-xs font-bold uppercase tracking-widest py-3 min-h-11">Excluir Card</button>
              </div>
            ))}
            <button onClick={() => setInfraForm([...(infraForm || []), { title: "Novo Item", description: "", image: "" }])} className="border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-gray-300 hover:border-[#FE8330] hover:text-[#FE8330] transition-all">
              <Plus className="w-10 h-10 mb-2" /> <span>ADICIONAR ITEM</span>
            </button>
          </div>
          <button onClick={() => updateContentMutation.mutate({ section: 'infrastructure', content: infraForm })} className="mt-6 md:mt-8 w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl">SALVAR ESTRUTURA</button>

        </TabsContent>

        <TabsContent value="gallery" activeValue={activeTab}>
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6 md:space-y-8">
            <MediaManager
              items={galleryForm}
              onChange={setGalleryForm}
              folder="galeria"
              onUploadingChange={setMediaUploading}
            />
            <button
              disabled={mediaUploading}
              onClick={() => updateContentMutation.mutate({ section: 'gallery', content: galleryForm })}
              className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl disabled:opacity-50"
            >
              {mediaUploading ? 'ENVIANDO ARQUIVOS...' : 'SALVAR GALERIA'}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="sazonais" activeValue={activeTab}>
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Eventos Sazonais</h2>
              <p className="text-sm text-muted-foreground">Fotos e vídeos exclusivos de cada tema. Aparecem em destaque quando o tema está ativo no site.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {SEASONAL_SECTIONS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeasonTab(s.id)}
                  className={`flex-1 min-h-[52px] rounded-xl font-bold border transition-all ${seasonTab === s.id ? 'bg-[#FE8330] text-white border-[#FE8330]' : 'bg-white text-gray-600'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <MediaManager
              items={seasonalForms[seasonTab] || []}
              onChange={(items) => setSeasonalForms(prev => ({ ...prev, [seasonTab]: items }))}
              folder={seasonTab}
              showTags={false}
              onUploadingChange={setMediaUploading}
            />

            <button
              disabled={mediaUploading}
              onClick={() => updateContentMutation.mutate({ section: seasonTab, content: seasonalForms[seasonTab] || [] })}
              className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl disabled:opacity-50"
            >
              {mediaUploading ? 'ENVIANDO ARQUIVOS...' : 'SALVAR MÍDIAS DO EVENTO'}
            </button>
          </div>
        </TabsContent>


        <TabsContent value="dep" activeValue={activeTab}>
          <div className="space-y-6">
            <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Novo Depoimento</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" onSubmit={e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const nomeInput = form.elements.namedItem('nome') as HTMLInputElement;
                const eventoInput = form.elements.namedItem('evento') as HTMLInputElement;
                const txtInput = form.elements.namedItem('txt') as HTMLTextAreaElement;
                if (!nomeInput || !txtInput) return;
                const data = {
                  nome: nomeInput.value,
                  evento: eventoInput?.value || "",
                  depoimento: txtInput.value,
                  estrelas: 5,
                };
                depMutation.mutate(data);
                form.reset();
              }}>
                <input name="nome" placeholder="Nome do Cliente" className="p-4 rounded-2xl border" required />
                <input name="evento" placeholder="Tipo de Evento" className="p-4 rounded-2xl border" />
                <textarea name="txt" placeholder="Depoimento..." className="md:col-span-2 p-4 rounded-2xl border min-h-[100px]" required />
                <button type="submit" className="md:col-span-2 py-4 bg-[#FE8330] text-white font-black rounded-2xl">ADICIONAR DEPOIMENTO</button>
              </form>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {depoimentos.map(dep => (
                <div key={dep.id} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-lg">{dep.nome}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{dep.evento}</p>
                    </div>
                    <div className="flex text-[#FE8330]">
                      {Array.from({length: dep.estrelas}).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-sm italic text-gray-600">"{dep.depoimento}"</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" activeValue={activeTab}>
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
            {faqForm?.map((item, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-3xl space-y-3 relative">
                <input className="w-full font-bold bg-transparent pr-10" value={item.question || ""} onChange={e => { const f = [...(faqForm || [])]; if(f[idx]) f[idx].question = e.target.value; setFaqForm(f) }} />
                <textarea className="w-full text-sm text-muted-foreground bg-transparent" value={item.answer || ""} onChange={e => { const f = [...(faqForm || [])]; if(f[idx]) f[idx].answer = e.target.value; setFaqForm(f) }} />


                <button onClick={() => setFaqForm(faqForm.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-2 min-h-11 min-w-11 flex items-center justify-center text-red-400" aria-label="Excluir pergunta"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setFaqForm([...(faqForm || []), { question: "Nova Pergunta", answer: "" }])} className="w-full py-4 border-2 border-dashed rounded-3xl text-gray-400 font-bold hover:border-[#FE8330] hover:text-[#FE8330] transition-all">+ ADICIONAR PERGUNTA</button>
            <button onClick={() => updateContentMutation.mutate({ section: 'faq', content: faqForm })} className="w-full py-4 min-h-12 bg-[#FE8330] text-white font-black rounded-2xl">SALVAR FAQ</button>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}

