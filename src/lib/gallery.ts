export type PhotoTag = "dia" | "noite" | "ambos";

export type GalleryPhoto = {
  url: string;
  tag: PhotoTag;
};

/** Aceita o formato antigo (array de strings) e o novo (array de objetos). */
export function normalizeGallery(data: unknown): GalleryPhoto[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item): GalleryPhoto | null => {
      if (typeof item === "string") return { url: item, tag: "ambos" };
      if (item && typeof item === "object" && typeof (item as any).url === "string") {
        const tag = (item as any).tag;
        return {
          url: (item as any).url,
          tag: tag === "dia" || tag === "noite" ? tag : "ambos",
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
