GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Read'
    ) THEN
        CREATE POLICY "Public Read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Manage'
    ) THEN
        CREATE POLICY "Authenticated Manage" ON storage.objects 
        FOR ALL TO authenticated 
        USING (bucket_id = 'images')
        WITH CHECK (bucket_id = 'images');
    END IF;
END $$;