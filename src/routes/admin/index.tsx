import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">Dashboard Admin</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Configurações do Site</h3>
          <p className="text-muted-foreground text-sm">Edite o conteúdo da página inicial, galeria e infraestrutura.</p>
          <button className="w-full bg-[#FE8330] text-white py-2 rounded-xl font-medium hover:bg-[#E06B1B] transition-colors">
            Editar Landing Page
          </button>
        </div>
      </div>
    </div>
  )
}
