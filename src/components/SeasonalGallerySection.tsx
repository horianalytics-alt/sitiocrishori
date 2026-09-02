import React, { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSiteContent } from '@/lib/site-content.functions'
import { normalizeGallery, type GalleryPhoto } from '@/lib/gallery'
import { GalleryPhotoCard } from '@/components/GalleryPhotoCard'
import { getSeasonTypeFromName, type Season } from '@/components/SeasonalEffects'

type EventoSazonal = {
  id: string
  nome: string
  emoji: string
  ativo: boolean
  efeito_global_ativo: boolean
}

interface SeasonalGallerySectionProps {
  evento: EventoSazonal
  onEnter: (season: Season) => void
  onLeave: (season: Season) => void
  fallbackUrl?: string
  onSelectImage: (url: string) => void
}

export function SeasonalGallerySection({
  evento,
  onEnter,
  onLeave,
  fallbackUrl,
  onSelectImage,
}: SeasonalGallerySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const season = getSeasonTypeFromName(evento.nome)

  const sectionKey = `gallery_sazonal_${evento.id}`
  const { data: sectionData } = useQuery({
    queryKey: ['site-content', sectionKey],
    queryFn: () => getSiteContent({ data: sectionKey }),
  })

  const photos: GalleryPhoto[] = sectionData ? normalizeGallery(sectionData) : []

  useEffect(() => {
    const el = containerRef.current
    if (!el || season === 'none') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
            onEnter(season)
          } else {
            onLeave(season)
          }
        })
      },
      {
        threshold: [0, 0.15, 0.5],
        rootMargin: '0px 0px -10% 0px',
      }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      onLeave(season)
    }
  }, [season, onEnter, onLeave])

  // Se não houver fotos cadastradas ainda para este evento, não polui a galeria
  if (photos.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      id={`secao-sazonal-${evento.id}`}
      className="pt-10 sm:pt-14 border-t border-gray-100 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-3xl shadow-xs shrink-0">
            {evento.emoji}
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#FE8330]">
              Especial de Época
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#1E2229] tracking-tight">
              {evento.nome}
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          {photos.length} {photos.length === 1 ? 'mídia disponível' : 'mídias disponíveis'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {photos.map((photo, i) => (
          <GalleryPhotoCard
            key={`${photo.url}-${i}`}
            photo={photo}
            index={i}
            fallbackUrl={fallbackUrl}
            onClick={() => photo.tipo === 'foto' && onSelectImage(photo.url)}
          />
        ))}
      </div>
    </div>
  )
}
