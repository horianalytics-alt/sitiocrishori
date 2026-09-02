import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import 'aos/dist/aos.css';

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useQuery } from "@tanstack/react-query";
import { getEfeitoGlobalAtivoPublica, getEventoSazonalAtivoPublica } from "@/lib/site-content.functions";
import { SeasonalEffects, getSeasonTypeFromName } from "@/components/SeasonalEffects";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sítio Para Eventos | Locação Para Festas, Casamentos e Lazer" },
      { name: "description", content: "Locação de sítio premium em São Paulo para festas, casamentos, finais de semana e day use. Infraestrutura completa com piscina aquecida, campo e suítes." },
      { name: "keywords", content: "sítio para festas, aluguel de sítio, sítio para casamento, piscina aquecida, day use sp, locação para eventos, sítio com campo de futebol" },
      { name: "author", content: "Sítio de Eventos" },
      { property: "og:title", content: "Sítio Para Eventos | O Cenário Perfeito Para Seus Melhores Momentos" },
      { property: "og:description", content: "Aluguel de sítio de alto padrão para eventos e lazer. Conheça nossa infraestrutura completa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function GlobalSeasonalLayer() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  // Na home '/', index.tsx já gerencia tanto o modo global quanto o modo automático por scroll
  if (pathname === "/") return null;

  const { data: efeitoGlobal } = useQuery({
    queryKey: ['efeito_global_ativo'],
    queryFn: () => getEfeitoGlobalAtivoPublica(),
  }) as { data: any };

  const { data: eventoAtivo } = useQuery({
    queryKey: ['evento_sazonal_ativo'],
    queryFn: () => getEventoSazonalAtivoPublica(),
  }) as { data: any };

  const active = (efeitoGlobal && efeitoGlobal.efeito_global_ativo) ? efeitoGlobal : (eventoAtivo && eventoAtivo.ativo) ? eventoAtivo : null;
  if (!active) return null;

  const season = getSeasonTypeFromName(active.nome);
  if (season === 'none') return null;

  return <SeasonalEffects season={season} isEnabled={true} />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalSeasonalLayer />
      <Outlet />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
