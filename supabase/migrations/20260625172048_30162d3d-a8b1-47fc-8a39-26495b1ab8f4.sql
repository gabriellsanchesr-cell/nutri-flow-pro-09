
ALTER TABLE public.planos_alimentares
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'estruturado',
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS pdf_nome text,
  ADD COLUMN IF NOT EXISTS pdf_path text;

ALTER TABLE public.planos_alimentares
  DROP CONSTRAINT IF EXISTS planos_alimentares_tipo_check;
ALTER TABLE public.planos_alimentares
  ADD CONSTRAINT planos_alimentares_tipo_check CHECK (tipo IN ('estruturado','anexo'));

-- Storage policies for planos PDFs in documentos-pdf bucket
-- Path convention: planos/{paciente_id}/{filename}

DROP POLICY IF EXISTS "Planos PDF: nutri/equipe select" ON storage.objects;
CREATE POLICY "Planos PDF: nutri/equipe select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] = 'planos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.user_id = auth.uid() OR public.equipe_can_access_paciente(p.id))
  )
);

DROP POLICY IF EXISTS "Planos PDF: nutri/equipe insert" ON storage.objects;
CREATE POLICY "Planos PDF: nutri/equipe insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] = 'planos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.user_id = auth.uid() OR public.equipe_can_access_paciente(p.id))
  )
);

DROP POLICY IF EXISTS "Planos PDF: nutri/equipe update" ON storage.objects;
CREATE POLICY "Planos PDF: nutri/equipe update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] = 'planos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.user_id = auth.uid() OR public.equipe_can_access_paciente(p.id))
  )
);

DROP POLICY IF EXISTS "Planos PDF: nutri/equipe delete" ON storage.objects;
CREATE POLICY "Planos PDF: nutri/equipe delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] = 'planos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.user_id = auth.uid() OR public.equipe_can_access_paciente(p.id))
  )
);

DROP POLICY IF EXISTS "Planos PDF: paciente select" ON storage.objects;
CREATE POLICY "Planos PDF: paciente select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] = 'planos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.auth_user_id = auth.uid()
  )
);
