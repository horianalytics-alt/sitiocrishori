import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import type { GalleryPhoto } from "@/lib/gallery";

/**
 * Card de galeria com deslocamento parallax ao rolar a página
 * (estilo grid editorial: colunas se movem em velocidades diferentes).
 */
export function GalleryPhotoCard({
  photo,
  index,
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const depth = [80, 20, 110, 45][index % 4] ?? 60;
  const rawY = useTransform(scrollYProgress, [0, 1], [depth, -depth]);
  const y = useSpring(rawY, { stiffness: 120, damping: 24, mass: 0.4 });
  const rawScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);
  const scale = useSpring(rawScale, { stiffness: 120, damping: 26, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className="relative group cursor-pointer overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-lg hover:shadow-2xl transition-shadow duration-700 will-change-transform"
      onClick={onClick}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {photo.tipo === "video" ? (
        <motion.video
          src={photo.url}
          style={{ scale }}
          className="w-full aspect-[4/5] object-cover bg-black"
          controls
          muted
          preload="metadata"
          playsInline
        />
      ) : (
        <motion.img
          src={photo.url}
          style={{ scale }}
          className="w-full aspect-[4/5] object-cover"
          alt={`Foto ${index + 1} do sítio de eventos`}
          loading="lazy"
        />
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
        <span className="text-white font-bold bg-[#FE8330] px-6 py-3 rounded-full shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          AMPLIAR
        </span>
      </div>
      <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {photo.tag === "dia" ? "☀️ Dia" : photo.tag === "noite" ? "🌙 Noite" : "📷 Ambos"}
      </span>
    </motion.div>
  );
}
