import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/image')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get('path')

        if (!path || path.startsWith('/') || path.includes('..')) {
          return new Response('Imagem inválida', { status: 400 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data, error } = await supabaseAdmin.storage.from('images').download(path)

        if (error || !data) {
          return new Response('Imagem não encontrada', { status: 404 })
        }

        return new Response(data, {
          headers: {
            'Content-Type': data.type || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      },
    },
  },
})