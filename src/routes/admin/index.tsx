import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { getSiteContent, updateSiteContent, type HeroContent, type InfrastructureItem, type FAQItem } from '@/lib/site-content.functions'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Home, Grid, MessageCircle, Upload, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Accordion, AccordionItem } from "@/components/ui/accordion"

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
      })
    ])
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("hero")
  const [galleryForm, setGalleryForm] = useState<string[]>([])

  useEffect(() => {
    getSiteContent({ data: 'gallery' }).then(data => {
      if (Array.isArray(data)) setGalleryForm(data)
    }).catch(() => setGalleryForm([]))
  }, [])

  const { data: heroContent } = useSuspenseQuery({
    queryKey: ['site-content', 'hero'],
    queryFn: () => getSiteContent({ data: 'hero' }),
  }) as { data: HeroContent }

  const { data: infrastructureContent } = useSuspenseQuery({
    queryKey: ['site-content', 'infrastructure'],
    queryFn: () => getSiteContent({ data: 'infrastructure' }),
  }) as { data: InfrastructureItem[] }

  const { data: faqContent } = useSuspenseQuery({
    queryKey: ['site-content', 'faq'],
    queryFn: () => getSiteContent({ data: 'faq' }),
  }) as { data: FAQItem[] }

  const [heroForm, setHeroForm] = useState<HeroContent & { badges?: string[] }>(heroContent)
  const [infraForm, setInfraForm] = useState<InfrastructureItem[]>(infrastructureContent)
  const [faqForm, setFaqForm] = useState<FAQItem[]>(faqContent)

  const [isUploading, setIsUploading] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: { section: string; content: any }) => updateSiteContent({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-content', variables.section] })
      toast.success(`Conteúdo de ${variables.section} atualizado!`)
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message)
    },
  })

  const saveHero = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ section: 'hero', content: heroForm })
  }

  const saveInfra = () => {
    mutation.mutate({ section: 'infrastructure', content: infraForm })
  }

  const saveFAQ = () => {
    mutation.mutate({ section: 'faq', content: faqForm })
  }

  const saveGallery = () => {
    mutation.mutate({ section: 'gallery', content: galleryForm })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'infra' | 'hero' | 'gallery', index?: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadId = index !== undefined ? `${type}-${index}` : type
    setIsUploading(uploadId)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      if (type === 'infra' && index !== undefined) {
        const newInfra = [...infraForm]
        const currentItem = newInfra[index]
        newInfra[index] = { 
          title: currentItem?.title || '', 
          description: currentItem?.description || '', 
          image: publicUrl 
        }
        setInfraForm(newInfra)
      } else if (type === 'gallery') {
        setGalleryForm([...galleryForm, publicUrl])
      }
      
      toast.success('Imagem enviada com sucesso!')
    } catch (error: any) {
      console.error('Error uploading:', error)
      toast.error('Erro ao enviar imagem: ' + error.message)
    } finally {
      setIsUploading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1E2229]">Painel de Edição Profunda</h2>
          <p className="text-muted-foreground">Gerencie cada detalhe da sua Landing Page</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 bg-white p-1 rounded-2xl shadow-sm border h-auto">
          <TabsTrigger value="hero" activeValue={activeTab} onClick={setActiveTab} className="py-3 rounded-xl data-[state=active]:bg-[#FE8330] data-[state=active]:text-white">
            <Home className="w-4 h-4 mr-2" /> Hero
          </TabsTrigger>
          <TabsTrigger value="infra" activeValue={activeTab} onClick={setActiveTab} className="py-3 rounded-xl data-[state=active]:bg-[#FE8330] data-[state=active]:text-white">
            <Grid className="w-4 h-4 mr-2" /> Infraestrutura
          </TabsTrigger>
          <TabsTrigger value="gallery" activeValue={activeTab} onClick={setActiveTab} className="py-3 rounded-xl data-[state=active]:bg-[#FE8330] data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" /> Galeria
          </TabsTrigger>
          <TabsTrigger value="faq" activeValue={activeTab} onClick={setActiveTab} className="py-3 rounded-xl data-[state=active]:bg-[#FE8330] data-[state=active]:text-white">
            <MessageCircle className="w-4 h-4 mr-2" /> FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" activeValue={activeTab}>
          <form onSubmit={saveHero} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Headline</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 min-h-[100px]"
                  value={heroForm.headline}
                  onChange={e => setHeroForm({ ...heroForm, headline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Subheadline</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 min-h-[80px]"
                  value={heroForm.subheadline}
                  onChange={e => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Texto do Botão</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200"
                    value={heroForm.cta_text}
                    onChange={e => setHeroForm({ ...heroForm, cta_text: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">WhatsApp</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200"
                    value={heroForm.whatsapp_number}
                    onChange={e => setHeroForm({ ...heroForm, whatsapp_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Badges (Separados por vírgula)</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  value={heroForm.badges?.join(', ') || ""}
                  onChange={e => setHeroForm({ ...heroForm, badges: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Piscina Aquecida, Campo de Futebol..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button disabled={mutation.isPending} className="flex items-center gap-2 bg-[#FE8330] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#E06B1B] transition-all">
                {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Salvar Hero
              </button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="infra" activeValue={activeTab}>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {infraForm.map((item, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#FE8330] uppercase">Card #{idx + 1}</span>
                    <button onClick={() => setInfraForm(infraForm.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <input 
                    className="w-full px-4 py-2 rounded-lg border text-lg font-bold" 
                    value={item.title || ""} 
                    onChange={e => {
                      const newInfra = [...infraForm];
                      newInfra[idx] = { title: e.target.value, description: item.description, image: item.image };
                      setInfraForm(newInfra);
                    }}
                  />
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border text-sm text-muted-foreground" 
                    value={item.description || ""} 
                    onChange={e => {
                      const newInfra = [...infraForm];
                      newInfra[idx] = { title: item.title, description: e.target.value, image: item.image };
                      setInfraForm(newInfra);
                    }}
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500">URL da Imagem</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 px-4 py-2 rounded-lg border text-xs" 
                        value={item.image || ""} 
                        onChange={e => {
                          const newInfra = [...infraForm];
                          newInfra[idx] = { 
                            title: item.title || '', 
                            description: item.description || '', 
                            image: e.target.value 
                          };
                          setInfraForm(newInfra);
                        }}
                        placeholder="https://..."
                      />
                      <label className="cursor-pointer flex items-center justify-center bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                        {isUploading === `infra-${idx}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'infra', idx)}
                          disabled={!!isUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button 
                onClick={() => setInfraForm([...infraForm, { title: "Novo Espaço", description: "Descrição...", image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800" } as InfrastructureItem])}
                className="flex items-center gap-2 bg-white border-2 border-dashed border-gray-200 px-6 py-3 rounded-xl hover:border-[#FE8330] hover:text-[#FE8330] transition-all"
              >
                <Plus className="w-5 h-5" /> Adicionar Card
              </button>
              <button onClick={saveInfra} disabled={mutation.isPending} className="flex items-center gap-2 bg-[#FE8330] text-white px-8 py-3 rounded-xl font-bold">
                <Save className="w-5 h-5" /> Salvar Tudo
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" activeValue={activeTab}>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryForm.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border">
                  <img src={src} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setGalleryForm(galleryForm.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FE8330] cursor-pointer transition-all">
                {isUploading === 'gallery' ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#FE8330]" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-gray-300" />
                    <span className="text-xs font-bold text-gray-400 mt-2">Upload</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'gallery')}
                  disabled={!!isUploading}
                />
              </label>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={saveGallery} disabled={mutation.isPending} className="bg-[#FE8330] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                <Save className="w-5 h-5" /> Salvar Galeria
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" activeValue={activeTab}>
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              {faqForm.map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-gray-50 space-y-4 border border-gray-100">
                  <div className="flex justify-between">
                    <input 
                      className="w-full bg-transparent font-bold text-lg focus:outline-none" 
                      value={item.question || ""} 
                      onChange={e => {
                        const newFaq = [...faqForm];
                        newFaq[idx] = { question: e.target.value, answer: item.answer };
                        setFaqForm(newFaq);
                      }}
                    />
                    <button onClick={() => setFaqForm(faqForm.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <textarea 
                    className="w-full bg-transparent text-muted-foreground focus:outline-none" 
                    value={item.answer || ""} 
                    onChange={e => {
                      const newFaq = [...faqForm];
                      newFaq[idx] = { question: item.question, answer: e.target.value };
                      setFaqForm(newFaq);
                    }}
                  />
                </div>
              ))}
              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => setFaqForm([...faqForm, { question: "Nova Pergunta?", answer: "Sua resposta aqui..." } as FAQItem])}
                  className="text-[#FE8330] font-bold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Adicionar Pergunta
                </button>
                <button onClick={saveFAQ} disabled={mutation.isPending} className="bg-[#FE8330] text-white px-8 py-3 rounded-xl font-bold">
                  Salvar FAQ
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
