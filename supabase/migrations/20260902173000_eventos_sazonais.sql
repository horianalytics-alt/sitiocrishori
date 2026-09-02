-- ============================================================
-- Migration: Eventos Sazonais Dinâmicos
-- Date: 2026-09-02
-- ============================================================

-- Create table eventos_sazonais
CREATE TABLE IF NOT EXISTS public.eventos_sazonais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  emoji text NOT NULL,
  ativo boolean NOT NULL DEFAULT false,
  data_inicio date,
  data_fim date,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eventos_sazonais ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "eventos_sazonais_public_read" ON public.eventos_sazonais FOR SELECT TO public USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "eventos_sazonais_admin_insert" ON public.eventos_sazonais FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "eventos_sazonais_admin_update" ON public.eventos_sazonais FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "eventos_sazonais_admin_delete" ON public.eventos_sazonais FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

GRANT SELECT ON public.eventos_sazonais TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.eventos_sazonais TO authenticated, service_role;

-- Allow column evento on midias to store any event id/name
DO $$ BEGIN
  ALTER TABLE public.midias ALTER COLUMN evento TYPE text USING evento::text;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Populate default and requested pre-created events
INSERT INTO public.eventos_sazonais (nome, emoji, ativo, is_system)
SELECT 'Natal', '🎄', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Natal');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, is_system)
SELECT 'Páscoa', '🐰', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Páscoa');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, is_system)
SELECT 'Ano Novo', '🎆', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Ano Novo');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, is_system)
SELECT 'Carnaval', '🎭', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Carnaval');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, is_system)
SELECT 'Halloween', '🎃', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Halloween');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, is_system)
SELECT 'Festa Junina', '🎪', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Festa Junina');
