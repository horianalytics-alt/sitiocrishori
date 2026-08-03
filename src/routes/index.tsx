import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    title: "Sítio de Eventos | Festas, Finais de Semana e Day Use",
    meta: [
      { name: "description", content: "O cenário perfeito para seus melhores momentos. Piscina, área gourmet e suítes completas." },
      { property: "og:title", content: "Sítio de Eventos | Locação para Festas e Lazer" },
      { property: "og:description", content: "Estrutura premium para eventos e finais de semana inesquecíveis." },
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
      })
    ])
  },
  component: Index,
});

import { useSuspenseQuery } from "@tanstack/react-query";
import { getSiteContent, type HeroContent, type InfrastructureItem, type FAQItem } from "@/lib/site-content.functions";

function Index() {
  const { data: hero } = useSuspenseQuery({
    queryKey: ['site-content', 'hero'],
    queryFn: () => getSiteContent({ data: 'hero' }),
  }) as { data: HeroContent };

  const { data: infrastructure } = useSuspenseQuery({
    queryKey: ['site-content', 'infrastructure'],
    queryFn: () => getSiteContent({ data: 'infrastructure' }),
  }) as { data: InfrastructureItem[] };

  const { data: faq } = useSuspenseQuery({
    queryKey: ['site-content', 'faq'],
    queryFn: () => getSiteContent({ data: 'faq' }),
  }) as { data: FAQItem[] };

  const [activeTab, setActiveTab] = useState("finais-de-semana");

  useEffect(() => {
    // Import and init AOS only on client
    import('aos').then((AOS) => {
      AOS.init({
        duration: 1000,
        easing: 'ease-out-back',
        once: true,
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2229]">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-900/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000" 
          alt="Sítio de Eventos"
          className="absolute inset-0 w-full h-full object-cover anim-photo-reveal"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight" data-aos="zoom-out">
            {hero?.headline || "O cenário perfeito para os teus melhores momentos: Festas, Finais de Semana e Day Use."}
          </h1>
          <p className="text-lg md:text-xl text-white/90" data-aos="fade-up" data-aos-delay="200">
            {hero?.subheadline || "Estrutura completa com piscina, área gourmet, suítes e muito mais."}
          </p>
          <div data-aos="fade-up" data-aos-delay="400">
            <WhatsAppButton 
              phoneNumber={hero?.whatsapp_number || "00000000000"} 
              label={hero?.cta_text || "Verificar Disponibilidade"}
            />
          </div>
        </div>
      </section>

      {/* Infrastructure Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto overflow-hidden">
        <h2 className="text-3xl font-bold mb-12 text-center" data-aos="fade-up">Nossa Estrutura</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(infrastructure || []).map((item, idx) => (
            <div 
              key={idx} 
              className="group transition-card card-interactive bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
            >
              <img src={item.image} alt={item.title} className="w-full h-56 object-cover card-media" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rental Tabs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {["finais-de-semana", "festas-eventos", "day-use"].map((t) => (
                <TabsTrigger key={t} value={t} activeValue={activeTab} onClick={setActiveTab}>
                  {t.replace(/-/g, " ").toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="finais-de-semana" activeValue={activeTab}>
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100" data-aos="fade-left">
                <h3 className="text-2xl font-bold mb-4">Finais de Semana</h3>
                <p className="text-muted-foreground mb-6">Desfrute de dois dias completos com total privacidade e conforto.</p>
                <WhatsAppButton phoneNumber="00000000000" label="Consultar Valores" className="bg-[#1E2229] hover:bg-gray-800" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Perguntas Frequentes</h2>
        <Accordion className="space-y-4" data-aos="fade-up">
          {(faq || []).map((item, idx) => (
            <AccordionItem key={idx} title={item.question}>
              {item.answer}
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <WhatsAppButton phoneNumber="00000000000" floating />

      {/* Admin Quick Access Footer (Only for development/admin visibility) */}
      <footer className="py-6 border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-sm text-muted-foreground">
          <p>© 2026 Sítio de Eventos. Todos os direitos reservados.</p>
          <Link to="/admin" className="hover:text-[#FE8330] transition-colors">Acesso Administrativo</Link>
        </div>
      </footer>
    </div>
  );
}

