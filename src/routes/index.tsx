import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { getSiteContent, getReservas, getDepoimentos, type HeroContent, type InfrastructureItem, type FAQItem } from "@/lib/site-content.functions";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SeasonalEffects, type Season, type SeasonalEffectsHandle } from "@/components/SeasonalEffects";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Star, Calendar as CalendarIcon, MapPin, Users, CheckCircle, Sparkles, Volume2, VolumeX } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isWithinInterval, startOfDay } from "date-fns";
import "react-day-picker/dist/style.css";
import { useDayNight } from "@/hooks/useDayNight";
import { DayNightToggle } from "@/components/DayNightToggle";
import { GalleryPhotoCard } from "@/components/GalleryPhotoCard";
import { normalizeGallery, filterByMode } from "@/lib/gallery";

const SEASON_SECTION: Record<string, string> = { natal: "gallery_natal", pascoa: "gallery_pascoa", "ano-novo": "gallery_ano_novo" };



const SITE_URL = "https://sitiocrishori.lovable.app";
const HERO_IMAGE = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000";

export const Route = createFileRoute("/")({
  head: () => {
    return {
      meta: [
        { title: "Sítio Para Eventos | Festas, Casamentos e Finais de Semana" },
        { name: "description", content: "Locação de sítio premium para eventos, festas e lazer em São Paulo. Piscina aquecida, campo de futebol, salão de festas e suítes completas." },
        { property: "og:title", content: "Sítio Para Eventos | O Cenário Perfeito para sua Festa" },
        { property: "og:description", content: "Aluguel de sítio de alto padrão para festas, casamentos e lazer. Piscina aquecida, salão de festas e área gourmet completa." },
        { property: "og:url", content: `${SITE_URL}/` },
        { property: "og:image", content: HERO_IMAGE },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Sítio Para Eventos | Festas e Lazer" },
        { name: "twitter:description", content: "O melhor sítio para seu evento ou final de semana com a família." },
        { name: "twitter:image", content: HERO_IMAGE },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    };
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'hero'], queryFn: () => getSiteContent({ data: 'hero' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'infrastructure'], queryFn: () => getSiteContent({ data: 'infrastructure' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'faq'], queryFn: () => getSiteContent({ data: 'faq' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['site-content', 'gallery'], queryFn: () => getSiteContent({ data: 'gallery' }) }),
      context.queryClient.ensureQueryData({ queryKey: ['reservas'], queryFn: () => getReservas() }),
      context.queryClient.ensureQueryData({ queryKey: ['depoimentos'], queryFn: () => getDepoimentos() }),
    ]);
  },
  component: Index,
});

