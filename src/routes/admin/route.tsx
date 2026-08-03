import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    // Evitar redirecionamento infinito se já estivermos na página de login
    if (location.pathname === '/admin/login') {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/admin/login', replace: true })
    }
  },
  component: () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#FE8330]">Sítio Admin</h1>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Sair
        </button>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
})
