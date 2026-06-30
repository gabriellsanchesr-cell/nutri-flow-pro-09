
DROP POLICY IF EXISTS "Anyone can read content files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read conteudo_real" ON storage.objects;

CREATE POLICY "Authorized read conteudo-real"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'conteudo-real'
  AND (
    EXISTS (
      SELECT 1 FROM public.conteudos_real c
      WHERE c.arquivo_path = storage.objects.name
        AND (c.user_id = auth.uid() OR public.can_access_nutri_data(c.user_id))
    )
    OR EXISTS (
      SELECT 1
      FROM public.conteudo_liberacoes lib
      JOIN public.conteudos_real c ON c.id = lib.conteudo_id
      JOIN public.pacientes p ON p.id = lib.paciente_id
      WHERE c.arquivo_path = storage.objects.name
        AND p.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Nutri can upload photos" ON storage.objects;

CREATE POLICY "Patients can view own checklists"
ON public.checklist_respostas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = checklist_respostas.paciente_id
      AND p.auth_user_id = auth.uid()
  )
);
