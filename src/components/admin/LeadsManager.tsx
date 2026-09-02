import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MessageCircle, Download, Loader2, Users } from "lucide-react"
import { getLeads } from "@/lib/site-content.functions"

const PAGE_SIZE = 25

export function LeadsManager() {
  const [page, setPage] = useState(0)

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeads(),
  })

  const totalPages = Math.ceil((leads as any[]).length / PAGE_SIZE)
  const paginated = (leads as any[]).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleWhatsApp(whatsapp: string, nome?: string) {
    const num = whatsapp.replace(/\D/g, "")
    const saudacao = nome ? `Olá ${nome}!` : "Olá!"
    const msg = `${saudacao} Tudo bem? Vi que você deixou seu contato no site do Sítio Cris Hori. Como podemos te ajudar?`
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  function exportCSV() {
    const rows = [
      ["Nome", "WhatsApp", "Origem", "Data de Captura"],
      ...(leads as any[]).map(l => [
        l.nome ?? "",
        l.whatsapp,
        l.origem ?? "",
        new Date(l.created_at).toLocaleDateString("pt-BR"),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contatos_interessados_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1E2229] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#FE8330]" /> Contatos Interessados
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Visitantes que deixaram nome e WhatsApp para receber novidades e orçamentos.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={(leads as any[]).length === 0}
          className="min-h-[52px] px-6 py-3.5 rounded-2xl bg-[#FE8330]/10 text-[#FE8330] font-black text-sm hover:bg-[#FE8330]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-5 h-5" /> Exportar Planilha (CSV)
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-[#FE8330] animate-spin" />
        </div>
      )}

      {!isLoading && (leads as any[]).length === 0 && (
        <div className="text-center text-gray-400 py-12 font-bold">
          Nenhum contato registrado ainda.
        </div>
      )}

      {paginated.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-4 font-black text-gray-500 uppercase text-xs tracking-wider">
                  Nome
                </th>
                <th className="text-left px-5 py-4 font-black text-gray-500 uppercase text-xs tracking-wider">
                  WhatsApp
                </th>
                <th className="text-left px-5 py-4 font-black text-gray-500 uppercase text-xs tracking-wider">
                  Origem
                </th>
                <th className="text-left px-5 py-4 font-black text-gray-500 uppercase text-xs tracking-wider">
                  Data
                </th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-black text-gray-900">{lead.nome || "Não informado"}</td>
                  <td className="px-5 py-4 font-bold text-gray-700">{lead.whatsapp}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm">{lead.origem === 'popup_exit_intent' ? 'Pop-up no Site' : (lead.origem ?? "Site")}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(lead.whatsapp, lead.nome)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-black hover:bg-emerald-100 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Conversar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="min-h-[52px] px-5 py-2.5 rounded-xl border text-sm font-bold disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
          >
            ← Anterior
          </button>
          <span className="text-sm font-bold text-gray-600">
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="min-h-[52px] px-5 py-2.5 rounded-xl border text-sm font-bold disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
