-- DISPONIBILIDADE
CREATE TABLE IF NOT EXISTS public.disponibilidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'disponivel',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.disponibilidade TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disponibilidade TO authenticated;
GRANT ALL ON public.disponibilidade TO service_role;
ALTER TABLE public.disponibilidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view disponibilidade" ON public.disponibilidade FOR SELECT USING (true);
CREATE POLICY "Admins manage disponibilidade" ON public.disponibilidade FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- CONFIG SITE
CREATE TABLE IF NOT EXISTS public.config_site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  countdown_mensagem text,
  datas_quase_lotadas text,
  instagram_usuario text,
  whatsapp_contato text,
  preco_base_festa numeric,
  preco_base_fim_semana numeric,
  mapa_embed_url text,
  mapa_texto text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.config_site TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_site TO authenticated;
GRANT ALL ON public.config_site TO service_role;
ALTER TABLE public.config_site ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view config_site" ON public.config_site FOR SELECT USING (true);
CREATE POLICY "Admins manage config_site" ON public.config_site FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.config_site (countdown_mensagem, whatsapp_contato)
VALUES ('Garanta já sua data!', '5511973000753');

-- REGRAS E POLITICAS
CREATE TABLE IF NOT EXISTS public.regras_politicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regras_politicas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_politicas TO authenticated;
GRANT ALL ON public.regras_politicas TO service_role;
ALTER TABLE public.regras_politicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view regras" ON public.regras_politicas FOR SELECT USING (true);
CREATE POLICY "Admins manage regras" ON public.regras_politicas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- LEADS CAPTURADOS
CREATE TABLE IF NOT EXISTS public.leads_capturados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  whatsapp text NOT NULL,
  email text,
  origem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads_capturados TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads_capturados TO authenticated;
GRANT ALL ON public.leads_capturados TO service_role;
ALTER TABLE public.leads_capturados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit lead" ON public.leads_capturados FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage leads" ON public.leads_capturados FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- RESERVAS: novos campos
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS link_unico text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ADD COLUMN IF NOT EXISTS status_novo text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_evento date,
  ADD COLUMN IF NOT EXISTS tipo_evento text,
  ADD COLUMN IF NOT EXISTS num_convidados integer,
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS mensagem text;
ALTER TABLE public.reservas ALTER COLUMN data_inicio DROP NOT NULL;
ALTER TABLE public.reservas ALTER COLUMN data_fim DROP NOT NULL;

-- trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_disponibilidade_updated ON public.disponibilidade;
CREATE TRIGGER trg_disponibilidade_updated BEFORE UPDATE ON public.disponibilidade
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_config_site_updated ON public.config_site;
CREATE TRIGGER trg_config_site_updated BEFORE UPDATE ON public.config_site
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_regras_updated ON public.regras_politicas;
CREATE TRIGGER trg_regras_updated BEFORE UPDATE ON public.regras_politicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();