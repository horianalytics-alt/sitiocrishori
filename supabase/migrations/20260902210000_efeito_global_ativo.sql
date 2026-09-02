-- ============================================================
-- Migration: Adiciona coluna efeito_global_ativo em eventos_sazonais
-- Date: 2026-09-02
-- ============================================================

DO $$ BEGIN
  ALTER TABLE public.eventos_sazonais 
    ADD COLUMN IF NOT EXISTS efeito_global_ativo boolean NOT NULL DEFAULT false;
EXCEPTION
  WHEN others THEN null;
END $$;
