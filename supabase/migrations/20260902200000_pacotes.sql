-- ============================================================
-- Migration: Tabela de Pacotes Gerenciáveis
-- Date: 2026-09-02
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pacotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  num_pessoas int,
  preco_total decimal(10,2),
  preco_por_pessoa decimal(10,2),
  itens_incluidos jsonb DEFAULT '[]'::jsonb,
  destaque boolean DEFAULT false,
  texto_destaque text,
  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DO $$ BEGIN
  CREATE POLICY "Pacotes public select"
    ON public.pacotes FOR SELECT
    USING (ativo = true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Pacotes admin all"
    ON public.pacotes FOR ALL
    USING (auth.role() = 'authenticated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Inserir pacotes iniciais de exemplo caso tabela esteja vazia
INSERT INTO public.pacotes (nome, num_pessoas, preco_total, preco_por_pessoa, itens_incluidos, destaque, texto_destaque, ativo, ordem)
SELECT
  'Final de Semana em Família',
  30,
  3500.00,
  NULL,
  '["Hospedagem completa para até 30 pessoas", "Acesso à piscina aquecida", "Área de churrasco com quiosque", "Campo de futebol gramado", "Cozinha equipada e salão de jogos"]'::jsonb,
  true,
  'Mais Popular',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.pacotes);

INSERT INTO public.pacotes (nome, num_pessoas, preco_total, preco_por_pessoa, itens_incluidos, destaque, texto_destaque, ativo, ordem)
SELECT
  'Festa & Aniversário',
  80,
  NULL,
  65.00,
  '["Salão de festas decorado", "Piscina e áreas de lazer liberadas", "Churrasqueira e freezer comercial", "Estacionamento amplo e seguro", "Mesas e cadeiras inclusas"]'::jsonb,
  false,
  NULL,
  true,
  2
WHERE (SELECT count(*) FROM public.pacotes) = 1;

INSERT INTO public.pacotes (nome, num_pessoas, preco_total, preco_por_pessoa, itens_incluidos, destaque, texto_destaque, ativo, ordem)
SELECT
  'Day Use Corporativo & Confraternização',
  50,
  2800.00,
  NULL,
  '["Diária das 08h às 18h", "Wi-Fi de alta velocidade em toda a área", "Espaço para dinâmicas e apresentações", "Piscina e campo de futebol", "Cozinha de apoio"]'::jsonb,
  false,
  'Ideal para Empresas',
  true,
  3
WHERE (SELECT count(*) FROM public.pacotes) = 2;
