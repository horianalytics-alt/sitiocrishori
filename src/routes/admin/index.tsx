import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getSiteContent, updateSiteContent, type HeroContent } from '@/lib/site-content.functions'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['site-content', 'hero'],
      queryFn: () => getSiteContent({ data: 'hero' }),
    })
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const { data: heroContent } = useSuspenseQuery({
    queryKey: ['site-content', 'hero'],
    queryFn: () => getSiteContent({ data: 'hero' }),
  }) as { data: HeroContent }

  const [formData, setFormData] = useState<HeroContent>(heroContent)

  const mutation = useMutation({
    mutationFn: (newContent: HeroContent) => updateSiteContent({ data: { section: 'hero', content: newContent } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content', 'hero'] })
      toast.success('Conteúdo atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (!formData) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1E2229]">Dashboard Admin</h2>
        <p className="text-sm text-muted-foreground">Gerencie o conteúdo da sua landing page</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FE8330]" />
            Seção Hero (Principal)
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Título Principal (Headline)</label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE8330]/20 focus:border-[#FE8330] transition-all min-h-[100px]"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subtítulo (Subheadline)</label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE8330]/20 focus:border-[#FE8330] transition-all min-h-[80px]"
                value={formData.subheadline}
                onChange={e => setFormData({ ...formData, subheadline: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Texto do Botão (CTA)</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE8330]/20 focus:border-[#FE8330] transition-all"
                  value={formData.cta_text}
                  onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">WhatsApp (apenas números)</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE8330]/20 focus:border-[#FE8330] transition-all"
                  value={formData.whatsapp_number}
                  onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 bg-[#FE8330] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#E06B1B] transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 opacity-60">
          <h3 className="font-semibold text-lg mb-2">Infraestrutura & FAQ</h3>
          <p className="text-muted-foreground text-sm mb-4">Edição de cards e perguntas frequentes em breve.</p>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#FE8330] w-1/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
