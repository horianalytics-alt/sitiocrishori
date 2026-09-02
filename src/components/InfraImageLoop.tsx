import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Passa as fotos do card de estrutura em loop suave. */
export function InfraImageLoop({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const list = images.filter(Boolean);

  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), 3500);
    return () => clearInterval(id);
  }, [list.length]);

  if (list.length === 0) return <div className="w-full h-full bg-gray-100" />;

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={list[index % list.length]}
          src={list[index % list.length]}
          alt={alt}
          loading="lazy"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
      </AnimatePresence>
      {list.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index % list.length ? "w-5 bg-[#FE8330]" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
