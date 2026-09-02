DROP POLICY IF EXISTS "Anyone can view config_site" ON public.config_site;
DROP POLICY IF EXISTS "Anyone can view configurations" ON public.configuracoes;
REVOKE SELECT ON public.config_site FROM anon;
REVOKE SELECT ON public.configuracoes FROM anon;
GRANT ALL ON public.config_site TO service_role;
GRANT ALL ON public.configuracoes TO service_role;