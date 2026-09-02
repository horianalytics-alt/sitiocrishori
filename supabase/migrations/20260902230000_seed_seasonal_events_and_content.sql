-- ============================================================
-- Migration: Popular Eventos Sazonais e Conteúdo das Galerias Sazonais
-- Date: 2026-09-02
-- ============================================================

-- Garantir coluna efeito_global_ativo
DO $$ BEGIN
  ALTER TABLE public.eventos_sazonais 
    ADD COLUMN IF NOT EXISTS efeito_global_ativo boolean NOT NULL DEFAULT false;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Inserir os 6 eventos sazonais padrão caso não existam
INSERT INTO public.eventos_sazonais (nome, emoji, ativo, efeito_global_ativo, is_system)
SELECT 'Natal', '🎄', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Natal');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, efeito_global_ativo, is_system)
SELECT 'Ano Novo', '🎆', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Ano Novo');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, efeito_global_ativo, is_system)
SELECT 'Páscoa', '🐰', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Páscoa');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, efeito_global_ativo, is_system)
SELECT 'Halloween', '🎃', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Halloween');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, efeito_global_ativo, is_system)
SELECT 'Carnaval', '🎭', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Carnaval');

INSERT INTO public.eventos_sazonais (nome, emoji, ativo, efeito_global_ativo, is_system)
SELECT 'Festa Junina', '🎪', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_sazonais WHERE nome = 'Festa Junina');

-- Inserir seções de galeria correspondentes no site_content caso não existam
INSERT INTO public.site_content (section, content)
VALUES
  ('gallery_natal', '[]'::jsonb),
  ('gallery_ano_novo', '[]'::jsonb),
  ('gallery_pascoa', '[]'::jsonb),
  ('gallery_halloween', '[]'::jsonb),
  ('gallery_carnaval', '[]'::jsonb),
  ('gallery_festa_junina', '[]'::jsonb)
ON CONFLICT (section) DO NOTHING;
