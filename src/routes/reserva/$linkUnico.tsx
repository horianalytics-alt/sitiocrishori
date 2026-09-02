import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getRegrasPoliticas, getConfigSitePublica } from '@/lib/site-content.functions'
import { supabase } from '@/integrations/supabase/client'
import { MapPin, Calendar, Clock, CheckCircle, AlertTriangle, MessageCircle, PartyPopper, Loader2 } from 'lucide-react'
import { WhatsAppButton } from '@/components/WhatsAppButton'


export const Route = createFileRoute('/reserva/$linkUnico')({
  component: ClientArea,
})

function ClientArea() {
  const { linkUnico } = Route.useParams()

  const { data: reserva, isLoading: isLoadingReserva } = useQuery({
    queryKey: ['reserva', linkUnico],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('link_unico', linkUnico)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: regras = [] } = useQuery({
    queryKey: ['regras_politicas'],
    queryFn: () => getRegrasPoliticas(),
  })

  const { data: configSite } = useQuery({
    queryKey: ['config_site_publica'],
    queryFn: () => getConfigSitePublica(),
  })

  const whatsappContato = configSite?.whatsapp_contato?.replace(/\D/g, '') || '5511973000753'

  if (isLoadingReserva) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="w-8 h-8 text-[#FE8330] animate-spin" />
      </div>
    )
  }

  if (!reserva) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-6">
        <div className="bg-white p-10 rounded-[2rem] text-center max-w-md shadow-xl border">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Reserva não encontrada</h2>
          <p className="text-muted-foreground">O link acessado é inválido ou a reserva foi removida.</p>
        </div>
      </div>
    )
  }

  const targetDate = reserva.data_evento ? new Date(reserva.data_evento) : reserva.data_inicio ? new Date(reserva.data_inicio) : null
  const now = new Date()
  const daysLeft = targetDate ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* Header */}
      <header className="bg-[#1E2229] text-white pt-12 pb-24 px-4 rounded-b-[2.5rem] md:rounded-b-[4rem]">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <PartyPopper className="w-12 h-12 text-[#FE8330] mx-auto" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Olá, {reserva.cliente_nome?.split(' ')[0]}!
          </h1>
          <p className="text-gray-400 text-lg">
            Sua área exclusiva para acompanhar os detalhes do seu evento.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-12 space-y-6">
        {/* Card Principal */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-gray-100 space-y-8">
          
          {/* Countdown */}
          {daysLeft !== null && daysLeft >= 0 && (
            <div className="text-center p-6 bg-orange-50 rounded-[1.5rem] border border-orange-100">
              <p className="text-sm font-bold text-[#FE8330] uppercase tracking-widest mb-2">Faltam apenas</p>
              <p className="text-5xl md:text-6xl font-black text-[#1E2229]">{daysLeft}</p>
              <p className="text-sm font-bold text-gray-500 mt-1">dias para o seu momento!</p>
            </div>
          )}

          {daysLeft !== null && daysLeft < 0 && (
            <div className="text-center p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
              <p className="text-xl font-bold text-gray-600">Este evento já aconteceu.</p>
              <p className="text-sm text-gray-400 mt-2">Obrigado por escolher nosso espaço!</p>
            </div>
          )}

          {/* Dados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border">
              <Calendar className="w-8 h-8 text-[#FE8330]" />
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Data</p>
                <p className="font-bold text-gray-800">
                  {targetDate ? targetDate.toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border">
              <Clock className="w-8 h-8 text-[#FE8330]" />
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                <p className="font-bold text-gray-800 capitalize">{reserva.status_novo ?? reserva.status ?? 'pendente'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-black flex items-center gap-2">
            <CheckCircle className="text-[#FE8330]" /> Não se esqueça de levar
          </h3>
          <ul className="space-y-3">
            {[
              "Itens de higiene pessoal (sabonete, shampoo, toalha)",
              "Roupas de cama e travesseiros (para pernoite)",
              "Carvão e gel acendedor para churrasco",
              "Sacos de lixo grandes",
              "Protetor solar e repelente",
              "Bebidas e gelo"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FE8330] mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Regras Resumidas */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-black flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" /> Regras Importantes
          </h3>
          <div className="space-y-4">
            {(regras as any[]).slice(0, 3).map((regra, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                <p className="font-bold text-gray-800 text-sm mb-1">{regra.titulo}</p>
                <p className="text-gray-500 text-sm">{regra.conteudo}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 text-center space-y-4">
          <h3 className="text-xl font-black">Ficou com alguma dúvida?</h3>
          <p className="text-gray-500">Nossa equipe está à disposição no WhatsApp para ajudar no que for preciso.</p>
          <WhatsAppButton 
            phoneNumber="11999999999" // Poderíamos puxar do config_site, mas como não tá no escopo desta view
            label="Falar com o Sítio"
            message={`Olá! Sou ${reserva.cliente_nome} e tenho uma dúvida sobre minha reserva.`}
            className="w-full md:w-auto"
          />
        </div>

      </main>
    </div>
  )
}
