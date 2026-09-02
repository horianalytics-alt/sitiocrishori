import { useState, useRef } from "react"
import { Play } from "lucide-react"

interface TourVideoPlayerProps {
  videoUrl: string
}

export function TourVideoPlayer({ videoUrl }: TourVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="relative w-full h-full aspect-video bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        controls={isPlaying}
        controlsList="nodownload"
        preload="metadata"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Botão de Play Centralizado Grande e Visível (quando pausado/início) */}
      {!isPlaying && (
        <div
          onClick={handlePlay}
          className="absolute inset-0 bg-black/30 hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors z-20"
        >
          <button
            type="button"
            aria-label="Iniciar Tour Virtual"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FE8330] hover:bg-[#E06B1B] text-white flex items-center justify-center shadow-2xl shadow-[#FE8330]/50 transition-transform duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Play className="w-10 h-10 sm:w-12 sm:h-12 ml-1 text-white fill-white" />
          </button>
        </div>
      )}
    </div>
  )
}
