export type PhotoTag = "dia" | "noite" | "ambos";
export type MediaKind = "foto" | "video";
export type AmbienteTag = "piscina" | "area_gourmet" | "suites" | "salao" | "area_externa" | "geral";

export type GalleryPhoto = {
  url: string;
  tag: PhotoTag;
  tipo: MediaKind;
  ambiente?: AmbienteTag;
  is_tour?: boolean;
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
  { id: "gallery_natal", label: "🎄 Natal", season: "natal", nome: "Natal", emoji: "🎄" },
  { id: "gallery_ano_novo", label: "🎆 Ano Novo", season: "ano-novo", nome: "Ano Novo", emoji: "🎆" },
  { id: "gallery_pascoa", label: "🥚 Páscoa", season: "pascoa", nome: "Páscoa", emoji: "🥚" },
  { id: "gallery_halloween", label: "🎃 Halloween", season: "halloween", nome: "Halloween", emoji: "🎃" },
  { id: "gallery_carnaval", label: "🎭 Carnaval", season: "carnaval", nome: "Carnaval", emoji: "🎭" },
  { id: "gallery_festa_junina", label: "🎪 Festa Junina", season: "festa-junina", nome: "Festa Junina", emoji: "🎪" },
] as const;

export type SeasonalSectionId = (typeof SEASONAL_SECTIONS)[number]["id"];

export function getSectionKeyForEvento(evento: { id: string; nome: string }): string {
  const norm = (evento.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
  if (norm.includes("natal")) return "gallery_natal";
  if (norm.includes("pascoa")) return "gallery_pascoa";
  if (norm.includes("ano_novo") || norm.includes("reveillon")) return "gallery_ano_novo";
  if (norm.includes("carnaval")) return "gallery_carnaval";
  if (norm.includes("halloween") || norm.includes("bruxa")) return "gallery_halloween";
  if (norm.includes("junina") || norm.includes("sao_joao")) return "gallery_festa_junina";
  return `gallery_sazonal_${evento.id}`;
}

export const DEFAULT_SEASONAL_PHOTOS: Record<string, GalleryPhoto[]> = {
  natal: [
    { url: "https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1512474932049-78ac69ede12c?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1544253303-34e892cfa7eb?q=80&w=1200", tag: "ambos", tipo: "foto" },
  ],
  "ano-novo": [
    { url: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200", tag: "ambos", tipo: "foto" },
  ],
  pascoa: [
    { url: "https://images.unsplash.com/photo-1521967906867-14ec9d64bee8?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=1200", tag: "ambos", tipo: "foto" },
  ],
  halloween: [
    { url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200", tag: "ambos", tipo: "foto" },
  ],
  carnaval: [
    { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200", tag: "ambos", tipo: "foto" },
  ],
  "festa-junina": [
    { url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200", tag: "ambos", tipo: "foto" },
    { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200", tag: "ambos", tipo: "foto" },
  ],
};
