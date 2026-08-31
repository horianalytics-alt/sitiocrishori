REVOKE EXECUTE ON FUNCTION public.get_reservas_disponibilidade() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservas_disponibilidade() TO service_role;