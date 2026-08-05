DROP VIEW IF EXISTS public.reservas_disponibilidade;

CREATE OR REPLACE FUNCTION public.get_reservas_disponibilidade()
RETURNS TABLE (id uuid, data_inicio date, data_fim date, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.data_inicio, r.data_fim, r.status
  FROM public.reservas r;
$$;

REVOKE ALL ON FUNCTION public.get_reservas_disponibilidade() FROM public;
GRANT EXECUTE ON FUNCTION public.get_reservas_disponibilidade() TO anon, authenticated, service_role;