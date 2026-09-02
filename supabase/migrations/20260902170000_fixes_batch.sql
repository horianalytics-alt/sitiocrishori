-- ============================================================
-- Migration: Fixes for Admin Navigation, Leads Name, and Simulator Pricing
-- Date: 2026-09-02
-- ============================================================

-- Add nome column to leads_capturados if it doesn't exist
ALTER TABLE public.leads_capturados
  ADD COLUMN IF NOT EXISTS nome text;

-- Add simulator columns to config_site if they don't exist
ALTER TABLE public.config_site
  ADD COLUMN IF NOT EXISTS preco_base_festa numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_base_fim_semana numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fim_semana_tipo_preco text DEFAULT 'fixo';
