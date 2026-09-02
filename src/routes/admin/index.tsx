import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { 
  getSiteContent, 
  updateSiteContent, 
  type HeroContent, 
  type InfrastructureItem, 
  type FAQItem 
} from '@/lib/site-content.functions'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Home, Grid, MessageCircle, Upload, Image as ImageIcon, Calendar, Star, Eye, Sparkles, Phone, Settings, FileText } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { normalizeGallery, SEASONAL_SECTIONS, type GalleryPhoto } from "@/lib/gallery"
import { MediaManager } from "@/components/admin/MediaManager"
import { SitePreviewModal } from "@/components/admin/SitePreviewModal"

// Novas abas
import { DisponibilidadeCalendar } from '@/components/admin/DisponibilidadeCalendar'
import { ReservasManager } from '@/components/admin/ReservasManager'
import { DepoimentosManager } from '@/components/admin/DepoimentosManager'
import { RegrasPoliticasManager } from '@/components/admin/RegrasPoliticasManager'
import { LeadsManager } from '@/components/admin/LeadsManager'
import { ConfigSiteManager } from '@/components/admin/ConfigSiteManager'
import { EventosSazonaisManager } from '@/components/admin/EventosSazonaisManager'

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'infra' | 'hero' | 'gallery' | 'testimonial', index?: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tipo e tamanho
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
        setGalleryForm([...galleryForm, { url: imageUrl, tag: 'ambos', tipo: 'foto' }])
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
        <button type="button" onClick={() => setShowPreview(true)} className="mt-2 inline-flex items-center gap-2 min-h-12 px-5 rounded-2xl bg-[#1E2229] text-white font-bold">
          <Eye className="w-5 h-5" /> Pré-visualizar Site
        </button>
      </header>

      {showPreview && <SitePreviewModal onClose={() => setShowPreview(false)} />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full mb-8">
          <div className="flex flex-row overflow-x-auto scroll-smooth no-scrollbar gap-2 pb-2 md:pb-0 md:grid md:grid-cols-6 md:gap-2.5">
            {[
              { id: "hero", icon: Home, label: "Hero" },
              { id: "disponibilidade", icon: Calendar, label: "Disponibilidade" },
              { id: "reservas", icon: Calendar, label: "Reservas" },
              { id: "infra", icon: Grid, label: "Estrutura" },
              { id: "gallery", icon: ImageIcon, label: "Galeria" },
              { id: "sazonais", icon: Sparkles, label: "Sazonais" },
              { id: "dep", icon: Star, label: "Depoimentos" },
              { id: "faq", icon: MessageCircle, label: "FAQ" },
              { id: "regras", icon: FileText, label: "Regras" },
              { id: "leads", icon: Phone, label: "Leads" },
              { id: "config", icon: Settings, label: "Configurações" },
            ].map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{ padding: "12px 16px", borderRadius: "20px" }}
                  className={`flex items-center justify-center gap-2 text-sm font-bold whitespace-nowrap shrink-0 transition-all focus:outline-none select-none cursor-pointer ${
                    isActive
                      ? "bg-[#FE8330] text-white shadow-md shadow-[#FE8330]/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

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

        <TabsContent value="disponibilidade" activeValue={activeTab}>
          <DisponibilidadeCalendar />
        </TabsContent>

        <TabsContent value="reservas" activeValue={activeTab}>
          <ReservasManager />
        </TabsContent>

        <TabsContent value="infra" activeValue={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {infraForm?.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4">
                <input className="w-full text-xl font-bold bg-transparent" value={item.title || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].title = e.target.value; setInfraForm(f) }} />
                <textarea className="w-full text-sm text-muted-foreground bg-transparent" value={item.description || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].description = e.target.value; setInfraForm(f) }} />
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Fotos do card (passam em loop no site)</span>
                  <MediaManager
                    items={(item.images && item.images.length ? item.images : [item.image].filter(Boolean)).map(u => ({ url: u, tag: "ambos" as const, tipo: "foto" as const }))}
                    onChange={(list) => {
                      const urls = list.map(m => m.url)
                      const f = [...(infraForm || [])]
                      if (f[idx]) f[idx] = { ...f[idx]!, images: urls, image: urls[0] || "" }
                      setInfraForm(f)
                    }}
                    folder="estrutura"
                    showTags={false}
                    onUploadingChange={setMediaUploading}
                  />
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
              showAmbiente={true}
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
          <EventosSazonaisManager />
        </TabsContent>

        <TabsContent value="dep" activeValue={activeTab}>
          <DepoimentosManager />
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

        <TabsContent value="regras" activeValue={activeTab}>
          <RegrasPoliticasManager />
        </TabsContent>

        <TabsContent value="leads" activeValue={activeTab}>
          <LeadsManager />
        </TabsContent>

        <TabsContent value="config" activeValue={activeTab}>
          <ConfigSiteManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
