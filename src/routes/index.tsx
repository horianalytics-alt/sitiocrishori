import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { getSiteContent, getDepoimentos, getConfigSitePublica, getDisponibilidadePublica, type HeroContent, type InfrastructureItem, type FAQItem } from "@/lib/site-content.functions";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SeasonalEffects, type Season, type SeasonalEffectsHandle } from "@/components/SeasonalEffects";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Star, Calendar as CalendarIcon, MapPin, CheckCircle, Sparkles } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isWithinInterval, startOfDay } from "date-fns";
import "react-day-picker/dist/style.css";
import { useDayNight } from "@/hooks/useDayNight";
import { DayNightToggle } from "@/components/DayNightToggle";
import { InfraImageLoop } from "@/components/InfraImageLoop";
import { GalleryPhotoCard } from "@/components/GalleryPhotoCard";
import { normalizeGallery, filterByMode, AMBIENTE_OPTIONS, type AmbienteTag } from "@/lib/gallery";
import { SimuladorOrcamento } from "@/components/SimuladorOrcamento";
import { LeadCapturePopup } from "@/components/LeadCapturePopup";

const SEASON_SECTION: Record<string, string> = { natal: "gallery_natal", pascoa: "gallery_pascoa", "ano-novo": "gallery_ano_novo" };
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

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState("finais-de-semana");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season>("none");
  const [ambienteFilter, setAmbienteFilter] = useState<string>("todos");
  
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const seasonalEffectsRef = useRef<SeasonalEffectsHandle>(null);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    import('aos').then((AOS) => { AOS.init({ duration: 1000, easing: 'ease-out-back', once: true }); });
  }, []);

  const { mode, toggle: toggleMode } = useDayNight();
  const allPhotos = filterByMode(normalizeGallery(galleryData), mode);
  const photos = useMemo(() => {
    if (ambienteFilter === "todos") return allPhotos;
    return allPhotos.filter(p => p.ambiente === ambienteFilter);
  }, [allPhotos, ambienteFilter]);

  const seasonSection = SEASON_SECTION[activeSeason] ?? null;
  const { data: seasonalData } = useQuery({
    queryKey: ['site-content', seasonSection],
    queryFn: () => getSiteContent({ data: seasonSection as string }),
    enabled: !!seasonSection,
  });
  const seasonalPhotos = seasonSection ? normalizeGallery(seasonalData) : [];

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

        {/* Reservas & Calendario */}
        <section id="calendario" className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="bg-white p-6 md:p-12 lg:p-20 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:flex-row gap-10 md:gap-20 items-center lg:items-start" data-aos="fade-up">
            
            {/* Calendário */}
            <div className="flex-1 space-y-8 w-full">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight">Verifique as datas livres</h2>
                <p className="text-base md:text-lg text-muted-foreground">O verde indica que estamos aguardando por você. Em vermelho, datas já fechadas.</p>
              </div>
              <div className="flex justify-center p-4 bg-[#FAF8F5] rounded-[2rem] border">
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
              </div>
              {config?.countdown_mensagem && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center text-orange-800 font-bold animate-pulse">
                  ⏰ {config.countdown_mensagem}
                </div>
              )}
            </div>
            
            {/* Simulador */}
            <div className="w-full lg:w-[450px]">
              <SimuladorOrcamento
                precoFesta={config?.preco_base_festa}
                precoFimSemana={config?.preco_base_fim_semana}
                adminPhone={config?.whatsapp_contato || "11999999999"}
                selectedDate={selectedRange?.from || null}
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

            {/* Filtros de Ambiente */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4" data-aos="fade-up">
              <button
                onClick={() => setAmbienteFilter("todos")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold border transition-all ${ambienteFilter === "todos" ? 'bg-[#FE8330] text-white border-[#FE8330]' : 'bg-gray-50 text-gray-500 hover:border-[#FE8330]/40'}`}
              >
                Todos
              </button>
              {AMBIENTE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAmbienteFilter(opt.value)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold border transition-all ${ambienteFilter === opt.value ? 'bg-[#FE8330] text-white border-[#FE8330]' : 'bg-gray-50 text-gray-500 hover:border-[#FE8330]/40'}`}
                >
                  {opt.label}
                </button>
              ))}
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

        {/* Mapa e Como Chegar */}
        {config?.mapa_embed_url && (
          <section className="py-20 md:py-32 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="bg-[#1E2229] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
                <div className="flex-1 p-10 md:p-16 lg:p-24 flex flex-col justify-center space-y-8 text-white">
                  <div className="w-16 h-16 bg-[#FE8330]/20 rounded-2xl flex items-center justify-center text-[#FE8330]">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight">Como Chegar</h2>
                  <p className="text-gray-300 text-lg leading-relaxed max-w-[40ch]">
                    {config.mapa_texto || "Nossa localização privilegiada garante o isolamento e tranquilidade que você busca, com fácil acesso pela rodovia principal."}
                  </p>
                </div>
                <div className="w-full lg:w-[50%] h-[400px] lg:h-auto bg-gray-200">
                  <iframe 
                    src={config.mapa_embed_url} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>
          </section>
        )}

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
