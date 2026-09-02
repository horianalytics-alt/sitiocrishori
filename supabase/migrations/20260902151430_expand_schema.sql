-- ============================================================
-- Migration: Expand schema for new site features
-- Date: 2026-09-02
-- Description:
--   - 7 new enums
--   - 5 new tables (disponibilidade, midias, leads_capturados, regras_politicas, config_site)
--   - 2 expanded tables (reservas, depoimentos)
--   - RLS policies for all new/expanded tables
--   - Public read policy on midia-sitio bucket
-- ============================================================

-- =========================
-- 1. NEW ENUMS
-- =========================

CREATE TYPE public.disponibilidade_status AS ENUM ('disponivel', 'ocupado', 'reservado');
CREATE TYPE public.tipo_evento AS ENUM ('final_de_semana', 'festa');
CREATE TYPE public.reserva_status AS ENUM ('pendente', 'confirmado', 'cancelado');
CREATE TYPE public.midia_tipo AS ENUM ('foto', 'video');
CREATE TYPE public.midia_modo AS ENUM ('dia', 'noite', 'ambos');
CREATE TYPE public.midia_ambiente AS ENUM ('piscina', 'area_gourmet', 'suites', 'salao', 'area_externa', 'geral');
CREATE TYPE public.midia_evento AS ENUM ('natal', 'pascoa', 'ano_novo');

-- =========================
-- 2. NEW TABLE: disponibilidade
-- =========================

CREATE TABLE public.disponibilidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  status public.disponibilidade_status NOT NULL DEFAULT 'disponivel',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disponibilidade ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "disponibilidade_public_read"
  ON public.disponibilidade
  FOR SELECT
  TO public
  USING (true);

-- Admin insert
CREATE POLICY "disponibilidade_admin_insert"
  ON public.disponibilidade
  FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin update
CREATE POLICY "disponibilidade_admin_update"
  ON public.disponibilidade
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin delete
CREATE POLICY "disponibilidade_admin_delete"
  ON public.disponibilidade
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Grants
GRANT SELECT ON public.disponibilidade TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.disponibilidade TO authenticated, service_role;

-- =========================
-- 3. EXPAND TABLE: reservas
-- =========================

ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS data_evento date,
  ADD COLUMN IF NOT EXISTS num_convidados int,
  ADD COLUMN IF NOT EXISTS tipo_evento public.tipo_evento,
  ADD COLUMN IF NOT EXISTS status_novo public.reserva_status DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS mensagem text,
  ADD COLUMN IF NOT EXISTS link_unico uuid UNIQUE DEFAULT gen_random_uuid();

-- =========================
-- 4. NEW TABLE: midias
-- =========================

CREATE TABLE public.midias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  storage_path text NOT NULL,
  tipo public.midia_tipo NOT NULL DEFAULT 'foto',
  modo public.midia_modo NOT NULL DEFAULT 'ambos',
  ambiente public.midia_ambiente NOT NULL DEFAULT 'geral',
  evento public.midia_evento,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.midias ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "midias_public_read"
  ON public.midias
  FOR SELECT
  TO public
  USING (true);

-- Admin insert
CREATE POLICY "midias_admin_insert"
  ON public.midias
  FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin update
CREATE POLICY "midias_admin_update"
  ON public.midias
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin delete
CREATE POLICY "midias_admin_delete"
  ON public.midias
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Grants
GRANT SELECT ON public.midias TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.midias TO authenticated, service_role;

-- =========================
-- 5. EXPAND TABLE: depoimentos
-- =========================

ALTER TABLE public.depoimentos
  ADD COLUMN IF NOT EXISTS foto_evento_url text,
  ADD COLUMN IF NOT EXISTS aprovado boolean NOT NULL DEFAULT false;

-- Drop existing public read policy and replace with filtered one
DROP POLICY IF EXISTS "Public can view depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "depoimentos_public_read" ON public.depoimentos;

-- Public read only approved
CREATE POLICY "depoimentos_public_read_approved"
  ON public.depoimentos
  FOR SELECT
  TO public
  USING (aprovado = true);

-- Admin can read all (including unapproved)
CREATE POLICY "depoimentos_admin_read_all"
  ON public.depoimentos
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================
-- 6. NEW TABLE: leads_capturados
-- =========================

CREATE TABLE public.leads_capturados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp text NOT NULL,
  origem text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_capturados ENABLE ROW LEVEL SECURITY;

-- Admin read
CREATE POLICY "leads_capturados_admin_read"
  ON public.leads_capturados
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Public insert (anyone can submit their contact)
CREATE POLICY "leads_capturados_public_insert"
  ON public.leads_capturados
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin update
CREATE POLICY "leads_capturados_admin_update"
  ON public.leads_capturados
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin delete
CREATE POLICY "leads_capturados_admin_delete"
  ON public.leads_capturados
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Grants
GRANT SELECT ON public.leads_capturados TO authenticated, service_role;
GRANT INSERT ON public.leads_capturados TO anon, authenticated, service_role;
GRANT UPDATE, DELETE ON public.leads_capturados TO authenticated, service_role;

-- =========================
-- 7. NEW TABLE: regras_politicas
-- =========================

CREATE TABLE public.regras_politicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regras_politicas ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "regras_politicas_public_read"
  ON public.regras_politicas
  FOR SELECT
  TO public
  USING (true);

-- Admin insert
CREATE POLICY "regras_politicas_admin_insert"
  ON public.regras_politicas
  FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin update
CREATE POLICY "regras_politicas_admin_update"
  ON public.regras_politicas
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin delete
CREATE POLICY "regras_politicas_admin_delete"
  ON public.regras_politicas
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Grants
GRANT SELECT ON public.regras_politicas TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.regras_politicas TO authenticated, service_role;

-- =========================
-- 8. NEW TABLE: config_site (single-row)
-- =========================

CREATE TABLE public.config_site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  countdown_mensagem text,
  datas_quase_lotadas text,
  instagram_usuario text,
  whatsapp_contato text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.config_site ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "config_site_public_read"
  ON public.config_site
  FOR SELECT
  TO public
  USING (true);

-- Admin update
CREATE POLICY "config_site_admin_update"
  ON public.config_site
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin insert (for initial seed only)
CREATE POLICY "config_site_admin_insert"
  ON public.config_site
  FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin delete
CREATE POLICY "config_site_admin_delete"
  ON public.config_site
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Grants
GRANT SELECT ON public.config_site TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.config_site TO authenticated, service_role;

-- Seed default empty row
INSERT INTO public.config_site (countdown_mensagem, datas_quase_lotadas, instagram_usuario, whatsapp_contato)
VALUES (NULL, NULL, NULL, NULL);

-- =========================
-- 9. STORAGE: public read on midia-sitio
-- =========================

-- Add public read policy on midia-sitio bucket (write is already admin-only)
CREATE POLICY "midia_sitio_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'midia-sitio');
