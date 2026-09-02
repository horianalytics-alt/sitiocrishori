import { useRef, useState } from "react"
import { Trash2, Plus, Loader2, UploadCloud, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { TAG_OPTIONS, AMBIENTE_OPTIONS, type GalleryPhoto, type PhotoTag, type AmbienteTag } from "@/lib/gallery"

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
  showAmbiente = false,
  onUploadingChange,
}: {
  items: GalleryPhoto[]
  onChange: (items: GalleryPhoto[]) => void
  folder: string
  showTags?: boolean
  showAmbiente?: boolean
  onUploadingChange?: (uploading: boolean) => void
}) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null)
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
        toast.error(`❌ Erro no arquivo ${file.name}: ${err.message}`)
      }
    }

    if (added.length) {
      onChange([...items, ...added])
      toast.success(`✅ ${added.length} foto/vídeo enviado com sucesso!`)
    }
    onUploadingChange?.(false)
    setTimeout(() => setQueue([]), 2500)
  }

  function handleConfirmDelete() {
    if (indexToDelete !== null) {
      onChange(items.filter((_, idx) => idx !== indexToDelete))
      setIndexToDelete(null)
      toast.success("✅ Item removido com sucesso!")
    }
  }

  return (
    <div className="space-y-6">
      {/* Área de Toque Grande para Upload */}
      <label className="w-full min-h-[160px] sm:min-h-[190px] border-3 border-dashed border-[#FE8330]/50 hover:border-[#FE8330] rounded-[2rem] bg-orange-50/30 hover:bg-orange-50/60 p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all active:scale-[0.99]">
        {uploading ? (
          <Loader2 className="w-12 h-12 text-[#FE8330] animate-spin" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#FE8330]/10 text-[#FE8330] flex items-center justify-center">
            <UploadCloud className="w-9 h-9" />
          </div>
        )}
        <div className="space-y-1">
          <span className="text-lg sm:text-xl font-black text-[#1E2229] block">
            Toque aqui para escolher fotos ou vídeos
          </span>
          <span className="text-sm font-medium text-gray-500 block">
            Selecione um ou vários arquivos direto da sua galeria ou câmera
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFiles}
        />
      </label>

      {/* Barra de Progresso do Envio */}
      {queue.length > 0 && (
        <div className="space-y-2 bg-gray-50 rounded-2xl p-4 border">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Enviando arquivos...
          </span>
          {queue.map((q, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between gap-3 text-xs font-bold">
                <span className="truncate min-w-0">{q.name}</span>
                <span className={q.error ? "text-red-500 shrink-0" : "text-[#FE8330] shrink-0"}>
                  {q.error ? "Erro" : `${q.progress}%`}
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${q.error ? "bg-red-400" : "bg-[#FE8330]"}`}
                  style={{ width: `${q.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade de Miniaturas das Fotos e Vídeos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, i) => (
          <div key={`${item.url}-${i}`} className="w-full rounded-[1.5rem] border-2 border-gray-100 bg-white overflow-hidden shadow-xs space-y-3 p-3">
            <div className="relative w-full rounded-xl overflow-hidden bg-black">
              {item.tipo === "video" ? (
                <video
                  src={item.url}
                  controls
                  muted
                  preload="metadata"
                  className="w-full h-[200px] object-cover"
                />
              ) : (
                <img src={item.url} className="w-full h-[200px] object-cover" alt={`Mídia ${i + 1}`} />
              )}
              
              <span className="absolute top-2.5 left-2.5 text-xs font-black bg-black/70 text-white rounded-full px-3 py-1 flex items-center gap-1 backdrop-blur-xs">
                {item.tipo === "video" ? "🎬 Vídeo" : "🖼️ Foto"}
              </span>

              {/* Botão de Excluir */}
              <button
                type="button"
                onClick={() => setIndexToDelete(i)}
                className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Excluir"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Controles de Tag e Ambiente */}
            {showTags && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1.5">
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
                      className={`flex-1 min-h-[44px] flex items-center justify-center text-xs font-black rounded-xl border transition-all ${
                        item.tag === opt.value
                          ? "bg-[#FE8330] text-white border-[#FE8330]"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {showAmbiente && (
                  <select
                    className="w-full min-h-[44px] px-3 text-xs font-bold text-gray-700 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 ring-[#FE8330]/30"
                    value={item.ambiente || ""}
                    onChange={(e) =>
                      onChange(
                        items.map((p, idx) =>
                          idx === i ? { ...p, ambiente: (e.target.value as AmbienteTag) || undefined } : p,
                        ),
                      )
                    }
                  >
                    <option value="">Ambiente: Geral</option>
                    {AMBIENTE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>Ambiente: {opt.label}</option>
                    ))}
                  </select>
                )}

                {item.tipo === 'video' && (
                  <label className="flex items-center gap-2.5 p-2 bg-orange-50/60 border border-orange-200/60 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!item.is_tour}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onChange(items.map((p, idx) => {
                          if (idx === i) return { ...p, is_tour: isChecked };
                          if (isChecked && p.tipo === 'video') return { ...p, is_tour: false };
                          return p;
                        }))
                      }}
                      className="accent-[#FE8330] w-5 h-5 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800">Usar como Tour Virtual no Início</span>
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Simples de Confirmação de Exclusão */}
      {indexToDelete !== null && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#1E2229]">Tem certeza?</h4>
              <p className="text-sm text-gray-500 mt-1">
                Esta ação não pode ser desfeita e removerá este item da galeria.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIndexToDelete(null)}
                className="min-h-[52px] rounded-xl border border-gray-300 font-bold text-base hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[52px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-base cursor-pointer"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
