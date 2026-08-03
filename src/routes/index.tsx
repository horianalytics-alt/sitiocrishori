import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getSiteContent, getReservas, getDepoimentos, type HeroContent, type InfrastructureItem, type FAQItem } from "@/lib/site-content.functions";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Calendar as CalendarIcon, MapPin, Users, CheckCircle } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isWithinInterval, startOfDay } from "date-fns";
import "react-day-picker/dist/style.css";


const SITE_URL = "https://sitiocrishori.lovable.app";
const HERO_IMAGE = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000";

export const Route = createFileRoute("/")({
  head: () => {
    return {
      meta: [
        { title: "Sítio Para Eventos | Festas, Casamentos e Finais de Semana" },
        { name: "description", content: "Locação de sítio premium para eventos, festas e lazer. Piscina aquecida, campo de futebol e suítes completas." },
        { property: "og:title", content: "Sítio Para Eventos | O Cenário Perfeito" },
        { property: "og:url", content: `${SITE_URL}/` },
        { property: "og:image", content: HERO_IMAGE },
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
  const { data: galleryData } = useSuspenseQuery({ queryKey: ['site-content', 'gallery'], queryFn: () => getSiteContent({ data: 'gallery' }) }) as { data: string[] };


  const { data: reservas } = useSuspenseQuery({ queryKey: ['reservas'], queryFn: () => getReservas() }) as { data: any[] };
  const { data: depoimentos } = useSuspenseQuery({ queryKey: ['depoimentos'], queryFn: () => getDepoimentos() }) as { data: any[] };

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState("finais-de-semana");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"masonry" | "spiral" | "list">("spiral");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const SPIRAL_CONFIG = {
    itemsPerRotation: 3.5,
    radiusStart: 120,
    radiusGrowth: 180,
    cardWidth: 180,
    cardHeight: 140,
  };

  const getSpiralPositions = (count: number) => {
    const { itemsPerRotation, radiusStart, radiusGrowth } = SPIRAL_CONFIG;
    const ANGLE_STEP = (Math.PI * 2) / itemsPerRotation;
    return Array.from({ length: count }, (_, i) => {
      const angle = i * ANGLE_STEP - Math.PI / 2;
      const rotations = angle / (Math.PI * 2);
      const radius = radiusStart + rotations * radiusGrowth;
      const tangentAngle = angle + Math.PI / 2;
      const tiltDeg = (tangentAngle * 180) / Math.PI;
      const clampedTilt = ((tiltDeg % 12) - 6) * 0.5;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        tilt: clampedTilt,
      };
    });
  };

  const spiralPositions = getSpiralPositions((galleryData || []).length);

  useEffect(() => {
    import('aos').then((AOS) => { AOS.init({ duration: 1000, easing: 'ease-out-back', once: true }); });
  }, []);

  const reservedDays = (reservas || []).map(r => ({
    from: startOfDay(new Date(r.data_inicio)),
    to: startOfDay(new Date(r.data_fim))
  }));

  const isDayReserved = (day: Date) => reservedDays.some(range => isWithinInterval(startOfDay(day), { start: range.from, end: range.to }));



  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2229] selection:bg-[#FE8330] selection:text-white">
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[100svh] flex items-center justify-center py-20 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/60 z-10" />
          <div className="absolute inset-0 z-0">
            <img 
              src={HERO_IMAGE} 
              alt="Hero" 
              className="w-full h-full object-cover anim-photo-reveal scale-105" 
            />
          </div>
          <div className="relative z-20 text-center px-6 max-w-6xl mx-auto space-y-10">
            <div className="flex flex-wrap justify-center gap-3" data-aos="fade-down" data-aos-duration="1200">
              {(hero?.badges || ["Piscina Aquecida", "Campo", "Área Gourmet"]).map((b, i) => (
                <span 
                  key={i} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors cursor-default"
                >
                  • {b}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight" data-aos="zoom-out" data-aos-duration="1200">
              {hero?.headline}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/90 font-medium max-w-2xl mx-auto leading-relaxed px-4" data-aos="fade-up" data-aos-delay="400">
              {hero?.subheadline}
            </p>
            <div data-aos="fade-up" data-aos-delay="600" className="flex justify-center pt-8">
              <button 
                onClick={() => document.getElementById('calendario')?.scrollIntoView({behavior: 'smooth'})} 
                className="group relative px-8 py-5 md:px-14 md:py-7 bg-[#FE8330] text-lg md:text-xl font-bold rounded-full shadow-[0_20px_50px_rgba(254,131,48,0.3)] hover:scale-105 hover:shadow-[0_25px_60px_rgba(254,131,48,0.4)] transition-all duration-500 overflow-hidden"
              >
                <span className="relative z-10">{hero?.cta_text || "VERIFICAR DISPONIBILIDADE"}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-50">
            <div className="w-1 h-12 rounded-full bg-linear-to-b from-white to-transparent" />
          </div>
        </section>

        {/* Airbnb Style Calendar Section */}
        <section id="calendario" className="py-24 md:py-40 px-6 max-w-7xl mx-auto">
          <div className="bg-white p-10 md:p-20 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:flex-row gap-20 items-stretch" data-aos="fade-up">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight">Escolha suas datas</h2>
                <p className="text-sm md:text-lg text-muted-foreground">Selecione o período desejado no calendário para consultar valores e disponibilidade instantânea.</p>
              </div>
              <div className="inline-block p-4 bg-[#FAF8F5] rounded-3xl border">
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
            
            <div className="lg:w-[400px] w-full bg-[#FAF8F5] p-10 rounded-[2.5rem] border-2 border-[#FE8330]/10 space-y-8 sticky top-10">
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
        <section id="infraestrutura" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Estrutura de Alto Padrão</h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-4" data-aos="fade-up" data-aos-delay="100">Cada detalhe foi planejado para oferecer o máximo conforto e diversão para você e seus convidados.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {infrastructure?.map((item, i) => (
              <div key={i} className="card-premium rounded-[3rem] overflow-hidden group" data-aos="fade-up" data-aos-delay={i*100}>
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img src={item.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title} />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-3xl font-bold mb-2">{item.title}</h3>
                    <div className="w-12 h-1 bg-[#FE8330] rounded-full group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs Modalidades */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-5xl font-black tracking-tight mb-4">Escolha sua Modalidade</h2>
              <p className="text-sm md:text-lg text-muted-foreground font-medium px-4">Temos o formato ideal para cada tipo de celebração.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-4 justify-center bg-transparent mb-16">
                {[
                  { id: "finais-de-semana", label: "Finais de Semana" },
                  { id: "festas-eventos", label: "Festas & Eventos" },
                  { id: "day-use", label: "Day Use" }
                ].map(t => (
                  <TabsTrigger 
                    key={t.id} 
                    value={t.id} 
                    activeValue={activeTab}
                    onClick={setActiveTab}
                    className="px-6 py-4 md:px-10 md:py-5 rounded-full"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="relative overflow-hidden min-h-[500px]">
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
                      <div className="p-10 md:p-20 bg-[#FAF8F5] rounded-[4rem] border border-gray-100 flex flex-col md:flex-row gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Experiência Completa</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Finais de Semana</h3>
                          </div>
                          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">Privacidade absoluta e lazer total para sua família com pernoite completo e infraestrutura de hotel fazenda premium.</p>
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
                        <div className="md:w-[45%] group overflow-hidden rounded-[3rem] shadow-2xl">
                          <img src={HERO_IMAGE} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Finais de Semana" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="festas-eventos" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-10 md:p-20 bg-[#FAF8F5] rounded-[4rem] border border-gray-100 flex flex-col md:flex-row gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Celebrações Memoráveis</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Festas & Eventos</h3>
                          </div>
                          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">O cenário ideal para casamentos, aniversários e eventos corporativos com suporte completo.</p>
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
                        <div className="md:w-[45%] group overflow-hidden rounded-[3rem] shadow-2xl">
                          <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Festas e Eventos" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="day-use" activeValue={activeTab} className="mt-0 focus-visible:outline-none">
                      <div className="p-10 md:p-20 bg-[#FAF8F5] rounded-[4rem] border border-gray-100 flex flex-col md:flex-row gap-16 items-center shadow-inner">
                        <div className="flex-1 space-y-8">
                          <div className="space-y-4">
                            <span className="text-[#FE8330] font-black uppercase tracking-[0.3em] text-[10px]">Lazer e Diversão</span>
                            <h3 className="text-2xl md:text-5xl font-black tracking-tight">Day Use</h3>
                          </div>
                          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">Aproveite toda a nossa infraestrutura de lazer por um dia inteiro com amigos e família.</p>
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
                        <div className="md:w-[45%] group overflow-hidden rounded-[3rem] shadow-2xl">
                          <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Day Use" />
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
        <section className="py-32 bg-[#FAF8F5] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Memórias Inesquecíveis</h2>
              <p className="text-sm md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto px-4" data-aos="fade-up" data-aos-delay="100">Confira o depoimento de quem já viveu momentos especiais em nosso espaço.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {(depoimentos || []).map((dep, i) => (
                <div key={i} className="bg-white p-12 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-8 border border-gray-100 hover-lift relative group" data-aos="fade-up" data-aos-delay={i*100}>
                  <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star className="w-16 h-16 fill-[#FE8330] text-[#FE8330]" />
                  </div>
                  <div className="flex text-[#FE8330] gap-1">
                    {Array.from({length: dep.estrelas}).map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-lg md:text-xl font-medium leading-relaxed text-gray-700 relative z-10">"{dep.depoimento}"</p>
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
        <section id="galeria" className="py-32 bg-white px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-left space-y-4">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-right">Galeria de Fotos</h2>
                <p className="text-sm md:text-lg text-muted-foreground font-medium" data-aos="fade-right" data-aos-delay="100">Explore cada canto do nosso paraíso.</p>
              </div>
              
              <div className="flex items-center bg-[#FAF8F5] p-2 rounded-2xl border" data-aos="fade-left">
                {[
                  { id: "masonry", label: "Grade" },
                  { id: "spiral", label: "Espiral" },
                  { id: "list", label: "Lista" }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setViewMode(m.id as any)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                      viewMode === m.id 
                        ? "bg-[#FE8330] text-white shadow-lg" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[600px]">
              <AnimatePresence mode="wait">
                {viewMode === "masonry" && (
                  <motion.div 
                    key="masonry"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="columns-1 md:columns-3 lg:columns-4 gap-8 space-y-8"
                  >
                    {(galleryData || []).map((src, i) => (
                      <motion.div 
                        key={i} 
                        layoutId={`gallery-${i}`}
                        className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] shadow-lg hover:shadow-2xl transition-all duration-700" 
                        onClick={() => setSelectedImage(src)}
                      >
                        <img src={src} className="w-full h-auto object-cover transition-all duration-1000 group-hover:scale-110" alt="Galeria" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="text-white font-bold bg-[#FE8330] px-8 py-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">AMPLIAR</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {viewMode === "spiral" && (
                  <motion.div 
                    key="spiral"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative h-[700px] flex items-center justify-center"
                  >
                    {(galleryData || []).map((src, i) => {
                      const pos = spiralPositions[i];
                      if (!pos) return null;
                      return (
                        <motion.div
                          key={i}
                          layoutId={`gallery-${i}`}
                          className="absolute cursor-pointer rounded-2xl overflow-hidden border-4 border-white shadow-2xl group"
                          style={{
                            width: SPIRAL_CONFIG.cardWidth,
                            height: SPIRAL_CONFIG.cardHeight,
                            left: "50%",
                            top: "50%",
                            zIndex: (galleryData || []).length - i
                          }}
                          animate={{
                            x: pos.x,
                            y: pos.y,
                            rotate: pos.tilt,
                          }}
                          initial={{ x: 0, y: 0, rotate: 0 }}
                          style={{
                            width: SPIRAL_CONFIG.cardWidth,
                            height: SPIRAL_CONFIG.cardHeight,
                            left: "50%",
                            top: "50%",
                            translateX: "-50%",
                            translateY: "-50%",
                            zIndex: (galleryData || []).length - i
                          }}

                          whileHover={{ scale: 1.1, zIndex: 50, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 100, damping: 20 }}

                          onClick={() => setSelectedImage(src)}
                        >
                          <img src={src} className="w-full h-full object-cover" alt="Espiral" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {viewMode === "list" && (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-3xl mx-auto space-y-4"
                  >
                    {(galleryData || []).map((src, i) => (
                      <motion.div
                        key={i}
                        layoutId={`gallery-${i}`}
                        className="flex items-center justify-between p-6 bg-[#FAF8F5] rounded-3xl border hover:border-[#FE8330]/30 transition-all group cursor-pointer"
                        onClick={() => setSelectedImage(src)}
                        whileHover={{ x: 10 }}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                            <img src={src} className="w-full h-full object-cover" alt="Thumb" />
                          </div>
                          <span className="text-xl font-black text-gray-700">Foto #{i + 1}</span>
                        </div>
                        <span className="text-[#FE8330] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Visualizar →</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>


        {/* FAQ */}
        <section className="py-32 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight" data-aos="fade-up">Dúvidas Frequentes</h2>
            <p className="text-sm md:text-lg text-muted-foreground font-medium px-4" data-aos="fade-up" data-aos-delay="100">Tudo o que você precisa saber para planejar sua estadia.</p>
          </div>
          <Accordion className="space-y-6">
            {(faq || []).map((item, i) => (
              <AccordionItem key={i} title={item.question} className="bg-white px-10 py-4 rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#FE8330]/20 transition-colors">
                <div className="text-lg text-muted-foreground leading-relaxed pt-2">{item.answer}</div>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-xl transition-all" onClick={() => setSelectedImage(null)}>
          <div className="relative group max-w-7xl max-h-[90vh]">
            <img src={selectedImage} className="w-full h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)]" alt="Visualização" />
            <button className="absolute -top-4 -right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black shadow-2xl hover:scale-110 transition-transform">×</button>
          </div>
        </div>
      )}

      <WhatsAppButton phoneNumber={hero?.whatsapp_number || ""} floating message={hero?.whatsapp_message} label="Falar com a Administração" />

      <footer className="py-32 bg-[#1E2229] text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-[#FE8330] tracking-tight">Sítio de Eventos</h2>
            <p className="text-gray-400 text-lg leading-relaxed font-medium">O cenário perfeito para transformar seus momentos em memórias inesquecíveis.</p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Navegação</h4>
            <ul className="space-y-4 font-medium text-gray-300">
              <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#FE8330] transition-colors">Início</button></li>
              <li><button onClick={() => document.getElementById('infraestrutura')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#FE8330] transition-colors">Estrutura</button></li>
              <li><button onClick={() => document.getElementById('galeria')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#FE8330] transition-colors">Galeria</button></li>
              <li><button onClick={() => document.getElementById('calendario')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#FE8330] transition-colors">Reservas</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Contato</h4>
            <p className="text-gray-300 font-medium">São Paulo, SP<br />Brasil</p>
            <p className="text-[#FE8330] font-bold text-lg">{hero?.whatsapp_number}</p>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-widest text-[#FE8330]/60">Admin</h4>
            <Link to="/admin" className="inline-block text-xs text-gray-500 hover:text-white border border-gray-700 px-6 py-2 rounded-full transition-all">Acesso Restrito</Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 text-center text-gray-500 text-sm">
          <p>© 2026 Sítio de Eventos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default Index;
