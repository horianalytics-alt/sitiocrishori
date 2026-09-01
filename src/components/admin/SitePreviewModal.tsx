import { useState } from "react"
import { X } from "lucide-react"

export function SitePreviewModal({ onClose }: { onClose: () => void }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col">
      <div className="flex items-center justify-between gap-3 p-3 md:p-4">
        <div className="flex gap-2">
          {(["mobile", "desktop"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`min-h-11 px-4 rounded-xl text-sm font-bold transition-all ${
                device === d ? "bg-[#FE8330] text-white" : "bg-white/90 text-[#1E2229]"
              }`}
            >
              {d === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/90 text-[#1E2229] flex items-center justify-center"
          aria-label="Fechar pré-visualização"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-0 md:p-4">
        <div
          className={
            device === "mobile"
              ? "w-full h-full md:w-[390px] md:h-[844px] md:max-h-full md:rounded-[2rem] overflow-hidden bg-white md:shadow-2xl md:border-[8px] md:border-black"
              : "w-full h-full bg-white md:rounded-2xl overflow-hidden"
          }
        >
          <iframe src="/" title="Pré-visualização do site" className="w-full h-full border-0" />
        </div>
      </div>
    </div>
  )
}
