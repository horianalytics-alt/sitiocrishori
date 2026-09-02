import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { 
  getSiteContent, 
  getDepoimentos, 
  getConfigSitePublica, 
  getDisponibilidadePublica,
  getEventoSazonalAtivoPublica,
  getEventosSazonaisPublica,
  getEfeitoGlobalAtivoPublica,
  type HeroContent, 
  type InfrastructureItem, 
  type FAQItem 
} from "@/lib/site-content.functions";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SeasonalEffects, getSeasonTypeFromName, type Season, type SeasonalEffectsHandle } from "@/components/SeasonalEffects";
import { SeasonalGallerySection } from "@/components/SeasonalGallerySection";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Star, Calendar as CalendarIcon, MapPin, CheckCircle, Sparkles, PlayCircle } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isWithinInterval, startOfDay } from "date-fns";
import "react-day-picker/dist/style.css";
import { useDayNight } from "@/hooks/useDayNight";
import { DayNightToggle } from "@/components/DayNightToggle";
import { InfraImageLoop } from "@/components/InfraImageLoop";
import { GalleryPhotoCard } from "@/components/GalleryPhotoCard";
import { normalizeGallery, filterByMode, AMBIENTE_OPTIONS, DEFAULT_SEASONAL_PHOTOS, type AmbienteTag } from "@/lib/gallery";
import { NossosPacotes, type PacotePublico } from "@/components/NossosPacotes";
import { LeadCapturePopup } from "@/components/LeadCapturePopup";
import { InstagramGrid } from "@/components/InstagramGrid";
import { ReservaFormModal } from "@/components/ReservaFormModal";
import { TourVideoPlayer } from "@/components/TourVideoPlayer";
import { ComoChegarSection } from "@/components/ComoChegarSection";

const SITE_URL = "https://sitiocrishori.lovable.app";
const HERO_IMAGE = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000";

export const Route = createFileRoute("/")({
  head: () => {
    return {
      meta: [
        { title: "Sítio Para Eventos | Festas, Casamentos e Finais de Semana" },
        { name: "description", content: "Locação de sítio premium para eventos, festas e lazer em São Paulo." },
      ],
    };
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'hero'], queryFn: () => getSiteContent({ data: 'hero' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'infrastructure'], queryFn: () => getSiteContent({ data: 'infrastructure' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'faq'], queryFn: () => getSiteContent({ data: 'faq' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'gallery'], queryFn: () => getSiteContent({ data: 'gallery' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['depoimentos'], queryFn: () => getDepoimentos() }),
      context.queryClient.ensureQueryData({ queryKey: ['config_site'], queryFn: () => getConfigSitePublica() }),
      context.queryClient.ensureQueryData({ queryKey: ['disponibilidade_publica'], queryFn: () => getDisponibilidadePublica() }),
      context.queryClient.ensureQueryData({ queryKey: ['evento_sazonal_ativo'], queryFn: () => getEventoSazonalAtivoPublica() }),
    ]);
  },
  component: Index,
});

