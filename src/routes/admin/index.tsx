import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { 
  getSiteContent, 
  updateSiteContent, 
  getReservas, 
  upsertReserva, 
  deleteReserva,
  getDepoimentos,
  upsertDepoimento,
  type HeroContent, 
  type InfrastructureItem, 
  type FAQItem 
} from '@/lib/site-content.functions'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Home, Grid, MessageCircle, Upload, Image as ImageIcon, Calendar, Star } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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
        queryKey: ['reservas'],
        queryFn: () => getReservas(),
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
  }) as { data: HeroContent & { badges?: string[] } }

  const { data: infrastructureContent } = useSuspenseQuery({
    queryKey: ['site-content', 'infrastructure'],
    queryFn: () => getSiteContent({ data: 'infrastructure' }),
  }) as { data: InfrastructureItem[] }

  const { data: galleryContent } = useSuspenseQuery({
    queryKey: ['site-content', 'gallery'],
    queryFn: () => getSiteContent({ data: 'gallery' }),
  }) as { data: string[] }

  const { data: faqContent } = useSuspenseQuery({
    queryKey: ['site-content', 'faq'],
    queryFn: () => getSiteContent({ data: 'faq' }),
  }) as { data: FAQItem[] }

  const { data: reservas } = useSuspenseQuery({
    queryKey: ['reservas'],
    queryFn: () => getReservas(),
  }) as { data: any[] }

  const { data: depoimentos } = useSuspenseQuery({
    queryKey: ['depoimentos'],
    queryFn: () => getDepoimentos(),
  }) as { data: any[] }

  // Forms
  const [heroForm, setHeroForm] = useState(heroContent)
  const [infraForm, setInfraForm] = useState(infrastructureContent)
  const [galleryForm, setGalleryForm] = useState(Array.isArray(galleryContent) ? galleryContent : [])
  const [faqForm, setFaqForm] = useState(faqContent)
  const [isUploading, setIsUploading] = useState<string | null>(null)

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
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
      toast.success('Reserva salva!')
    },
  })

  const delResMutation = useMutation({
    mutationFn: (id: string) => deleteReserva({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
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
    const uploadId = index !== undefined ? `${type}-${index}` : type
    setIsUploading(uploadId)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const { data, error } = await supabase.storage.from('images').upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(data.path)
      
      if (type === 'infra' && index !== undefined && infraForm?.[index]) {
        const newInfra = [...infraForm]; newInfra[index].image = publicUrl; setInfraForm(newInfra)
      } else if (type === 'gallery' && galleryForm) {

        setGalleryForm([...galleryForm, publicUrl])
      }

      toast.success('Upload concluído!')
    } catch (e: any) { toast.error(e.message) } finally { setIsUploading(null) }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-[#1E2229]">Painel Administrativo</h1>
        <p className="text-muted-foreground text-lg">Gerenciamento completo do Sítio</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8">
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
              className="flex-1 min-w-[120px] py-4 rounded-2xl border bg-white data-[state=active]:bg-[#FE8330] data-[state=active]:text-white shadow-sm transition-all"
            >
              <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="hero" activeValue={activeTab}>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
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
              <div className="grid md:grid-cols-2 gap-6">
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
            </div>
            <button onClick={() => updateContentMutation.mutate({ section: 'hero', content: heroForm })} className="w-full py-4 bg-[#FE8330] text-white font-black rounded-2xl hover:bg-[#E06B1B] transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> SALVAR HERO
            </button>

          </div>
        </TabsContent>

        <TabsContent value="reservas" activeValue={activeTab}>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Bloquear Agenda / Nova Reserva</h2>
              <form className="grid md:grid-cols-3 gap-6" onSubmit={e => {
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
                <button type="submit" className="bg-[#FE8330] text-white font-bold rounded-2xl hover:bg-[#E06B1B]">BLOQUEAR DATA</button>
              </form>
            </div>

            <div className="grid gap-4">
              {reservas.map(res => (
                <div key={res.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="font-black text-lg">{res.cliente_nome}</p>
                    <p className="text-sm text-muted-foreground">{new Date(res.data_inicio).toLocaleDateString()} até {new Date(res.data_fim).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#FE8330]">R$ {res.valor_total}</span>
                    <button onClick={() => delResMutation.mutate(res.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="infra" activeValue={activeTab}>
          <div className="grid md:grid-cols-2 gap-6">
            {infraForm?.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4">
                <input className="w-full text-xl font-bold bg-transparent" value={item.title || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].title = e.target.value; setInfraForm(f) }} />
                <textarea className="w-full text-sm text-muted-foreground bg-transparent" value={item.description || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].description = e.target.value; setInfraForm(f) }} />
                <div className="flex gap-2">
                  <input className="flex-1 text-xs p-2 bg-gray-50 rounded-lg" value={item.image || ""} onChange={e => { const f = [...(infraForm || [])]; if (f[idx]) f[idx].image = e.target.value; setInfraForm(f) }} />
                  <label className="cursor-pointer bg-gray-100 p-2 rounded-lg">
                    <Upload className="w-4 h-4" />
                    <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'infra', idx)} />
                  </label>
                </div>
                <button onClick={() => setInfraForm((infraForm || []).filter((_, i) => i !== idx))} className="text-red-500 text-xs font-bold uppercase tracking-widest">Excluir Card</button>
              </div>
            ))}
            <button onClick={() => setInfraForm([...(infraForm || []), { title: "Novo Item", description: "", image: "" }])} className="border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-gray-300 hover:border-[#FE8330] hover:text-[#FE8330] transition-all">
              <Plus className="w-10 h-10 mb-2" /> <span>ADICIONAR ITEM</span>
            </button>
          </div>
          <button onClick={() => updateContentMutation.mutate({ section: 'infrastructure', content: infraForm })} className="mt-8 w-full py-4 bg-[#FE8330] text-white font-black rounded-2xl">SALVAR ESTRUTURA</button>

        </TabsContent>

        <TabsContent value="gallery" activeValue={activeTab}>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {galleryForm.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                  <img src={src} className="w-full h-full object-cover" />
                  <button onClick={() => setGalleryForm(galleryForm.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FE8330] transition-all">
                <Plus className="w-8 h-8 text-gray-300" />
                <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'gallery')} />
              </label>
            </div>
            <button onClick={() => updateContentMutation.mutate({ section: 'gallery', content: galleryForm })} className="w-full py-4 bg-[#FE8330] text-white font-black rounded-2xl">SALVAR GALERIA</button>
          </div>
        </TabsContent>

        <TabsContent value="dep" activeValue={activeTab}>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Novo Depoimento</h2>
              <form className="grid md:grid-cols-2 gap-6" onSubmit={e => {
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


            <div className="grid md:grid-cols-2 gap-6">
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
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
            {faqForm?.map((item, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-3xl space-y-3 relative">
                <input className="w-full font-bold bg-transparent pr-10" value={item.question || ""} onChange={e => { const f = [...(faqForm || [])]; if(f[idx]) f[idx].question = e.target.value; setFaqForm(f) }} />
                <textarea className="w-full text-sm text-muted-foreground bg-transparent" value={item.answer || ""} onChange={e => { const f = [...(faqForm || [])]; if(f[idx]) f[idx].answer = e.target.value; setFaqForm(f) }} />


                <button onClick={() => setFaqForm(faqForm.filter((_, i) => i !== idx))} className="absolute top-6 right-6 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setFaqForm([...(faqForm || []), { question: "Nova Pergunta", answer: "" }])} className="w-full py-4 border-2 border-dashed rounded-3xl text-gray-400 font-bold hover:border-[#FE8330] hover:text-[#FE8330] transition-all">+ ADICIONAR PERGUNTA</button>
            <button onClick={() => updateContentMutation.mutate({ section: 'faq', content: faqForm })} className="w-full py-4 bg-[#FE8330] text-white font-black rounded-2xl">SALVAR FAQ</button>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}

