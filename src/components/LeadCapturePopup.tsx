import { useState, useEffect } from 'react'
import { X, Send, PartyPopper } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function LeadCapturePopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already shown in this session
    if (sessionStorage.getItem('lead_captured') === 'true') {
      return
    }

    let timeoutId: NodeJS.Timeout

    const triggerPopup = () => {
      setIsOpen(true)
      sessionStorage.setItem('lead_captured', 'true')
    }

    // Trigger after 30s
    timeoutId = setTimeout(triggerPopup, 30000)

    // Trigger on exit intent (mouse leaving window upwards)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        triggerPopup()
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('Por favor, informe seu nome')
      return
    }
    if (!whatsapp || whatsapp.length < 10) {
      toast.error('Digite um WhatsApp válido')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('leads_capturados').insert({
        nome: nome.trim(),
        whatsapp,
        origem: 'popup_exit_intent'
      })

      if (error) throw error
      
      setSubmitted(true)
      setTimeout(() => setIsOpen(false), 3000)
    } catch (err) {
      toast.error('Erro ao enviar contato.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!submitted ? (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-[#FE8330]/10 rounded-full flex items-center justify-center mx-auto text-[#FE8330]">
                  <PartyPopper className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1E2229] mb-2">Espere um pouco!</h3>
                  <p className="text-gray-500 text-sm">Quer receber em primeira mão as datas disponíveis, cancelamentos de última hora e condições especiais?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-1">
                      Seu nome
                    </label>
                    <input
                      type="text"
                      placeholder="Como podemos te chamar?"
                      maxLength={60}
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-1">
                      Seu WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ring-[#FE8330]/30 font-medium"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-2 rounded-xl bg-[#FE8330] text-white font-bold hover:bg-[#E06B1B] transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'ENVIANDO...' : (
                      <>QUERO RECEBER NOVIDADES <Send className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-400 font-bold hover:text-gray-600"
                >
                  Não, obrigado
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <PartyPopper className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#1E2229]">Tudo Certo!</h3>
                <p className="text-gray-500">Avisaremos você pelo WhatsApp assim que tivermos novidades exclusivas.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
