import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getSiteContent, type HeroContent, type InfrastructureItem, type FAQItem } from "@/lib/site-content.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    title: "Sítio Para Eventos | Festas, Casamentos e Finais de Semana",
    meta: [
      { name: "description", content: "Locação de sítio premium para eventos, festas, casamentos e lazer em família. Piscina aquecida, campo de futebol, área gourmet e suítes completas." },
      { property: "og:title", content: "Sítio Para Eventos | O Cenário Perfeito Para Seus Momentos Especiais" },
      { property: "og:description", content: "Estrutura premium para casamentos, eventos corporativos e finais de semana inesquecíveis. Reserve sua data!" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'hero'],
        queryFn: () => getSiteContent({ data: 'hero' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'infrastructure'],
        queryFn: () => getSiteContent({ data: 'infrastructure' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'faq'],
        queryFn: () => getSiteContent({ data: 'faq' }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ['site-content', 'gallery'],
        queryFn: () => getSiteContent({ data: 'gallery' }),
      })
    ])
  },
  component: Index,
});

function Index() {
  const { data: hero } = useSuspenseQuery({
    queryKey: ['site-content', 'hero'],
    queryFn: () => getSiteContent({ data: 'hero' }),
  }) as { data: HeroContent & { badges?: string[] } };

  const { data: infrastructure } = useSuspenseQuery({
    queryKey: ['site-content', 'infrastructure'],
    queryFn: () => getSiteContent({ data: 'infrastructure' }),
  }) as { data: InfrastructureItem[] };

  const { data: faq } = useSuspenseQuery({
    queryKey: ['site-content', 'faq'],
    queryFn: () => getSiteContent({ data: 'faq' }),
  }) as { data: FAQItem[] };

  const [activeTab, setActiveTab] = useState("finais-de-semana");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    import('aos').then((AOS) => {
      AOS.init({
        duration: 1000,
        easing: 'ease-out-back',
        once: true,
      });
    });
  }, []);

  const { data: galleryData } = useSuspenseQuery({
    queryKey: ['site-content', 'gallery'],
    queryFn: () => getSiteContent({ data: 'gallery' }),
  }) as { data: string[] };

  const galleryImages = galleryData && galleryData.length > 0 ? galleryData : [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800",
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800",
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2229]">
      {/* Main Content Area */}
      <main>
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000" 
            alt="Sítio de Eventos"
            className="w-full h-full object-cover anim-photo-reveal"
          />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-8">
          <div className="flex flex-wrap justify-center gap-3 mb-4" data-aos="fade-down">
            {(hero?.badges || ["Piscina Aquecida", "Campo de Futebol", "Área Gourmet", "Pernoite"]).map((badge, i) => (
              <span key={i} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
                • {badge}
              </span>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold text-white leading-tight" data-aos="zoom-out">
            {hero?.headline || "O cenário perfeito para os teus melhores momentos."}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 font-light max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
            {hero?.subheadline || "Eventos, finais de semana e Day Use inesquecíveis."}
          </p>
          
          <div data-aos="fade-up" data-aos-delay="400" className="flex justify-center pt-4">
            <WhatsAppButton 
              phoneNumber={hero?.whatsapp_number || "00000000000"} 
              label={hero?.cta_text || "Verificar Disponibilidade de Data"}
              message={hero?.whatsapp_message}
              className="px-10 py-5 text-lg shadow-xl animate-pulse"
            />
          </div>
        </div>
      </section>

      {/* Infrastructure Grid */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold" data-aos="fade-up">Visão Geral da Infraestrutura</h2>
          <p className="text-muted-foreground text-lg" data-aos="fade-up" data-aos-delay="100">Cada detalhe pensado para o seu conforto e lazer.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {(infrastructure || []).map((item, idx) => (
            <div 
              key={idx} 
              className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/50"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-[#FE8330] transition-colors">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Immersive Gallery / Lookbook */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-aos="fade-up">Galeria Imersiva</h2>
            <p className="text-muted-foreground text-lg" data-aos="fade-up">Sinta a atmosfera do nosso paraíso.</p>
          </div>
          
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {galleryImages.filter(src => src && src.trim() !== "").map((src, i) => (
              <div 
                key={i} 
                className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all hover:-translate-y-2 hover:shadow-xl"
                onClick={() => setSelectedImage(src)}
                data-aos="fade-up"
                data-aos-delay={i * 50}
              >
                <img 
                  src={src} 
                  alt={`Galeria ${i}`} 
                  className="w-full h-auto object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement?.classList.add('hidden');
                  }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">Ampliar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="Enlarged" />
          <button className="absolute top-8 right-8 text-white text-4xl">&times;</button>
        </div>
      )}

      {/* Rental Type Tabs */}
      <section className="py-24 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-aos="fade-up">Tipos de Locação</h2>
            <p className="text-muted-foreground text-lg" data-aos="fade-up">A modalidade ideal para cada necessidade.</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/50 border border-gray-200 p-2 h-auto rounded-3xl mb-12 flex-wrap sm:flex-nowrap">
              <TabsTrigger value="finais-de-semana" activeValue={activeTab} onClick={setActiveTab} className="flex-1 py-4 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-[#FE8330] data-[state=active]:text-white rounded-2xl transition-all">
                Finais de Semana
              </TabsTrigger>
              <TabsTrigger value="festas-eventos" activeValue={activeTab} onClick={setActiveTab} className="flex-1 py-4 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-[#FE8330] data-[state=active]:text-white rounded-2xl transition-all">
                Festas & Casamentos
              </TabsTrigger>
              <TabsTrigger value="day-use" activeValue={activeTab} onClick={setActiveTab} className="flex-1 py-4 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-[#FE8330] data-[state=active]:text-white rounded-2xl transition-all">
                Day Use
              </TabsTrigger>
              <TabsTrigger value="final-de-ano" activeValue={activeTab} onClick={setActiveTab} className="flex-1 py-4 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-[#FE8330] data-[state=active]:text-white rounded-2xl transition-all">
                Feriados & Réveillon
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="finais-de-semana" activeValue={activeTab}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center" data-aos="fade-up">
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold">Finais de Semana & Feriados</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Privacidade total para você e sua família. Check-in na sexta e check-out no domingo.</p>
                  <ul className="grid grid-cols-2 gap-3 text-sm font-medium">
                    <li>✓ Pernoite para até 20 pessoas</li>
                    <li>✓ Acesso total à área de lazer</li>
                    <li>✓ Estacionamento privativo</li>
                    <li>✓ Cozinha equipada</li>
                  </ul>
                  <div className="pt-6">
                    <WhatsAppButton phoneNumber={hero?.whatsapp_number || "00000000000"} label="Consultar Valores" message={hero?.whatsapp_message} className="bg-[#1E2229] hover:bg-gray-800" />
                  </div>
                </div>
                <div className="md:w-1/3 w-full">
                  <img src="https://images.unsplash.com/photo-1520245647217-b48632c0c7b7?q=80&w=600" className="rounded-3xl shadow-lg w-full" alt="Finais de semana" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="festas-eventos" activeValue={activeTab}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center" data-aos="fade-up">
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold">Festas & Casamentos</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">O cenário de sonhos para celebrar datas marcantes.</p>
                  <ul className="grid grid-cols-2 gap-3 text-sm font-medium">
                    <li>✓ Capacidade para 150 convidados</li>
                    <li>✓ Gazebo para cerimônias</li>
                    <li>✓ Área de buffet integrada</li>
                    <li>✓ Banheiros acessíveis</li>
                  </ul>
                  <div className="pt-6">
                    <WhatsAppButton phoneNumber={hero?.whatsapp_number || "00000000000"} label="Solicitar Orçamento" message={hero?.whatsapp_message} className="bg-[#1E2229] hover:bg-gray-800" />
                  </div>
                </div>
                <div className="md:w-1/3 w-full">
                  <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600" className="rounded-3xl shadow-lg w-full" alt="Festas" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="day-use" activeValue={activeTab}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center" data-aos="fade-up">
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold">Day Use</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Um dia de lazer completo sem precisar pernoitar.</p>
                  <ul className="grid grid-cols-2 gap-3 text-sm font-medium">
                    <li>✓ Horário: 08:00 às 18:00</li>
                    <li>✓ Churrasqueira e Piscina</li>
                    <li>✓ Campo e Vestiários</li>
                    <li>✓ Playground</li>
                  </ul>
                  <div className="pt-6">
                    <WhatsAppButton phoneNumber={hero?.whatsapp_number || "00000000000"} label="Reservar meu dia" message={hero?.whatsapp_message} className="bg-[#1E2229] hover:bg-gray-800" />
                  </div>
                </div>
                <div className="md:w-1/3 w-full">
                  <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=600" className="rounded-3xl shadow-lg w-full" alt="Day Use" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="final-de-ano" activeValue={activeTab}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center" data-aos="fade-up">
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold">Natal, Réveillon & Carnaval</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Pacotes exclusivos para as datas mais esperadas do ano.</p>
                  <ul className="grid grid-cols-2 gap-3 text-sm font-medium">
                    <li>✓ Pacotes de 4 a 5 dias</li>
                    <li>✓ Ceia opcional</li>
                    <li>✓ Decoração temática</li>
                    <li>✓ Conforto absoluto</li>
                  </ul>
                  <div className="pt-6">
                    <WhatsAppButton phoneNumber={hero?.whatsapp_number || "00000000000"} label="Consultar Pacotes" message={hero?.whatsapp_message} className="bg-[#1E2229] hover:bg-gray-800" />
                  </div>
                </div>
                <div className="md:w-1/3 w-full">
                  <img src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600" className="rounded-3xl shadow-lg w-full" alt="Feriados" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" data-aos="fade-up">Dúvidas Frequentes</h2>
          <p className="text-muted-foreground text-lg" data-aos="fade-up">Informações rápidas para facilitar seu planejamento.</p>
        </div>
        <Accordion className="space-y-6" data-aos="fade-up">
          {(faq || []).map((item, idx) => (
            <AccordionItem 
              key={idx} 
              title={item.question}
              className="px-4 border-none shadow-md hover:shadow-lg transition-shadow bg-white rounded-2xl"
            >
              <div className="py-4 text-lg">
                {item.answer}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      </main>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton 
        phoneNumber={hero?.whatsapp_number || "00000000000"} 
        floating 
        message={hero?.whatsapp_message}
        label="Fale direto com a administração"
      />

      {/* Footer */}
      <footer className="py-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#FE8330] mb-2">Sítio de Eventos</h3>
            <p className="text-muted-foreground">© 2026 Todos os direitos reservados.</p>
          </div>
          <div className="flex gap-6">
            {/* Admin link removed from public view as requested */}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;
