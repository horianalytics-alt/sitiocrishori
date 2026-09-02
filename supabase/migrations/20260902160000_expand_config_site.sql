-- ============================================================
-- Migration: Expand config_site with pricing and map info
-- Date: 2026-09-02
-- Description:
--   - Add pricing and map fields for dynamic site rendering
-- ============================================================

ALTER TABLE public.config_site
  ADD COLUMN IF NOT EXISTS preco_base_festa numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_base_fim_semana numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mapa_embed_url text,
  ADD COLUMN IF NOT EXISTS mapa_texto text;
