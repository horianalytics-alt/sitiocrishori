-- 1. Remover políticas que dependem da função pública
DROP POLICY IF EXISTS "Admins can manage reservations" ON public.reservas;
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.galeria;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.depoimentos;
DROP POLICY IF EXISTS "Admins can manage configurations" ON public.configuracoes;
DROP POLICY IF EXISTS "Allow admins to update site_content" ON public.site_content;

-- 2. Remover a função pública agora que não há dependências
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- 3. Garantir que o esquema private e a função definer existam
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Revogar execução direta para roles não-admin
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM public, anon, authenticated;

-- 5. Recriar as políticas usando a função do esquema private
CREATE POLICY "Allow admins to update site_content"
ON public.site_content
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage reservations"
ON public.reservas
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage gallery"
ON public.galeria
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage testimonials"
ON public.depoimentos
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage configurations"
ON public.configuracoes
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
