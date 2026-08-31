import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import type { DayNightMode } from "@/hooks/useDayNight";

export function DayNightToggle({ mode, onToggle }: { mode: DayNightMode; onToggle: () => void }) {
  const isNight = mode === "noite";
  return (
    <button
      onClick={onToggle}
      aria-label={isNight ? "Ativar Modo Dia" : "Ativar Modo Noite"}
      className="fixed top-4 right-4 md:top-6 md:right-6 z-[90] flex items-center gap-2 p-1.5 rounded-full backdrop-blur-xl border shadow-lg transition-colors duration-500 daynight-toggle"
    >
      <span className="relative flex items-center w-[70px] h-9 md:w-20 md:h-10">
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={`absolute top-0 h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shadow-md ${
            isNight ? "bg-[#F2C879] text-[#1B1712] left-[calc(100%-2.25rem)] md:left-[calc(100%-2.5rem)]" : "bg-[#FE8330] text-white left-0"
          }`}
        >
          {isNight ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
        </motion.span>
        <span className="absolute inset-0 flex items-center justify-between px-2.5 text-[10px] font-black uppercase tracking-widest opacity-60">
          <span className={isNight ? "" : "opacity-0"}>Dia</span>
          <span className={isNight ? "opacity-0" : ""}>Noite</span>
        </span>
      </span>
    </button>
  );
}
