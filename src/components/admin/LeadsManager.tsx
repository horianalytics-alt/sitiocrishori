import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MessageCircle, Download, Loader2 } from "lucide-react"
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

  function handleWhatsApp(whatsapp: string) {
    const num = whatsapp.replace(/\D/g, "")
    window.open(`https://wa.me/55${num}`, "_blank")
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
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Leads Capturados</h2>
          <p className="text-sm text-muted-foreground">{(leads as any[]).length} contatos registrados</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={(leads as any[]).length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FE8330]/10 text-[#FE8330] font-bold text-sm hover:bg-[#FE8330]/20 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#FE8330] animate-spin" />
        </div>
      )}

      {!isLoading && (leads as any[]).length === 0 && (
        <div className="text-center text-gray-400 py-10">
          Nenhum lead capturado ainda.
        </div>
      )}

      {paginated.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">
                  Nome
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">
                  WhatsApp
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">
                  Origem
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900">{lead.nome || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{lead.whatsapp}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.origem ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleWhatsApp(lead.whatsapp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
