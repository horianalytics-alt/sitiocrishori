DROP POLICY IF EXISTS "Authenticated Manage" ON storage.objects;

CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'images' AND private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'images' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'images' AND private.has_role(auth.uid(), 'admin'::app_role));