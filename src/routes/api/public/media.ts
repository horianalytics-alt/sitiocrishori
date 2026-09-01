import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/media')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get('path')

        if (!path || path.startsWith('/') || path.includes('..')) {
          return new Response('Mídia inválida', { status: 400 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data, error } = await supabaseAdmin.storage
          .from('midia-sitio')
          .createSignedUrl(path, 60 * 60)

        if (error || !data?.signedUrl) {
          return new Response('Mídia não encontrada', { status: 404 })
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: data.signedUrl,
            'Cache-Control': 'public, max-age=1800',
          },
        })
      },
    },
  },
})
