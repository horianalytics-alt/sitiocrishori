INSERT INTO public.site_content (section, content)
SELECT s, '[]'::jsonb FROM (VALUES ('gallery_natal'),('gallery_pascoa'),('gallery_ano_novo')) AS v(s)
WHERE NOT EXISTS (SELECT 1 FROM public.site_content sc WHERE sc.section = v.s);

CREATE POLICY "Admins manage midia-sitio" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'midia-sitio' AND private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'midia-sitio' AND private.has_role(auth.uid(), 'admin'::app_role));