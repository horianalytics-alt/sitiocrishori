-- Restringe gerenciamento de pacotes apenas a administradores
DROP POLICY IF EXISTS "Pacotes admin all" ON public.pacotes;

CREATE POLICY "Admins manage pacotes"
ON public.pacotes
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));