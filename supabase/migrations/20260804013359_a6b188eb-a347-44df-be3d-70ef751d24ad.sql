GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.reservas TO anon, authenticated;
GRANT SELECT ON public.galeria TO anon, authenticated;
GRANT SELECT ON public.depoimentos TO anon, authenticated;
GRANT SELECT ON public.configuracoes TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.galeria TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.depoimentos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;

GRANT ALL ON public.site_content TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.reservas TO service_role;
GRANT ALL ON public.galeria TO service_role;
GRANT ALL ON public.depoimentos TO service_role;
GRANT ALL ON public.configuracoes TO service_role;