import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import type { GalleryPhoto } from "@/lib/gallery";

/**
 * Card de galeria com deslocamento parallax ao rolar a página
 * (estilo grid editorial: colunas se movem em velocidades diferentes).
 */
export function GalleryPhotoCard({
  photo,
  index,
  fallbackUrl,
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  fallbackUrl?: string | null;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState(photo.url);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(photo.url);
    setHasError(false);
  }, [photo.url]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const depth = [80, 20, 110, 45][index % 4] ?? 60;
  const rawY = useTransform(scrollYProgress, [0, 1], [depth, -depth]);
  const y = useSpring(rawY, { stiffness: 120, damping: 24, mass: 0.4 });
  const rawScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);
  const scale = useSpring(rawScale, { stiffness: 120, damping: 26, mass: 0.4 });

  const handleImageError = () => {
    if (fallbackUrl && imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
    } else {
      setHasError(true);
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className="relative group cursor-pointer overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-lg hover:shadow-2xl transition-shadow duration-700 will-change-transform bg-gray-100"
      onClick={hasError ? undefined : onClick}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {photo.tipo === "video" ? (
        <motion.video
          src={imgSrc}
          style={{ scale }}
          className="w-full aspect-[4/5] object-cover bg-black"
          controls
          muted
          preload="metadata"
          playsInline
          onError={handleImageError}
        />
      ) : hasError ? (
        /* Fallback sem foto: retângulo com gradiente suave nas cores do site (sem texto e sem ícone) */
        <div 
          className="w-full aspect-[4/5] bg-gradient-to-br from-amber-50 via-orange-100 to-orange-200"
          aria-hidden="true"
        />
      ) : (
        <motion.img
          src={imgSrc}
          style={{ scale }}
          className="w-full aspect-[4/5] object-cover"
          alt=""
          loading="lazy"
          onError={handleImageError}
        />
      )}

      {photo.tipo !== "video" && !hasError && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <span className="text-white font-bold bg-[#FE8330] px-6 py-3 rounded-full shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            AMPLIAR
          </span>
        </div>
      )}
    </motion.div>
  );
}
