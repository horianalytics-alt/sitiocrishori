-- ============================================================
-- Migration: Batch 4 - Instagram and Tour Virtual
-- Date: 2026-09-02
-- Description:
--   - Add instagram_token to config_site
--   - Add is_tour to midias
-- ============================================================

-- Add Instagram Token to config_site
ALTER TABLE public.config_site
  ADD COLUMN IF NOT EXISTS instagram_token text;

-- Add is_tour flag to midias
ALTER TABLE public.midias
  ADD COLUMN IF NOT EXISTS is_tour boolean NOT NULL DEFAULT false;

-- Create an index to quickly find the active tour
CREATE INDEX IF NOT EXISTS idx_midias_tour ON public.midias(is_tour) WHERE is_tour = true;
