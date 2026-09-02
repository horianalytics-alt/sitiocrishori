-- ============================================================
-- Migration: Campos de Localização do Google Maps na Configuração do Site
-- Date: 2026-09-02
-- ============================================================

DO $$ BEGIN
  ALTER TABLE public.config_site ADD COLUMN IF NOT EXISTS mapa_cidade text DEFAULT 'Ibiúna, SP';
  ALTER TABLE public.config_site ADD COLUMN IF NOT EXISTS mapa_distancia text DEFAULT '65 km de São Paulo';
  ALTER TABLE public.config_site ADD COLUMN IF NOT EXISTS mapa_tempo text DEFAULT '50 min da capital';
  ALTER TABLE public.config_site ADD COLUMN IF NOT EXISTS mapa_link_direto text;
EXCEPTION
  WHEN others THEN null;
END $$;
