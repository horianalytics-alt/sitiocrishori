export type PhotoTag = "dia" | "noite" | "ambos";
export type MediaKind = "foto" | "video";
export type AmbienteTag = "piscina" | "area_gourmet" | "suites" | "salao" | "area_externa" | "geral";

export type GalleryPhoto = {
  url: string;
  tag: PhotoTag;
  tipo: MediaKind;
  ambiente?: AmbienteTag;
};

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_RE.test(url) || /(?:[?&])(?:path|p)=[^&]*\.(?:mp4|webm|mov|m4v)/i.test(url);
}

/** Aceita o formato antigo (array de strings) e o novo (array de objetos). */
export function normalizeGallery(data: unknown): GalleryPhoto[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item): GalleryPhoto | null => {
      if (typeof item === "string") {
        return { url: item, tag: "ambos", tipo: isVideoUrl(item) ? "video" : "foto" };
      }
      if (item && typeof item === "object" && typeof (item as any).url === "string") {
        const url = (item as any).url as string;
        const tag = (item as any).tag;
        const tipo = (item as any).tipo;
        const ambiente = (item as any).ambiente;
        const validAmbiente = AMBIENTE_OPTIONS.some((o) => o.value === ambiente)
          ? (ambiente as AmbienteTag)
          : undefined;
        return {
          url,
          tag: tag === "dia" || tag === "noite" ? tag : "ambos",
          tipo: tipo === "video" || tipo === "foto" ? tipo : isVideoUrl(url) ? "video" : "foto",
          ...(validAmbiente ? { ambiente: validAmbiente } : {}),
        };
      }
      return null;
    })
    .filter((p): p is GalleryPhoto => p !== null);
}

export function filterByMode(photos: GalleryPhoto[], mode: "dia" | "noite") {
  const filtered = photos.filter((p) => p.tag === "ambos" || p.tag === mode);
  return filtered.length > 0 ? filtered : photos;
}

export const TAG_OPTIONS: { value: PhotoTag; label: string }[] = [
  { value: "dia", label: "☀️ Dia" },
  { value: "noite", label: "🌙 Noite" },
  { value: "ambos", label: "📷 Ambos" },
];

export const AMBIENTE_OPTIONS: { value: AmbienteTag; label: string }[] = [
  { value: "piscina", label: "🏊 Piscina" },
  { value: "area_gourmet", label: "🍖 Área Gourmet" },
  { value: "suites", label: "🛏️ Suítes" },
  { value: "salao", label: "🎉 Salão" },
  { value: "area_externa", label: "🌿 Área Externa" },
  { value: "geral", label: "📍 Geral" },
];

export const SEASONAL_SECTIONS = [
  { id: "gallery_natal", label: "🎄 Natal", season: "natal" },
  { id: "gallery_pascoa", label: "🥚 Páscoa", season: "pascoa" },
  { id: "gallery_ano_novo", label: "🎆 Ano Novo", season: "ano-novo" },
] as const;

export type SeasonalSectionId = (typeof SEASONAL_SECTIONS)[number]["id"];
