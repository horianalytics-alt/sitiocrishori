DROP VIEW IF EXISTS public.reservas_disponibilidade;

CREATE VIEW public.reservas_disponibilidade
WITH (security_invoker = on) AS
SELECT id, data_inicio, data_fim, status
FROM public.reservas;

GRANT SELECT ON public.reservas_disponibilidade TO anon, authenticated;

REVOKE SELECT ON public.reservas FROM anon, authenticated;
GRANT SELECT (id, data_inicio, data_fim, status) ON public.reservas TO anon, authenticated;

CREATE POLICY "Public can view reservation availability"
ON public.reservas
FOR SELECT
TO anon, authenticated
USING (true);