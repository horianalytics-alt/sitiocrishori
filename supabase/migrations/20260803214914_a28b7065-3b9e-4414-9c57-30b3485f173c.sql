GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode atualizar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode deletar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;

CREATE POLICY "images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

CREATE POLICY "images_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND private.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND private.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'images'
  AND private.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND private.has_role(auth.uid(), 'admin'::public.app_role)
);