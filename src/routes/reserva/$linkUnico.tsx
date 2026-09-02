import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getRegrasPoliticas, getConfigSitePublica } from '@/lib/site-content.functions'
import { supabase } from '@/integrations/supabase/client'
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageCircle, 
  PartyPopper, 
  Users, 
  Sparkles,
  Luggage,
  ShieldCheck,
  Navigation,
  Sun,
  Loader2 
} from 'lucide-react'

export const Route = createFileRoute('/reserva/$linkUnico')({
  component: ClientArea,
})

const STATUS_MAP: Record<string, { label: string; badge: string; color: string; border: string }> = {
  confirmado: { 
    label: "Confirmada", 
    badge: "🟢 Reserva Confirmada!", 
    color: "bg-green-100 text-green-900 border-green-300", 
    border: "border-green-500" 
  },
  pendente: { 
    label: "Em Análise", 
    badge: "🟡 Solicitação Recebida (Aguardando Confirmação)", 
    color: "bg-yellow-100 text-yellow-900 border-yellow-300", 
    border: "border-yellow-400" 
  },
  cancelado: { 
    label: "Cancelada", 
    badge: "🔴 Reserva Cancelada", 
    color: "bg-red-100 text-red-900 border-red-300", 
    border: "border-red-400" 
  },
}

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

  const { data: configSite } = useQuery({
    queryKey: ['config_site_publica'],
    queryFn: () => getConfigSitePublica(),
  })

  const { data: regras = [] } = useQuery({
    queryKey: ['regras_politicas'],
    queryFn: () => getRegrasPoliticas(),
  })

  if (isLoadingReserva) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] pt-24">
        <Loader2 className="w-10 h-10 text-[#FE8330] animate-spin" />
      </div>
    )
  }

  if (!reserva) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4 pt-28">
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] text-center max-w-md shadow-xl border space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#1E2229]">Reserva não encontrada</h2>
          <p className="text-sm text-gray-500">
            O link acessado é inválido ou a reserva foi removida pela administração.
          </p>
        </div>
      </div>
    )
  }

  const targetDate = reserva.data_evento 
    ? new Date(reserva.data_evento + "T00:00:00") 
    : reserva.data_inicio 
      ? new Date(reserva.data_inicio + "T00:00:00") 
      : null

  const now = new Date()
  const daysLeft = targetDate 
    ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) 
    : null

  const statusKey = reserva.status_novo ?? reserva.status ?? 'pendente'
  const statusCfg = STATUS_MAP[statusKey] ?? STATUS_MAP['pendente']!

  const rawPhone = configSite?.whatsapp_contato?.replace(/\D/g, '') || '11973000753'
  const adminPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`
  const zapLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
    `Olá! Sou ${reserva.cliente_nome} e tenho uma dúvida sobre minha reserva (Código: ${reserva.link_unico}).`
  )}`

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-24 sm:pt-28 md:pt-32 pb-20 selection:bg-[#FE8330] selection:text-white">
      
      <main className="max-w-xl mx-auto px-4 space-y-6">
        
        {/* CORREÇÃO 1: Badge de Status é a primeira coisa visível após o header, sem ser encoberto */}
        <div className="text-center">
          <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-base sm:text-lg font-black border-2 ${statusCfg.color} shadow-md transition-transform hover:scale-[1.02]`}>
            {statusCfg.badge}
          </span>
        </div>

        {/* Topo do Cartão Digital */}
        <div className="bg-[#1E2229] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl text-center space-y-3 relative overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-white/10 text-orange-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" /> Cartão Digital do Convidado
          </span>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Olá, {reserva.cliente_nome ? reserva.cliente_nome.split(' ')[0] : 'Visitante'}!
          </h1>
          
          <p className="text-sm sm:text-base text-gray-300 font-medium">
            Seja bem-vindo à sua área exclusiva de acompanhamento do Sítio Cris Hori.
          </p>
        </div>

        {/* Bloco 1: Countdown e Data em Destaque */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
          
          {/* Countdown Grande */}
          {daysLeft !== null && daysLeft > 0 && (
            <div className="p-6 bg-orange-50/80 rounded-[2rem] border-2 border-orange-200/80 text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-[#FE8330]">
                Contagem Regressiva
              </span>
              <div className="text-6xl sm:text-7xl font-black text-[#1E2229] tracking-tight">
                {daysLeft}
              </div>
              <p className="text-sm font-bold text-gray-600">
                {daysLeft === 1 ? 'dia para o seu momento!' : 'dias para o seu momento especial!'}
              </p>
            </div>
          )}

          {daysLeft === 0 && (
            <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-300 text-center space-y-1">
              <span className="text-3xl">🎉</span>
              <h3 className="text-2xl font-black text-emerald-800">É hoje o seu dia!</h3>
              <p className="text-sm text-emerald-700 font-medium">Aproveite cada segundo no Sítio Cris Hori.</p>
            </div>
          )}

          {daysLeft !== null && daysLeft < 0 && (
            <div className="p-5 bg-gray-50 rounded-[2rem] border text-center text-gray-500 font-medium text-sm">
              Este evento já foi realizado. Esperamos revê-lo em breve!
            </div>
          )}

          {/* Data em Destaque */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FE8330] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 block">
                Data do Evento
              </span>
              <span className="text-lg sm:text-xl font-black text-gray-900">
                {targetDate ? targetDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Data a combinar'}
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Detalhes em Blocos Bem Separados com Ícones Grandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Convidados */}
          <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block">Convidados</span>
              <span className="text-lg font-black text-gray-900">
                {reserva.num_convidados ? `${reserva.num_convidados} pessoas` : 'Não informado'}
              </span>
            </div>
          </div>

          {/* Tipo de Evento */}
          <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              reserva.tipo_evento === 'day_use' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
            }`}>
              {reserva.tipo_evento === 'day_use' ? (
                <Sun className="w-6 h-6" />
              ) : (
                <PartyPopper className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block">Tipo de Locação</span>
              <span className="text-lg font-black text-gray-900">
                {reserva.tipo_evento === 'day_use'
                  ? 'Day Use'
                  : reserva.tipo_evento === 'final_de_semana'
                    ? 'Final de Semana'
                    : 'Festa / Evento'}
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 3: O Que Levar (Checklist) */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FE8330] flex items-center justify-center">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1E2229]">O que não esquecer de levar</h3>
              <p className="text-xs text-gray-400 font-medium">Itens recomendados para o seu conforto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {[
              "Itens de higiene pessoal (toalhas, sabonete)",
              "Roupas de cama e travesseiros (se pernoite)",
              "Carvão e acendedor para churrasco",
              "Sacos de lixo reforçados",
              "Protetor solar e repelente",
              "Bebidas, gelo e carvão"
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 text-sm font-medium text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 4: Regras do Sítio */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1E2229]">Regras Importantes</h3>
              <p className="text-xs text-gray-400 font-medium">Para uma convivência harmoniosa</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {(regras as any[]).slice(0, 3).map((regra, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <h4 className="font-black text-sm text-gray-900">{regra.titulo}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{regra.conteudo}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 5: Contato e Dúvidas com Botão Grande */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
          <h3 className="text-xl font-black text-[#1E2229]">Precisa falar com a gente?</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Qualquer dúvida sobre acesso, horários ou estrutura, fale diretamente com os proprietários.
          </p>
          <a
            href={zapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[52px] w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            Falar pelo WhatsApp
          </a>
        </div>

      </main>
    </div>
  )
}
