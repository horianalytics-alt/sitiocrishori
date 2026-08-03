import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getSiteContent, getReservas, getDepoimentos, type HeroContent, type InfrastructureItem, type FAQItem } from "@/lib/site-content.functions";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    import('aos').then((AOS) => { AOS.init({ duration: 1000, easing: 'ease-out-back', once: true }); });
  }, []);

  const reservedDays = (reservas || []).map(r => ({
    from: startOfDay(new Date(r.data_inicio)),
    to: startOfDay(new Date(r.data_fim))
  }));

  const isDayReserved = (day: Date) => reservedDays.some(range => isWithinInterval(startOfDay(day), { start: range.from, end: range.to }));


  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2229]">
      <main>
        {/* Hero Section */}
        <section className="relative h-[95vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 z-0">
            <img src={HERO_IMAGE} alt="Hero" className="w-full h-full object-cover anim-photo-reveal" />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-wrap justify-center gap-3" data-aos="fade-down">
              {(hero?.badges || ["Piscina Aquecida", "Campo", "Área Gourmet"]).map((b, i) => (
                <span key={i} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold">• {b}</span>
              ))}
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white leading-tight" data-aos="zoom-out">{hero?.headline}</h1>
            <p className="text-xl md:text-3xl text-white/90 font-light max-w-3xl mx-auto" data-aos="fade-up">{hero?.subheadline}</p>
            <div data-aos="fade-up" data-aos-delay="400" className="flex justify-center pt-6">
              <button onClick={() => document.getElementById('calendario')?.scrollIntoView({behavior: 'smooth'})} className="px-12 py-6 bg-[#FE8330] text-white text-xl font-black rounded-full shadow-2xl hover:scale-105 transition-all animate-bounce-slow">{hero?.cta_text || "VERIFICAR DISPONIBILIDADE"}</button>
            </div>
          </div>
        </section>

        {/* Airbnb Style Calendar Section */}
        <section id="calendario" className="py-32 px-4 max-w-6xl mx-auto">
          <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col lg:flex-row gap-16 items-start" data-aos="fade-up">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Escolha suas datas</h2>
                <p className="text-lg text-muted-foreground">Selecione o período desejado no calendário para consultar valores e disponibilidade instantânea.</p>
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
        <section id="infraestrutura" className="py-24 px-4 max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-16" data-aos="fade-up">Estrutura Completa</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {infrastructure?.map((item, i) => (
              <div key={i} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:-translate-y-4 transition-all duration-500 border border-gray-100" data-aos="fade-up" data-aos-delay={i*100}>
                <div className="aspect-[4/3] overflow-hidden"><img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /></div>
                <div className="p-8 space-y-2">
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs Modalidades */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-black text-center mb-16">Modalidades</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-4 justify-center bg-transparent mb-12">
                {["finais-de-semana", "festas-eventos", "day-use"].map(t => (
                  <TabsTrigger key={t} value={t} activeValue={activeTab} onClick={setActiveTab} className="px-8 py-4 rounded-full font-bold uppercase tracking-widest border data-[state=active]:bg-[#FE8330] data-[state=active]:text-white transition-all">{t.replace('-', ' ')}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="finais-de-semana" activeValue={activeTab}>
                <div className="p-10 bg-[#FAF8F5] rounded-[3rem] border flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-4xl font-black">Finais de Semana</h3>
                    <p className="text-xl text-muted-foreground">Privacidade e lazer total para sua família com pernoite completo.</p>
                    <ul className="space-y-3 font-bold">
                      <li className="flex items-center gap-2"><CheckCircle className="text-[#FE8330] w-5 h-5" /> Até 20 pessoas no pernoite</li>
                      <li className="flex items-center gap-2"><CheckCircle className="text-[#FE8330] w-5 h-5" /> Cozinha industrial completa</li>
                      <li className="flex items-center gap-2"><CheckCircle className="text-[#FE8330] w-5 h-5" /> Suítes climatizadas</li>
                    </ul>
                  </div>
                  <div className="md:w-1/3"><img src={HERO_IMAGE} className="rounded-3xl shadow-xl" /></div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-[#FAF8F5]">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-black text-center mb-16">O que dizem nossos clientes</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {(depoimentos || []).map((dep, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-xl space-y-6 border border-gray-100" data-aos="fade-up" data-aos-delay={i*100}>
                  <div className="flex text-[#FE8330]">{Array.from({length: dep.estrelas}).map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}</div>
                  <p className="text-lg italic leading-relaxed text-gray-600">"{dep.depoimento}"</p>
                  <div>
                    <p className="font-black text-xl">{dep.nome}</p>
                    <p className="text-[#FE8330] font-bold text-xs uppercase tracking-widest">{dep.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Masonry */}
        <section className="py-24 bg-white px-4">
          <div className="max-w-7xl mx-auto columns-1 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {(galleryData || []).map((src, i) => (
              <div key={i} className="relative group cursor-pointer overflow-hidden rounded-3xl" onClick={() => setSelectedImage(src)} data-aos="fade-up">
                <img src={src} className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white font-black bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/40">VER</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-4 max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">Dúvidas Frequentes</h2>
          <Accordion className="space-y-4">
            {(faq || []).map((item, i) => (
              <AccordionItem key={i} title={item.question} className="bg-white px-8 py-2 rounded-3xl shadow-sm border-none">{item.answer}</AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}

      <WhatsAppButton phoneNumber={hero?.whatsapp_number || ""} floating message={hero?.whatsapp_message} label="Falar com a Administração" />

      <footer className="py-20 bg-[#1E2229] text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-black text-[#FE8330]">Sítio de Eventos</h2>
            <p className="text-gray-400">O cenário perfeito para seus melhores momentos.</p>
          </div>
          <div className="flex gap-8"><Instagram className="w-8 h-8 cursor-pointer hover:text-[#FE8330] transition-all" /><Link to="/admin" className="text-xs text-gray-600 hover:text-white transition-all">Painel Restrito</Link></div>
        </div>
      </footer>
    </div>
  );
}

export default Index;
