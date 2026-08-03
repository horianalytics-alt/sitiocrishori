INSERT INTO public.site_content (section, content) VALUES ('gallery', '[]') ON CONFLICT (section) DO NOTHING;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
GRANT SELECT ON public.site_content TO anon;