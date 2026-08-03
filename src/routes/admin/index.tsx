import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getSiteContent, updateSiteContent, type HeroContent, type InfrastructureItem, type FAQItem } from '@/lib/site-content.functions'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Home, Grid, MessageCircle } from 'lucide-react'
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
      })
    ])
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("hero")

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
                  <input 
                    className="w-full px-4 py-2 rounded-lg border text-xs" 
                    value={item.image || ""} 
                    onChange={e => {
                      const newInfra = [...infraForm];
                      newInfra[idx] = { title: item.title, description: item.description, image: e.target.value };
                      setInfraForm(newInfra);
                    }}
                  />
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
