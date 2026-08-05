-- 1. Remove public read of full reservation rows
DROP POLICY IF EXISTS "Public can view reservation availability" ON public.reservas;

REVOKE SELECT ON public.reservas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;

-- Authenticated non-admins also must not read full rows: only the admin policy remains,
-- which already scopes SELECT/ALL to private.has_role(auth.uid(),'admin').

-- 2. Availability view exposes only non-sensitive columns, runs as owner (bypasses RLS)
DROP VIEW IF EXISTS public.reservas_disponibilidade;
CREATE VIEW public.reservas_disponibilidade
WITH (security_invoker = false) AS
SELECT id, data_inicio, data_fim, status
FROM public.reservas;

REVOKE ALL ON public.reservas_disponibilidade FROM anon, authenticated;
GRANT SELECT ON public.reservas_disponibilidade TO anon, authenticated;
GRANT ALL ON public.reservas_disponibilidade TO service_role;