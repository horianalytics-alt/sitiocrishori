-- 1. Ensure schema-level usage grants for API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. site_content table security
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 3. user_roles table security
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. reservas table security
GRANT SELECT ON public.reservas TO anon, authenticated;
GRANT ALL ON public.reservas TO service_role;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- 5. galeria table security
GRANT SELECT ON public.galeria TO anon, authenticated;
GRANT ALL ON public.galeria TO service_role;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

-- 6. depoimentos table security
GRANT SELECT ON public.depoimentos TO anon, authenticated;
GRANT ALL ON public.depoimentos TO service_role;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

-- 7. Ensure has_role function is executable by authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
