-- Criando política de visualização do bucket (ESSENCIAL para evitar 404/Bucket not found)
-- Sem SELECT na storage.buckets, o cliente não consegue validar a existência do bucket
DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;
CREATE POLICY "Public Bucket Access" ON storage.buckets FOR SELECT TO public USING (true);

-- Criando políticas para objetos no bucket 'images'
-- 1. Leitura pública
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');

-- 2. Upload para administradores (com cast para o enum app_role)
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'images' AND 
    private.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3. Update para administradores
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'images' AND 
    private.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 4. Delete para administradores
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'images' AND 
    private.has_role(auth.uid(), 'admin'::public.app_role)
);
