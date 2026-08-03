-- 1. Create the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- 2. Tabela de Reservas e Bloqueio de Agenda
CREATE TABLE public.reservas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  cliente_nome text,
  cliente_telefone text,
  valor_total decimal(10,2),
  sinal_pago boolean DEFAULT false,
  status text DEFAULT 'confirmado',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Galeria de Fotos
CREATE TABLE public.galeria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text,
  categoria text,
  imagem_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Depoimentos
CREATE TABLE public.depoimentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  evento text,
  depoimento text NOT NULL,
  estrelas integer DEFAULT 5,
  foto_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Configurações Gerais
CREATE TABLE public.configuracoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text UNIQUE NOT NULL,
  valor text NOT NULL
);

-- 6. Grants
GRANT SELECT ON public.reservas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;

GRANT SELECT ON public.galeria TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.galeria TO authenticated;
GRANT ALL ON public.galeria TO service_role;

GRANT SELECT ON public.depoimentos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.depoimentos TO authenticated;
GRANT ALL ON public.depoimentos TO service_role;

GRANT SELECT ON public.configuracoes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;

-- 7. RLS
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Reservas
CREATE POLICY "Anyone can view confirmed reservations" ON public.reservas
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage reservations" ON public.reservas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 9. Policies for Galeria
CREATE POLICY "Anyone can view gallery" ON public.galeria
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery" ON public.galeria
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 10. Policies for Depoimentos
CREATE POLICY "Anyone can view testimonials" ON public.depoimentos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage testimonials" ON public.depoimentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 11. Policies for Configuracoes
CREATE POLICY "Anyone can view configurations" ON public.configuracoes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage configurations" ON public.configuracoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
