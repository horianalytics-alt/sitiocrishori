import { MapPin, Car, Clock, ExternalLink } from "lucide-react"

interface ComoChegarProps {
  config?: {
    mapa_embed_url?: string | null
    mapa_texto?: string | null
    mapa_cidade?: string | null
    mapa_distancia?: string | null
    mapa_tempo?: string | null
    mapa_link_direto?: string | null
  }
}

export function ComoChegarSection({ config }: ComoChegarProps) {
  // Extrai a URL se o usuário colou a tag <iframe> inteira
  const rawEmbed = config?.mapa_embed_url || ""
  const match = rawEmbed.match(/src=["']([^"']+)["']/)
  const extractedEmbed = match && match[1] ? match[1] : rawEmbed.trim()

  const cidade = config?.mapa_cidade || "Ibiúna, SP"
  const distancia = config?.mapa_distancia || "65 km de São Paulo"
  const tempo = config?.mapa_tempo || "50 min da capital"

  // Link direto para abrir no Google Maps:
  // 1. Usa o link direto colocado no admin (mapa_link_direto)
  // 2. Se o usuário colou um link direto no campo embed (ex: maps.app.goo.gl)
  // 3. Fallback: busca exata pelo Sítio Cris Hori na cidade
  const directMapUrl = 
    config?.mapa_link_direto?.trim() || 
    (!extractedEmbed.includes("/embed") && extractedEmbed.startsWith("http") ? extractedEmbed : "") ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Sítio Cris Hori " + cidade)}`

  // URL para exibição dentro do iframe:
  const embedUrl = extractedEmbed.includes("/embed")
    ? extractedEmbed
    : `https://maps.google.com/maps?q=${encodeURIComponent("Sítio Cris Hori " + cidade)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <section id="como-chegar" className="py-20 md:py-32 bg-[#FAF8F5] px-4 md:px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-10 md:space-y-12">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center space-y-3 max-w-2xl mx-auto" data-aos="fade-up">
          <span className="text-xs font-black tracking-widest uppercase text-[#FE8330]">
            Localização Privilegiada
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E2229] tracking-tight">
            Como Chegar
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-medium">
            {config?.mapa_texto || "Fácil acesso pelas principais rodovias pavimentadas, com tranquilidade e natureza a poucos minutos da capital."}
          </p>
        </div>

        {/* Card do Mapa com Informações */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-gray-100 overflow-hidden" data-aos="fade-up" data-aos-delay="100">
          
          {/* Iframe do Google Maps */}
          <div className="relative w-full h-[250px] md:h-[420px] bg-gray-100 overflow-hidden">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização no Google Maps"
                className="w-full h-full pointer-events-none md:pointer-events-auto"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold text-sm">
                📍 Mapa em configuração pelo painel admin.
              </div>
            )}

            {/* Overlay transparente no mobile para permitir toque que abre no Maps nativo sem travar scroll */}
            <a
              href={directMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden absolute inset-0 z-10"
              aria-label="Abrir mapa no Google Maps"
            />
          </div>

          {/* Três informações em linha + Botão de Abrir no Google Maps */}
          <div className="p-6 sm:p-8 md:p-10 space-y-8">
            
            {/* 3 Informações em linha (Cidade · Distância · Tempo) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              
              {/* 📍 Cidade */}
              <div className="flex items-center sm:justify-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FE8330] flex items-center justify-center text-xl shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                    Localização
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#1E2229]">
                    {cidade}
                  </span>
                </div>
              </div>

              {/* 🚗 Distância */}
              <div className="flex items-center sm:justify-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                    Distância de SP
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#1E2229]">
                    {distancia}
                  </span>
                </div>
              </div>

              {/* ⏱️ Tempo médio */}
              <div className="flex items-center sm:justify-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                    Tempo Médio
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#1E2229]">
                    {tempo}
                  </span>
                </div>
              </div>

            </div>

            {/* Botão de Ação: Abrir no Google Maps */}
            <div className="text-center pt-2 border-t border-gray-100">
              <a
                href={directMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-8 py-4 bg-[#FE8330] hover:bg-[#E06B1B] text-white font-black text-base rounded-2xl shadow-lg shadow-[#FE8330]/25 transition-all duration-300 active:scale-98 cursor-pointer"
              >
                <span>Abrir no Google Maps</span>
                <span className="text-lg">→</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
