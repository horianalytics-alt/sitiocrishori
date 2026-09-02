-- ============================================================
-- Migration: Adiciona foto_fallback na tabela config_site
-- Date: 2026-09-02
-- ============================================================

DO $$ BEGIN
  ALTER TABLE public.config_site ADD COLUMN IF NOT EXISTS foto_fallback text;
EXCEPTION
  WHEN others THEN null;
END $$;
