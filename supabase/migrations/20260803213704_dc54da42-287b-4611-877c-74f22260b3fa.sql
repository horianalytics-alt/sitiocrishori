-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode atualizar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode deletar imagens" ON storage.objects;

-- Permitir leitura pública para todos
CREATE POLICY "Leitura pública de imagens"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

-- Permitir upload apenas para administradores usando a função private.has_role e cast explícito
CREATE POLICY "Admin pode fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND 
  private.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Permitir atualização e deleção apenas para administradores
CREATE POLICY "Admin pode atualizar imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND 
  private.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admin pode deletar imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND 
  private.has_role(auth.uid(), 'admin'::public.app_role)
);