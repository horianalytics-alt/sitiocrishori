DROP POLICY IF EXISTS "Anyone can view confirmed reservations" ON public.reservas;

REVOKE SELECT ON public.reservas FROM anon;

CREATE OR REPLACE VIEW public.reservas_disponibilidade
WITH (security_invoker = off) AS
SELECT id, data_inicio, data_fim, status
FROM public.reservas;

GRANT SELECT ON public.reservas_disponibilidade TO anon, authenticated;
GRANT ALL ON public.reservas TO service_role;