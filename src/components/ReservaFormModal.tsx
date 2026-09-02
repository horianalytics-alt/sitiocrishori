import { useState } from 'react'
import { X, Send, Calendar, Users, MessageSquare } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { criarReservaPublica } from '@/lib/site-content.functions'

type FormModalProps = {
  onClose: () => void
  initialData: {
    tipo_evento: 'festa' | 'final_de_semana'
    num_convidados: number
    data_evento: Date | null
  }
  adminPhone: string
}

export function ReservaFormModal({ onClose, initialData, adminPhone }: FormModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Use uncontrolled form logic for simplicity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const form = e.target as HTMLFormElement
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value
    const whatsapp = (form.elements.namedItem('whatsapp') as HTMLInputElement).value
    const dataStr = (form.elements.namedItem('data') as HTMLInputElement).value
    const mensagem = (form.elements.namedItem('mensagem') as HTMLTextAreaElement).value

    try {
      const data = await criarReservaPublica({
        data: {
          cliente_nome: nome,
          whatsapp,
          data_evento: dataStr,
          num_convidados: initialData.num_convidados,
          tipo_evento: initialData.tipo_evento,
          mensagem
        }
      })

      // Redireciona para o WhatsApp do Admin com a mensagem montada
      const urlBase = window.location.origin
      const linkUnico = `${urlBase}/reserva/${data.link_unico}`
      
      const tipo = initialData.tipo_evento === 'festa' ? 'Festa (1 Dia)' : 'Final de Semana'
      const dataFormatada = dataStr.split('-').reverse().join('/')
      
      const zapMsg = `Olá! Meu nome é *${nome}* e acabei de solicitar uma pré-reserva no site.\n\n📅 Data: *${dataFormatada}*\n👥 Convidados: *${initialData.num_convidados}*\n🎈 Tipo: *${tipo}*\n${mensagem ? `\n💬 Observação: ${mensagem}\n` : ''}\n🔗 Meu link de acompanhamento:\n${linkUnico}`
      
      const cleanPhone = adminPhone.replace(/\D/g, "")
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(zapMsg)}`, '_blank')
      
      toast.success('Solicitação enviada com sucesso!')
      onClose()
    } catch (err) {
      toast.error('Erro ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] p-6 md:p-10 shadow-2xl my-8">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 pr-12">
          <h2 className="text-3xl font-black text-[#1E2229]">Quase lá!</h2>
          <p className="text-gray-500 mt-2">Preencha seus dados para enviar o pedido direto no nosso WhatsApp.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-4">Seu Nome</label>
            <input name="nome" required className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 ring-[#FE8330]/30" placeholder="Como podemos te chamar?" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-4">Seu WhatsApp</label>
            <input name="whatsapp" type="tel" required className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 ring-[#FE8330]/30" placeholder="(11) 99999-9999" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-4">Data Desejada</label>
              <div className="relative">
                <input 
                  name="data" 
                  type="date" 
                  required 
                  defaultValue={initialData.data_evento ? initialData.data_evento.toISOString().split('T')[0] : ''} 
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 ring-[#FE8330]/30 appearance-none" 
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-4">Convidados</label>
              <div className="relative">
                <input readOnly value={`${initialData.num_convidados} pessoas`} className="w-full px-5 py-4 bg-gray-100 text-gray-500 rounded-2xl font-medium" />
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-4">Mensagem (Opcional)</label>
            <div className="relative">
              <textarea name="mensagem" rows={3} className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 ring-[#FE8330]/30 resize-none" placeholder="Tem alguma dúvida ou pedido especial?" />
              <MessageSquare className="absolute right-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 mt-4 rounded-2xl bg-[#FE8330] text-white font-black hover:bg-[#E06B1B] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'PROCESSANDO...' : (
              <>ENVIAR PARA O WHATSAPP <Send className="w-5 h-5" /></>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Você será redirecionado para o WhatsApp com os dados preenchidos.
          </p>
        </form>
      </div>
    </div>
  )
}