function Index() {
  const { data: hero } = useSuspenseQuery({ queryKey: ['site-content', 'hero'], queryFn: () => getSiteContent({ data: 'hero' }) }) as { data: HeroContent };
  const { data: infrastructure } = useSuspenseQuery({ queryKey: ['site-content', 'infrastructure'], queryFn: () => getSiteContent({ data: 'infrastructure' }) }) as { data: InfrastructureItem[] };
  const { data: faq } = useSuspenseQuery({ queryKey: ['site-content', 'faq'], queryFn: () => getSiteContent({ data: 'faq' }) }) as { data: FAQItem[] };
  const { data: galleryData } = useSuspenseQuery({ queryKey: ['site-content', 'gallery'], queryFn: () => getSiteContent({ data: 'gallery' }) }) as { data: unknown };
  const { data: depoimentos } = useSuspenseQuery({ queryKey: ['depoimentos'], queryFn: () => getDepoimentos() }) as { data: any[] };
  const { data: config } = useSuspenseQuery({ queryKey: ['config_site'], queryFn: () => getConfigSitePublica() }) as { data: any };
  const { data: disponibilidade = [] } = useSuspenseQuery({ queryKey: ['disponibilidade_publica'], queryFn: () => getDisponibilidadePublica() }) as { data: any[] };
  const { data: eventoSazonalAtivo } = useSuspenseQuery({ queryKey: ['evento_sazonal_ativo'], queryFn: () => getEventoSazonalAtivoPublica() }) as { data: any };
  
  // Todos os eventos sazonais para a galeria
  const { data: todosEventosSazonais = [] } = useQuery({
    queryKey: ['eventos_sazonais_publica'],
    queryFn: () => getEventosSazonaisPublica(),
  }) as { data: any[] };

  // Efeito global ativado pelo admin no painel
  const { data: efeitoGlobalAtivo } = useQuery({
    queryKey: ['efeito_global_ativo'],
    queryFn: () => getEfeitoGlobalAtivoPublica(),
  }) as { data: any };

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState("finais-de-semana");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ambienteFilter, setAmbienteFilter] = useState<string>("todos");
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [selectedPacote, setSelectedPacote] = useState<PacotePublico | null>(null);
  
  // Modo automático (visitante navega até a seção na galeria)
  const [inViewSeason, setInViewSeason] = useState<Season>('none');

  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const seasonalEffectsRef = useRef<SeasonalEffectsHandle>(null);

  // Efeito global (admin) ou Tema Ativo (admin)
  const adminActiveSeason: Season = useMemo(() => {
    if (efeitoGlobalAtivo && efeitoGlobalAtivo.efeito_global_ativo) {
      return getSeasonTypeFromName(efeitoGlobalAtivo.nome);
    }
    if (eventoSazonalAtivo && eventoSazonalAtivo.ativo) {
      return getSeasonTypeFromName(eventoSazonalAtivo.nome);
    }
    return "none";
  }, [efeitoGlobalAtivo, eventoSazonalAtivo]);

  // Se o admin tiver algum tema/efeito ativo, ele roda no site
  // Caso contrário, usa o modo automático do visitante ao selecionar ou rolar na galeria
  const activeSeason: Season = useMemo(() => {
    if (adminActiveSeason !== "none") return adminActiveSeason;
    return inViewSeason;
  }, [adminActiveSeason, inViewSeason]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    import('aos').then((AOS) => { AOS.init({ duration: 1000, easing: 'ease-out-back', once: true }); });
  }, []);

  const { mode, toggle: toggleMode } = useDayNight();
  const allPhotos = filterByMode(normalizeGallery(galleryData), mode);
  const tourVideoUrl = hero?.tour_video_url?.trim() || allPhotos.find(p => p.tipo === "video" && p.is_tour)?.url;
  
  const photos = useMemo(() => {
    if (ambienteFilter === "todos") return allPhotos;
    if (ambienteFilter.startsWith("sazonal_")) {
      const evId = ambienteFilter.replace("sazonal_", "");
      const ev = todosEventosSazonais.find((e: any) => e.id === evId);
      if (ev) {
        const s = getSeasonTypeFromName(ev.nome);
        return DEFAULT_SEASONAL_PHOTOS[s] || allPhotos;
      }
    }
    return allPhotos.filter(p => p.ambiente === ambienteFilter);
  }, [allPhotos, ambienteFilter, todosEventosSazonais]);

  const seasonalSectionKey = eventoSazonalAtivo ? `gallery_sazonal_${eventoSazonalAtivo.id}` : null;
  const { data: seasonalData } = useQuery({
    queryKey: ['site-content', seasonalSectionKey],
    queryFn: () => getSiteContent({ data: seasonalSectionKey! }),
    enabled: !!seasonalSectionKey,
  });
  const seasonalPhotos = seasonalSectionKey ? normalizeGallery(seasonalData) : [];

  // Mapear dias do calendário baseados na tabela de disponibilidade
  const dayModifiers = {
    disponivel: [] as Date[],
    ocupado: [] as Date[],
    reservado: [] as Date[]
  };

  disponibilidade.forEach(d => {
    const data = startOfDay(new Date(d.data + "T00:00:00"));
    if (d.status === 'disponivel') dayModifiers.disponivel.push(data);
    else if (d.status === 'ocupado') dayModifiers.ocupado.push(data);
    else if (d.status === 'reservado') dayModifiers.reservado.push(data);
  });

  const isDayDisabled = (day: Date) => {
    const d = startOfDay(day);
    return dayModifiers.ocupado.some(x => x.getTime() === d.getTime()) || dayModifiers.reservado.some(x => x.getTime() === d.getTime());
  };

  return (
    <div className={`min-h-screen selection:bg-[#FE8330] selection:text-white ${mode === "noite" ? "mode-noite" : "mode-dia"}`}>
      <div className="ambient-layer" aria-hidden="true" />
      <DayNightToggle mode={mode} onToggle={toggleMode} />
      <SeasonalEffects ref={seasonalEffectsRef} season={activeSeason} isEnabled={effectsEnabled} isSoundEnabled={soundEnabled} />
      <LeadCapturePopup />

      {/* Banner de Evento Sazonal Ativo */}
      {(efeitoGlobalAtivo?.efeito_global_ativo || eventoSazonalAtivo?.ativo) && (
        <div className="bg-[#1E2229] border-b border-white/10 text-white py-3 px-4 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 relative z-30 shadow-md">
          <span className="text-base select-none">
            {efeitoGlobalAtivo?.efeito_global_ativo ? efeitoGlobalAtivo.emoji : eventoSazonalAtivo?.emoji}
          </span>
          <span>
            Tema especial de{" "}
            <strong className="text-[#FE8330]">
              {efeitoGlobalAtivo?.efeito_global_ativo ? efeitoGlobalAtivo.nome : eventoSazonalAtivo?.nome}
            </strong>{" "}
            ativo no Sítio Cris Hori!
          </span>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[100svh] flex items-center justify-center py-20 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/60 z-10" />
          <div className="absolute inset-0 z-0">
            <img 
              src={hero?.hero_image || HERO_IMAGE} 
              alt="Vista panorâmica do sítio" 
              className="w-full h-full object-cover anim-photo-reveal scale-105" 
            />
          </div>
          <div className="relative z-20 text-center px-5 max-w-6xl mx-auto space-y-6 md:space-y-10">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3" data-aos="fade-down" data-aos-duration="1200">
              {(hero?.badges || ["Piscina Aquecida", "Campo", "Área Gourmet"]).map((b, i) => (
                <span key={i} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors cursor-default">
                  • {b}
                </span>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight" data-aos="zoom-out" data-aos-duration="1200">
              {hero?.headline}
            </h1>
            <p className="text-base md:text-lg text-white/90 font-medium max-w-[55ch] mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="400">
              {hero?.subheadline}
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10 pt-4 md:pt-8 w-full md:w-auto">
              <button onClick={() => document.getElementById('calendario')?.scrollIntoView({behavior: 'smooth'})} className="group relative w-full md:w-auto px-8 py-5 md:px-14 md:py-7 bg-[#FE8330] text-base md:text-xl font-bold rounded-full shadow-[0_20px_50px_rgba(254,131,48,0.3)] hover:scale-105 transition-all duration-500 overflow-hidden">
                <span className="relative z-10">{hero?.cta_text || "VERIFICAR DISPONIBILIDADE"}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
              <a href="#pacotes" className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-5 md:px-10 md:py-7 bg-white/10 backdrop-blur-md border border-white/20 text-white text-base md:text-lg font-bold rounded-full hover:bg-white/20 transition-all duration-300">
                <Sparkles className="w-5 h-5" />
                <span>NOSSOS PACOTES</span>
              </a>
            </div>
          </div>
        </section>

        {/* Seção Conheça o Sítio (Tour Virtual na Hero) */}
        {tourVideoUrl && (
          <section id="conheca-o-sitio" className="py-16 md:py-24 bg-[#FAF8F5] border-b border-orange-100/60 overflow-hidden">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="text-center space-y-3 max-w-2xl mx-auto" data-aos="fade-up">
                <span className="text-xs font-black tracking-widest uppercase text-[#FE8330]">
                  Tour Virtual
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E2229] tracking-tight">
                  Conheça o Sítio
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground font-medium">
                  Dê um play e faça um tour completo pelos nossos espaços antes mesmo de chegar.
                </p>
              </div>

              <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl bg-black border-4 border-white aspect-video group w-full" data-aos="fade-up" data-aos-delay="100">
                <TourVideoPlayer videoUrl={tourVideoUrl} />
              </div>
            </div>
          </section>
        )}

        {/* Disponibilidade & Calendario */}
        <section id="calendario" className="py-20 md:py-28 px-4 md:px-6 max-w-6xl mx-auto overflow-hidden">
          <div className="bg-white p-6 sm:p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-gray-100 space-y-8" data-aos="fade-up">
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-widest uppercase text-[#FE8330]">
                Disponibilidade em Tempo Real
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E2229] tracking-tight">
                Verifique as datas livres
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                O verde indica datas disponíveis para o seu evento. Em vermelho, datas já reservadas.
              </p>
            </div>

            <div className="max-w-xl mx-auto p-4 sm:p-6 bg-[#FAF8F5] rounded-[2rem] border border-gray-100 flex flex-col items-center">
              <DayPicker
                mode="single"
                selected={selectedRange?.from}
                onSelect={(d) => setSelectedRange(d ? { from: d, to: undefined } : undefined)}
                locale={ptBR}
                disabled={isDayDisabled}
                modifiers={dayModifiers}
                modifiersClassNames={{
                  disponivel: "bg-green-100 text-green-800 font-bold",
                  ocupado: "bg-red-100 text-red-400 line-through opacity-70",
                  reservado: "bg-yellow-100 text-yellow-600 opacity-80"
                }}
                className="mx-auto custom-calendar"
              />

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 mt-4 border-t border-gray-200/60 text-xs sm:text-sm font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-gray-700">Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-400 inline-block" />
                  <span className="text-gray-700">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 inline-block" />
                  <span className="text-gray-700">Reservado</span>
                </div>
              </div>
            </div>

            {config?.countdown_mensagem && (
              <div className="max-w-xl mx-auto p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center text-orange-800 font-bold text-sm sm:text-base animate-pulse">
                ⏰ {config.countdown_mensagem}
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowReservaModal(true)}
                className="min-h-[52px] py-4 px-8 rounded-2xl bg-[#FE8330] hover:bg-[#E06B1B] text-white font-black text-base shadow-xl shadow-[#FE8330]/20 transition-all active:scale-98 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <CalendarIcon className="w-5 h-5" />
                {selectedRange?.from 
                  ? `Solicitar Reserva para ${format(selectedRange.from, "dd/MM/yyyy")}` 
                  : "Solicitar Pré-Reserva Agora"}
              </button>
            </div>
          </div>
        </section>

        {/* Seção Dedicada: Nossos Pacotes */}
        <section id="pacotes" className="py-20 md:py-28 bg-[#FAF8F5] border-y border-orange-100/60 px-4 md:px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto" data-aos="fade-up">
              <span className="text-xs font-black tracking-widest uppercase text-[#FE8330]">
                Opções Prontas
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E2229] tracking-tight">
                Nossos Pacotes
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Escolha uma opção completa pensada para o seu conforto ou monte um evento sob medida.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="100">
              <NossosPacotes
                onSelectPacote={(pacote) => {
                  setSelectedPacote(pacote);
                  setShowReservaModal(true);
                }}
                onCustomReserva={() => {
                  setSelectedPacote(null);
                  setShowReservaModal(true);
                }}
              />
            </div>
          </div>
        </section>

        {/* Infrastructure Grid */}
        <section id="infraestrutura" className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20 space-y-4">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Estrutura de Alto Padrão</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-[60ch] mx-auto" data-aos="fade-up" data-aos-delay="100">Cada detalhe foi planejado para oferecer o máximo conforto e diversão.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
            {infrastructure?.map((item, i) => (
              <div key={i} className="card-premium rounded-[2rem] md:rounded-[3rem] overflow-hidden group" data-aos="fade-up" data-aos-delay={i*100}>
                <div className="aspect-[4/5] overflow-hidden relative">
                  <InfraImageLoop
                    images={(item.images && item.images.length > 0 ? item.images : [item.image]).filter(Boolean)}
                    alt={item.title}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{item.title}</h3>
                    <div className="w-12 h-1 bg-[#FE8330] rounded-full group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-muted-foreground leading-relaxed font-medium text-sm md:text-base">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery Section com Filtros */}
        <section id="galeria" className="py-20 md:py-32 bg-white px-4 md:px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-right">Galeria de Fotos</h2>
                <p className="text-sm md:text-lg text-muted-foreground font-medium" data-aos="fade-right" data-aos-delay="100">
                  Conheça cada ambiente do nosso paraíso.
                </p>
              </div>
            </div>

            {/* Filtros de Ambiente e Especiais de Época */}
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3" data-aos="fade-up">
              <button
                onClick={() => {
                  setAmbienteFilter("todos");
                  setInViewSeason("none");
                }}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all ${ambienteFilter === "todos" ? 'bg-[#FE8330] text-white border-[#FE8330] shadow-md shadow-[#FE8330]/20' : 'bg-gray-50 text-gray-600 hover:border-[#FE8330]/40'}`}
              >
                Todos
              </button>
              {AMBIENTE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setAmbienteFilter(opt.value);
                    setInViewSeason("none");
                  }}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all ${ambienteFilter === opt.value ? 'bg-[#FE8330] text-white border-[#FE8330] shadow-md shadow-[#FE8330]/20' : 'bg-gray-50 text-gray-600 hover:border-[#FE8330]/40'}`}
                >
                  {opt.label}
                </button>
              ))}

              {/* Filtros Rápidos de Época (Natal, Halloween, etc.) */}
              {todosEventosSazonais.map((evento: any) => {
                const evSeason = getSeasonTypeFromName(evento.nome);
                const isSelected = ambienteFilter === `sazonal_${evento.id}`;
                return (
                  <button
                    key={evento.id}
                    onClick={() => {
                      if (isSelected) {
                        setAmbienteFilter("todos");
                        setInViewSeason("none");
                      } else {
                        setAmbienteFilter(`sazonal_${evento.id}`);
                        setInViewSeason(evSeason);
                      }
                    }}
                    className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FE8330] text-white border-[#FE8330] shadow-md shadow-[#FE8330]/25 scale-105'
                        : 'bg-orange-50/70 text-gray-800 border-orange-200 hover:border-[#FE8330] hover:bg-orange-100/70'
                    }`}
                  >
                    <span>{evento.emoji}</span>
                    <span>{evento.nome}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[400px]">
              <AnimatePresence mode="popLayout">
                <motion.div 
                  key={ambienteFilter}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                >
                  {photos.map((photo, i) => (
                    <GalleryPhotoCard
                      key={`${photo.url}-${i}`}
                      photo={photo}
                      index={i}
                      fallbackUrl={config?.foto_fallback}
                      onClick={() => photo.tipo === "foto" && setSelectedImage(photo.url)}
                    />
                  ))}
                  {photos.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 font-medium">
                      Nenhuma mídia encontrada para este ambiente.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Seções de Fotos de Cada Evento Sazonal com detecção de visualização para disparo do efeito */}
            {todosEventosSazonais.map((evento: any) => (
              <SeasonalGallerySection
                key={evento.id}
                evento={evento}
                fallbackUrl={config?.foto_fallback}
                onSelectImage={(url) => setSelectedImage(url)}
                onEnter={(season) => setInViewSeason(season)}
                onLeave={(season) => setInViewSeason((current) => (current === season ? 'none' : current))}
              />
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-32 bg-[#FAF8F5] relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-20 space-y-4">
              <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Memórias Inesquecíveis</h2>
              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-[60ch] mx-auto" data-aos="fade-up" data-aos-delay="100">Confira o depoimento de quem já viveu momentos especiais aqui.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              {(depoimentos || []).map((dep, i) => (
                <div key={i} className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 hover-lift relative group overflow-hidden flex flex-col" data-aos="fade-up" data-aos-delay={i*100}>
                  {dep.foto_evento_url && (
                    <div className="h-48 w-full bg-gray-100 shrink-0">
                      <img src={dep.foto_evento_url} className="w-full h-full object-cover" alt={`Evento de ${dep.nome}`} />
                    </div>
                  )}
                  <div className="p-6 md:p-10 flex-1 flex flex-col space-y-6">
                    <div className="flex text-[#FE8330] gap-1">
                      {Array.from({length: dep.estrelas || 5}).map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                    </div>
                    <p className="text-base md:text-lg font-medium leading-relaxed text-gray-700 italic flex-1">"{dep.depoimento}"</p>
                    <div className="pt-6 border-t border-gray-50">
                      <p className="font-extrabold text-xl tracking-tight">{dep.nome}</p>
                      <p className="text-[#FE8330] font-black text-[10px] uppercase tracking-[0.3em] mt-1">{dep.evento}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção Como Chegar (Google Maps) */}
        <ComoChegarSection config={config} />

        {/* Instagram Grid */}
        <InstagramGrid />

        {/* FAQ */}
        <section className="py-20 md:py-32 px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-16 md:mb-20 space-y-4">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Dúvidas Frequentes</h2>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-[60ch] mx-auto" data-aos="fade-up" data-aos-delay="100">
              Leia nossas <Link to="/regras" className="text-[#FE8330] underline font-bold">Regras e Políticas</Link> ou veja as perguntas mais comuns.
            </p>
          </div>
          <Accordion className="space-y-6">
            {(faq || []).map((item, i) => (
              <AccordionItem key={i} title={item.question} className="bg-white px-6 md:px-10 py-3 md:py-4 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#FE8330]/20 transition-colors">
                <div className="text-base md:text-lg text-muted-foreground leading-relaxed pt-2">{item.answer}</div>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 md:p-6 backdrop-blur-xl transition-all" onClick={() => setSelectedImage(null)}>
          <div className="relative group w-full max-w-[90vw] md:max-w-5xl max-h-[85vh]">
            <img src={selectedImage} className="w-full max-h-[85vh] object-contain rounded-2xl md:rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)]" alt="Visualização" />
            <button className="absolute top-2 right-2 md:-top-4 md:-right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black shadow-2xl hover:scale-110 transition-transform">×</button>
          </div>
        </div>
      )}

      <WhatsAppButton 
        phoneNumber={hero?.whatsapp_number || config?.whatsapp_contato || ""} 
        floating 
        message={hero?.whatsapp_message} 
        label="Falar no WhatsApp" 
      />

      {showReservaModal && (
        <ReservaFormModal
          onClose={() => {
            setShowReservaModal(false);
            setSelectedPacote(null);
          }}
          initialData={{
            tipo_evento: selectedPacote?.nome.toLowerCase().includes('day')
              ? 'day_use'
              : selectedPacote?.nome.toLowerCase().includes('semana')
                ? 'final_de_semana'
                : 'festa',
            num_convidados: selectedPacote?.num_pessoas || 30,
            data_evento: selectedRange?.from || null,
            pacote_nome: selectedPacote?.nome,
            pacote_id: selectedPacote?.id,
          }}
          adminPhone={hero?.whatsapp_number || config?.whatsapp_contato || "11999999999"}
        />
      )}

      <footer className="py-16 md:py-32 bg-[#1E2229] text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16 relative z-10">
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-[#FE8330] tracking-tight">Sítio de Eventos</h2>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed font-medium max-w-[60ch]">O cenário perfeito para transformar seus momentos em memórias inesquecíveis.</p>
          </div>
          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Navegação</h4>
            <ul className="space-y-4 font-medium text-gray-300">
              <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#FE8330]">Início</button></li>
              <li><button onClick={() => document.getElementById('infraestrutura')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#FE8330]">Estrutura</button></li>
              <li><button onClick={() => document.getElementById('galeria')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#FE8330]">Galeria</button></li>
              <li><Link to="/regras" className="hover:text-[#FE8330]">Regras e Políticas</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Contato</h4>
            <p className="text-gray-300 font-medium">São Paulo, SP<br />Brasil</p>
            <p className="text-[#FE8330] font-bold text-lg">{hero?.whatsapp_number}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 md:mt-20 pt-10 border-t border-white/5 text-center text-gray-500 text-sm">
          <p>© 2026 Sítio de Eventos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
export default Index;
