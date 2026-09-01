import { useRef, useState } from "react"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { TAG_OPTIONS, type GalleryPhoto, type PhotoTag } from "@/lib/gallery"

type QueueItem = { name: string; progress: number; error?: string }

const MAX_IMAGE = 10 * 1024 * 1024
const MAX_VIDEO = 200 * 1024 * 1024

async function uploadToStorage(
  file: File,
  folder: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  const url = import.meta.env['VITE_SUPABASE_URL']
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error("Sessão expirada. Entre novamente no painel.")

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${url}/storage/v1/object/midia-sitio/${path}`)
    xhr.setRequestHeader("authorization", `Bearer ${token}`)
    xhr.setRequestHeader("apikey", key)
    xhr.setRequestHeader("x-upsert", "false")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Falha no envio (${xhr.status})`))
    xhr.onerror = () => reject(new Error("Falha de rede durante o envio"))
    const form = new FormData()
    form.append("file", file)
    xhr.send(form)
  })

  return `/api/public/media?path=${encodeURIComponent(path)}`
}

export function MediaManager({
  items,
  onChange,
  folder,
  showTags = true,
  onUploadingChange,
}: {
  items: GalleryPhoto[]
  onChange: (items: GalleryPhoto[]) => void
  folder: string
  showTags?: boolean
  onUploadingChange?: (uploading: boolean) => void
}) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const uploading = queue.some((q) => q.progress < 100 && !q.error)

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = ""

    setQueue(files.map((f) => ({ name: f.name, progress: 0 })))
    onUploadingChange?.(true)

    const added: GalleryPhoto[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!
      const isVideo = file.type.startsWith("video/")
      const isImage = file.type.startsWith("image/")
      try {
        if (!isVideo && !isImage) throw new Error("Formato não suportado")
        if (isImage && file.size > MAX_IMAGE) throw new Error("Imagem maior que 10MB")
        if (isVideo && file.size > MAX_VIDEO) throw new Error("Vídeo maior que 200MB")

        const url = await uploadToStorage(file, folder, (pct) =>
          setQueue((q) => q.map((it, idx) => (idx === i ? { ...it, progress: pct } : it))),
        )
        added.push({ url, tag: "ambos", tipo: isVideo ? "video" : "foto" })
        setQueue((q) => q.map((it, idx) => (idx === i ? { ...it, progress: 100 } : it)))
      } catch (err: any) {
        setQueue((q) =>
          q.map((it, idx) => (idx === i ? { ...it, progress: 100, error: err.message } : it)),
        )
        toast.error(`${file.name}: ${err.message}`)
      }
    }

    if (added.length) {
      onChange([...items, ...added])
      toast.success(`${added.length} arquivo(s) enviado(s)!`)
    }
    onUploadingChange?.(false)
    setTimeout(() => setQueue([]), 2500)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={`${item.url}-${i}`} className="w-full rounded-2xl border bg-gray-50 overflow-hidden">
            <div className="relative w-full">
              {item.tipo === "video" ? (
                <video
                  src={item.url}
                  controls
                  muted
                  preload="metadata"
                  className="w-full h-[180px] object-cover bg-black"
                />
              ) : (
                <img src={item.url} className="w-full h-[180px] object-cover" alt={`Mídia ${i + 1}`} />
              )}
              <span className="absolute top-2 left-2 text-xs bg-black/60 text-white rounded-full px-2 py-1">
                {item.tipo === "video" ? "🎬" : "🖼️"}
              </span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="absolute top-2 right-2 w-9 h-9 bg-red-500 text-white flex items-center justify-center rounded-full shadow-md"
                aria-label="Excluir mídia"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {showTags && (
              <div className="p-2 flex flex-row gap-2">
                {TAG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onChange(
                        items.map((p, idx) =>
                          idx === i ? { ...p, tag: opt.value as PhotoTag } : p,
                        ),
                      )
                    }
                    className={`flex-1 min-w-0 min-h-10 flex items-center justify-center gap-1 text-xs font-bold rounded-lg border transition-all whitespace-nowrap px-1 ${
                      item.tag === opt.value
                        ? "bg-[#FE8330] text-white border-[#FE8330]"
                        : "bg-white text-gray-500 hover:border-[#FE8330]/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <label className="w-full min-h-[180px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-center px-3 cursor-pointer hover:border-[#FE8330] transition-all">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-[#FE8330] animate-spin" />
          ) : (
            <Plus className="w-8 h-8 text-gray-300" />
          )}
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Enviar fotos ou vídeos
          </span>
          <span className="text-[10px] text-gray-400">Você pode selecionar vários arquivos</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFiles}
          />
        </label>
      </div>

      {queue.length > 0 && (
        <div className="space-y-2 bg-gray-50 rounded-2xl p-4 border">
          {queue.map((q, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between gap-3 text-xs font-bold">
                <span className="truncate min-w-0">{q.name}</span>
                <span className={q.error ? "text-red-500 shrink-0" : "text-[#FE8330] shrink-0"}>
                  {q.error ? "Erro" : `${q.progress}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${q.error ? "bg-red-400" : "bg-[#FE8330]"}`}
                  style={{ width: `${q.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