function Index() {
  const { data: hero } = useSuspenseQuery({ queryKey: ['site-content', 'hero'], queryFn: () => getSiteContent({ data: 'hero' }) }) as { data: HeroContent };
  const { data: infrastructure } = useSuspenseQuery({ queryKey: ['site-content', 'infrastructure'], queryFn: () => getSiteContent({ data: 'infrastructure' }) }) as { data: InfrastructureItem[] };
  const { data: faq } = useSuspenseQuery({ queryKey: ['site-content', 'faq'], queryFn: () => getSiteContent({ data: 'faq' }) }) as { data: FAQItem[] };
  const { data: galleryData } = useSuspenseQuery({ queryKey: ['site-content', 'gallery'], queryFn: () => getSiteContent({ data: 'gallery' }) }) as { data: unknown };


  const { data: reservas } = useSuspenseQuery({ queryKey: ['reservas'], queryFn: () => getReservas() }) as { data: any[] };
  const { data: depoimentos } = useSuspenseQuery({ queryKey: ['depoimentos'], queryFn: () => getDepoimentos() }) as { data: any[] };

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState("finais-de-semana");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode] = useState<"masonry">("masonry");
  const [activeSeason, setActiveSeason] = useState<Season>("none");
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [mounted, setMounted] = useState(false);
  const seasonalEffectsRef = useRef<SeasonalEffectsHandle>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);


  useEffect(() => {
    import('aos').then((AOS) => { AOS.init({ duration: 1000, easing: 'ease-out-back', once: true }); });
  }, []);

  const reservedDays = (reservas || []).map(r => ({
    from: startOfDay(new Date(r.data_inicio)),
    to: startOfDay(new Date(r.data_fim))
  }));

  const isDayReserved = (day: Date) => reservedDays.some(range => isWithinInterval(startOfDay(day), { start: range.from, end: range.to }));
  const { mode, toggle: toggleMode } = useDayNight();
  const photos = filterByMode(normalizeGallery(galleryData), mode);

  const seasonSection = SEASON_SECTION[activeSeason] ?? null;
  const { data: seasonalData } = useQuery({
    queryKey: ['site-content', seasonSection],
    queryFn: () => getSiteContent({ data: seasonSection as string }),
    enabled: !!seasonSection,
  });
  const seasonalPhotos = seasonSection ? normalizeGallery(seasonalData) : [];




  return (
    <div 
      className={`min-h-screen selection:bg-[#FE8330] selection:text-white ${mode === "noite" ? "mode-noite" : "mode-dia"}`}
    >
      <div className="ambient-layer" aria-hidden="true" />
      <DayNightToggle mode={mode} onToggle={toggleMode} />
      <SeasonalEffects ref={seasonalEffectsRef} season={activeSeason} isEnabled={effectsEnabled} isSoundEnabled={soundEnabled} />
      

      

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[100svh] flex items-center justify-center py-20 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/60 z-10" />
          <div className="absolute inset-0 z-0">
            <img 
              src={hero?.hero_image || HERO_IMAGE} 
              alt="Vista panorâmica do sítio para eventos com piscina e área verde" 
              className="w-full h-full object-cover anim-photo-reveal scale-105" 
              loading="eager"
            />
          </div>
          <div className="relative z-20 text-center px-5 max-w-6xl mx-auto space-y-6 md:space-y-10">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3" data-aos="fade-down" data-aos-duration="1200">
              {(hero?.badges || ["Piscina Aquecida", "Campo", "Área Gourmet"]).map((b, i) => (
                <span 
                  key={i} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors cursor-default"
                >
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
              <button 
                onClick={() => document.getElementById('calendario')?.scrollIntoView({behavior: 'smooth'})} 
                className="group relative w-full md:w-auto px-8 py-5 md:px-14 md:py-7 bg-[#FE8330] text-base md:text-xl font-bold rounded-full shadow-[0_20px_50px_rgba(254,131,48,0.3)] hover:scale-105 hover:shadow-[0_25px_60px_rgba(254,131,48,0.4)] transition-all duration-500 overflow-hidden"
              >
                <span className="relative z-10">{hero?.cta_text || "VERIFICAR DISPONIBILIDADE"}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
              
              <a 
                href="#pacotes" 
                className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-5 md:px-10 md:py-7 bg-white/10 backdrop-blur-md border border-white/20 text-white text-base md:text-lg font-bold rounded-full hover:bg-white/20 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                <span>NOSSOS PACOTES</span>
              </a>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-50">
            <div className="w-1 h-12 rounded-full bg-linear-to-b from-white to-transparent" />
          </div>
        </section>

        {/* Airbnb Style Calendar Section */}
        <section id="calendario" className="py-20 md:py-40 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="bg-white p-4 md:p-20 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:flex-row gap-10 md:gap-20 items-stretch" data-aos="fade-up">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight">Escolha suas datas</h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-[60ch]">Selecione o período desejado no calendário para consultar valores e disponibilidade instantânea.</p>
              </div>
              <div className="flex justify-center p-2 md:p-4 bg-[#FAF8F5] rounded-3xl border overflow-x-auto">
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={setSelectedRange}
                  locale={ptBR}
                  disabled={isDayReserved}
                  modifiers={{ reserved: isDayReserved }}
                  modifiersClassNames={{ reserved: "bg-[#FE8330] text-white rounded-full line-through opacity-50" }}
                  className="mx-auto"
                />
              </div>
            </div>
            
            <div className="lg:w-[400px] w-full bg-[#FAF8F5] p-5 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#FE8330]/10 space-y-8 lg:sticky lg:top-10">
              <h3 className="text-2xl font-black flex items-center gap-3"><CheckCircle className="text-[#FE8330]" /> Reserva Garantida</h3>
              {selectedRange?.from ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-6 bg-white rounded-2xl border shadow-sm space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-[#FE8330]">Período Selecionado</p>
                    <p className="text-lg font-bold">
                      {format(selectedRange.from, "dd/MM/yyyy")} 
                      {selectedRange.to && ` até ${format(selectedRange.to, "dd/MM/yyyy")}`}
                    </p>
                  </div>
                  <WhatsAppButton 
                    phoneNumber={hero?.whatsapp_number || ""}
                    label="Solicitar Orçamento Agora"
                    message={`Olá! Gostaria de um orçamento para o período de ${format(selectedRange.from, "dd/MM/yyyy")} ${selectedRange.to ? `até ${format(selectedRange.to, "dd/MM/yyyy")}` : ""}. O site mostra que está livre!`}
                    className="w-full py-6 text-xl"
                  />

                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground font-medium italic">Selecione uma data no calendário para continuar</p>
              )}
            </div>
          </div>
        </section>

        {/* Infrastructure Grid */}
        <section id="infraestrutura" className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20 space-y-4">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Estrutura de Alto Padrão</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-[60ch] mx-auto" data-aos="fade-up" data-aos-delay="100">Cada detalhe foi planejado para oferecer o máximo conforto e diversão para você e seus convidados.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
            {infrastructure?.map((item, i) => (
              <div key={i} className="card-premium rounded-[2rem] md:rounded-[3rem] overflow-hidden group" data-aos="fade-up" data-aos-delay={i*100}>
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img src={item.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={`Infraestrutura: ${item.title}`} loading="lazy" />
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

        {/* Tabs Modalidades & Sazonalidades */}
        <section id="pacotes" className="py-20 md:py-32 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-5xl font-black tracking-tight mb-4">Escolha sua Modalidade</h2>
              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-[60ch] mx-auto">Temos o formato ideal para cada tipo de celebração.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="mb-12 md:mb-16">
                {/* Mobile: botões empilhados verticalmente */}
                <div className="flex md:hidden flex-col w-full gap-3">
                  {[
                    { id: "finais-de-semana", label: "Finais de Semana", season: "none" as Season },
                    { id: "festas-eventos", label: "Festas & Eventos", season: "none" as Season },
                    { id: "day-use", label: "Day Use", season: "none" as Season },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(t.id);
                        setActiveSeason(t.season);
                      }}
                      className={`w-full min-h-[52px] rounded-xl text-sm font-bold uppercase tracking-wide border transition-all ${
                        activeTab === t.id
                          ? "bg-[#FE8330] text-white border-[#FE8330]"
                          : "bg-transparent text-gray-500 border-gray-200 hover:border-[#FE8330]/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 py-2 text-center">
                    Pacotes Sazonais
                  </div>
                  {[
                    { id: "natal", label: "Natal ❄️", season: "natal" as Season },
                    { id: "ano-novo", label: "Ano Novo ✨", season: "ano-novo" as Season },
                    { id: "pascoa", label: "Páscoa 🐰", season: "pascoa" as Season },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(t.id);
                        setActiveSeason(t.season);
                        seasonalEffectsRef.current?.playSound(t.season);
                      }}
                      className={`w-full min-h-[52px] rounded-xl text-sm font-bold uppercase tracking-wide border transition-all ${
                        activeTab === t.id
                          ? "bg-[#FE8330] text-white border-[#FE8330]"
                          : "bg-transparent text-gray-500 border-gray-200 hover:border-[#FE8330]/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Desktop: pills horizontais com scroll suave */}
                <div className="hidden md:flex flex-nowrap overflow-x-auto h-auto gap-3 md:gap-4 justify-center bg-transparent p-0 no-scrollbar scroll-smooth">
                  {[
                    { id: "finais-de-semana", label: "Finais de Semana", season: "none" as Season },
                    { id: "festas-eventos", label: "Festas & Eventos", season: "none" as Season },
                    { id: "day-use", label: "Day Use", season: "none" as Season },
                    { id: "natal", label: "Natal ❄️", season: "natal" as Season },
                    { id: "ano-novo", label: "Ano Novo ✨", season: "ano-novo" as Season },
                    { id: "pascoa", label: "Páscoa 🐰", season: "pascoa" as Season },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(t.id);
                        setActiveSeason(t.season);
                        if (t.season !== 'none') {
                          seasonalEffectsRef.current?.playSound(t.season);
                        }
                      }}
                      className={`shrink-0 px-6 py-3 min-h-11 rounded-full whitespace-nowrap text-sm font-bold border transition-all ${
                        activeTab === t.id
                          ? "bg-[#FE8330] text-white border-[#FE8330]"
                          : "bg-white/50 text-gray-600 border-transparent hover:border-[#FE8330]/30"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative overflow-hidden min-h-[420px] md:min-h-[500px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    transition={{ 
                      duration: 0.5, 
                      ease: [0.16, 1, 0.3, 1] // easeOutExpo
                    }}
                  >
                    <TabsContent value="finais-de-semana" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-5 md:p-12 bg-[#FAF8F5] rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Experiência Completa</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Finais de Semana</h3>
                          </div>
                          <p className="text-base md:text-xl text-muted-foreground leading-relaxed font-medium">Privacidade absoluta e lazer total para sua família com pernoite completo e infraestrutura de hotel fazenda premium.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Até 20 pessoas no pernoite",
                              "Cozinha industrial completa",
                              "Suítes climatizadas",
                              "Área VIP com vista",
                              "Estacionamento privativo",
                              "Check-in flexível"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xs">
                                <CheckCircle className="text-[#FE8330] w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-full lg:w-[55%] group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl aspect-video lg:aspect-auto lg:h-[400px]">
                          <img src={HERO_IMAGE} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Vista da acomodação para Finais de Semana" loading="lazy" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="natal" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-5 md:p-12 bg-[#FAF8F5] rounded-[2rem] md:rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Natal Encantado</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Natal no Sítio ❄️</h3>
                          </div>
                          <p className="text-base md:text-xl text-muted-foreground leading-relaxed font-medium max-w-[60ch]">Viva a magia do Natal com sua família em um ambiente decorado e acolhedor.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Decoração temática inclusa",
                              "Ceia completa (opcional)",
                              "Chegada do Papai Noel",
                              "Espaço para troca de presentes",
                              "Piscina aquecida",
                              "Acomodação para toda família"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xs">
                                <CheckCircle className="text-[#FE8330] w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-full lg:w-[55%] group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl aspect-video lg:aspect-auto lg:h-[400px]">
                          <img src="https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Decoração de Natal no sítio" loading="lazy" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ano-novo" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-5 md:p-12 bg-[#FAF8F5] rounded-[2rem] md:rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Réveillon Premium</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Ano Novo ✨</h3>
                          </div>
                          <p className="text-base md:text-xl text-muted-foreground leading-relaxed font-medium max-w-[60ch]">Inicie o novo ciclo com estilo, paz e uma festa inesquecível entre amigos.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Queima de fogos privativa",
                              "Festa na piscina",
                              "Som e Iluminação",
                              "Buffet de Réveillon",
                              "Brinde com Espumante",
                              "Pernoite exclusivo"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xs">
                                <CheckCircle className="text-[#FE8330] w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-full lg:w-[55%] group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl aspect-video lg:aspect-auto lg:h-[400px]">
                          <img src="https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Festa de Ano Novo no sítio" loading="lazy" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="pascoa" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-5 md:p-12 bg-[#FAF8F5] rounded-[2rem] md:rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Páscoa no Sítio</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Páscoa 🐰</h3>
                          </div>
                          <p className="text-base md:text-xl text-muted-foreground leading-relaxed font-medium max-w-[60ch]">Momentos de união e diversão para as crianças com nossa caça aos ovos.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Caça aos ovos monitorada",
                              "Oficina de chocolate",
                              "Almoço de Páscoa",
                              "Contato com a natureza",
                              "Playground completo",
                              "Feriado prolongado"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xs">
                                <CheckCircle className="text-[#FE8330] w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-full lg:w-[55%] group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl aspect-video lg:aspect-auto lg:h-[400px]">
                          <img src="https://images.unsplash.com/photo-1522336572468-97b06e8ef143?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Celebração de Páscoa no sítio" loading="lazy" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="festas-eventos" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-5 md:p-12 bg-[#FAF8F5] rounded-[2rem] md:rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Celebrações Memoráveis</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Festas & Eventos</h3>
                          </div>
                          <p className="text-base md:text-xl text-muted-foreground leading-relaxed font-medium max-w-[60ch]">O cenário ideal para casamentos, aniversários e eventos corporativos com suporte completo.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Salão de festas coberto",
                              "Área para cerimônias",
                              "Iluminação decorativa",
                              "Buffet parceiro opcional",
                              "Som e Projeção",
                              "Equipe de limpeza inclusa"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xs">
                                <CheckCircle className="text-[#FE8330] w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-full lg:w-[55%] group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl aspect-video lg:aspect-auto lg:h-[400px]">
                          <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Salão decorado para Festas e Eventos no sítio" loading="lazy" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="day-use" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-5 md:p-12 bg-[#FAF8F5] rounded-[2rem] md:rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Lazer e Diversão</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Day Use</h3>
                          </div>
                          <p className="text-base md:text-xl text-muted-foreground leading-relaxed font-medium max-w-[60ch]">Aproveite toda a nossa infraestrutura de lazer por um dia inteiro com amigos e família.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Acesso total à piscina",
                              "Campo de futebol liberado",
                              "Uso da área gourmet",
                              "Vestiários completos",
                              "Playground para crianças",
                              "Das 08h às 18h"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xs">
                                <CheckCircle className="text-[#FE8330] w-5 h-5 shrink-0" />
                                <span className="font-bold text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-full lg:w-[55%] group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl aspect-video lg:aspect-auto lg:h-[400px]">
                          <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Área de lazer e piscina para Day Use no sítio" loading="lazy" />
                        </div>
                      </div>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-32 bg-[#FAF8F5] relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-20 space-y-4">
              <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Memórias Inesquecíveis</h2>
              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-[60ch] mx-auto" data-aos="fade-up" data-aos-delay="100">Confira o depoimento de quem já viveu momentos especiais em nosso espaço.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              {(depoimentos || []).map((dep, i) => (
                <div key={i} className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] md:rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-5 md:space-y-8 border border-gray-100 hover-lift relative group" data-aos="fade-up" data-aos-delay={i*100}>
                  <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star className="w-16 h-16 fill-[#FE8330] text-[#FE8330]" />
                  </div>
                  <div className="flex text-[#FE8330] gap-1">
                    {Array.from({length: dep.estrelas}).map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-base md:text-xl font-medium leading-relaxed text-gray-700 relative z-10 max-w-[60ch]">"{dep.depoimento}"</p>
                  <div className="pt-6 border-t border-gray-50">
                    <p className="font-extrabold text-xl md:text-2xl tracking-tight">{dep.nome}</p>
                    <p className="text-[#FE8330] font-black text-[10px] uppercase tracking-[0.3em] mt-1">{dep.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="galeria" className="py-20 md:py-32 bg-white px-4 md:px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-left space-y-4">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-right">Galeria de Fotos</h2>
                <p className="text-sm md:text-lg text-muted-foreground font-medium" data-aos="fade-right" data-aos-delay="100">
                  {mode === "noite" ? "O sítio sob a luz suave da noite." : "Explore cada canto do nosso paraíso à luz do dia."}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                {mode === "noite" ? "🌙 Modo Noite" : "☀️ Modo Dia"}
              </span>
            </div>

            {seasonalPhotos.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl md:text-3xl font-black tracking-tight">
                  {activeSeason === "natal" ? "🎄 Natal no Sítio" : activeSeason === "pascoa" ? "🥚 Páscoa no Sítio" : "🎆 Ano Novo no Sítio"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {seasonalPhotos.map((photo, i) => (
                    <GalleryPhotoCard
                      key={`seasonal-${photo.url}-${i}`}
                      photo={photo}
                      index={i}
                      onClick={() => photo.tipo === "foto" && setSelectedImage(photo.url)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 py-8 md:py-20">
                {photos.map((photo, i) => (
                  <GalleryPhotoCard
                    key={`${photo.url}-${i}`}
                    photo={photo}
                    index={i}
                    onClick={() => photo.tipo === "foto" && setSelectedImage(photo.url)}
                  />
                ))}
              </div>
            </div>


          </div>
        </section>


        {/* FAQ */}
        <section className="py-20 md:py-32 px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-16 md:mb-20 space-y-4">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Dúvidas Frequentes</h2>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-[60ch] mx-auto" data-aos="fade-up" data-aos-delay="100">Tudo o que você precisa saber para planejar sua estadia.</p>
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
            <button className="absolute top-2 right-2 md:-top-4 md:-right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black shadow-2xl hover:scale-110 transition-transform" aria-label="Fechar imagem">×</button>
          </div>
        </div>
      )}

      <WhatsAppButton phoneNumber={hero?.whatsapp_number || ""} floating message={hero?.whatsapp_message} label="Falar com a Administração" />

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
              <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="py-2 inline-flex min-h-11 items-center hover:text-[#FE8330] transition-colors">Início</button></li>
              <li><button onClick={() => document.getElementById('infraestrutura')?.scrollIntoView({behavior: 'smooth'})} className="py-2 inline-flex min-h-11 items-center hover:text-[#FE8330] transition-colors">Estrutura</button></li>
              <li><button onClick={() => document.getElementById('galeria')?.scrollIntoView({behavior: 'smooth'})} className="py-2 inline-flex min-h-11 items-center hover:text-[#FE8330] transition-colors">Galeria</button></li>
              <li><button onClick={() => document.getElementById('calendario')?.scrollIntoView({behavior: 'smooth'})} className="py-2 inline-flex min-h-11 items-center hover:text-[#FE8330] transition-colors">Reservas</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Contato</h4>
            <p className="text-gray-300 font-medium">São Paulo, SP<br />Brasil</p>
            <p className="text-[#FE8330] font-bold text-lg">{hero?.whatsapp_number}</p>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Social</h4>
            <div className="flex gap-4">
              {/* Espaço para ícones sociais se necessário no futuro */}
            </div>
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
