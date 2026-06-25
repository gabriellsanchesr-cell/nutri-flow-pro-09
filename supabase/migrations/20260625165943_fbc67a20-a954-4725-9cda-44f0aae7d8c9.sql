
-- =========================================================
-- 1) configuracoes_clinica: remove equipe SELECT
-- =========================================================
DROP POLICY IF EXISTS "Equipe can view config clinica" ON public.configuracoes_clinica;

-- =========================================================
-- 2/3) diario-fotos bucket
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view diario fotos" ON storage.objects;
DROP POLICY IF EXISTS "Paciente can upload diario fotos" ON storage.objects;

-- INSERT: only patient uploading into their own paciente.id folder
CREATE POLICY "Paciente uploads own diario fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diario-fotos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.auth_user_id = auth.uid()
  )
);

-- SELECT: patient owner OR responsible nutri/equipe
CREATE POLICY "Authorized read diario fotos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'diario-fotos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.auth_user_id = auth.uid() OR public.can_access_nutri_data(p.user_id))
  )
);

-- DELETE: nutri owner (or patient themselves)
CREATE POLICY "Authorized delete diario fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'diario-fotos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.auth_user_id = auth.uid() OR public.can_access_nutri_data(p.user_id))
  )
);

-- =========================================================
-- 4) evolucao-fotos bucket
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view evolucao fotos" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can upload evolucao fotos" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can delete evolucao fotos" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can delete own photos" ON storage.objects;

CREATE POLICY "Authorized read evolucao fotos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evolucao-fotos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.auth_user_id = auth.uid() OR public.can_access_nutri_data(p.user_id))
  )
);

CREATE POLICY "Nutri uploads evolucao fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evolucao-fotos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND public.can_access_nutri_data(p.user_id)
  )
);

CREATE POLICY "Nutri deletes evolucao fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evolucao-fotos'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND public.can_access_nutri_data(p.user_id)
  )
);

-- =========================================================
-- 5) exames-laboratoriais bucket: enforce ownership
-- =========================================================
DROP POLICY IF EXISTS "Nutri can upload exames" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can delete exames files" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can view own exames files" ON storage.objects;

CREATE POLICY "Authorized read exames files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exames-laboratoriais'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.auth_user_id = auth.uid() OR public.can_access_nutri_data(p.user_id))
  )
);

CREATE POLICY "Nutri uploads exames"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exames-laboratoriais'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND public.can_access_nutri_data(p.user_id)
  )
);

CREATE POLICY "Nutri deletes exames"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exames-laboratoriais'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND public.can_access_nutri_data(p.user_id)
  )
);

-- =========================================================
-- 6) documentos-pdf bucket: restrict by paciente folder
--    Path layouts: 'materiais/{paciente.id}/...' and 'avaliacoes-importadas/{paciente.id}/...'
-- =========================================================
DROP POLICY IF EXISTS "Nutri can read materiais" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can read own docs" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can upload materiais" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can delete materiais" ON storage.objects;
DROP POLICY IF EXISTS "Nutri can delete own docs" ON storage.objects;

CREATE POLICY "Authorized read documentos-pdf"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] IN ('materiais','avaliacoes-importadas')
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.auth_user_id = auth.uid() OR public.can_access_nutri_data(p.user_id))
  )
);

CREATE POLICY "Nutri uploads documentos-pdf"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] IN ('materiais','avaliacoes-importadas')
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND public.can_access_nutri_data(p.user_id)
  )
);

CREATE POLICY "Nutri deletes documentos-pdf"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND (storage.foldername(name))[1] IN ('materiais','avaliacoes-importadas')
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND public.can_access_nutri_data(p.user_id)
  )
);

-- =========================================================
-- 7) questionarios: remove public select-all and update; add token RPCs
-- =========================================================
DROP POLICY IF EXISTS "Public can view questionario by token" ON public.questionarios;
DROP POLICY IF EXISTS "Public can update questionario by token" ON public.questionarios;

CREATE OR REPLACE FUNCTION public.get_questionario_by_token(p_token text)
RETURNS TABLE(
  id uuid,
  paciente_id uuid,
  tipo text,
  status text,
  data_envio timestamptz,
  data_resposta timestamptz,
  respostas jsonb,
  token text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.paciente_id, q.tipo::text, q.status::text,
         q.data_envio, q.data_resposta, q.respostas, q.token
  FROM public.questionarios q
  WHERE q.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_questionario_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_questionario_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_questionario_by_token(p_token text, p_respostas jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated int;
BEGIN
  UPDATE public.questionarios
     SET respostas = p_respostas,
         status = 'respondido'::status_questionario,
         data_resposta = now()
   WHERE token = p_token
     AND status <> 'respondido'::status_questionario;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_questionario_by_token(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_questionario_by_token(text, jsonb) TO anon, authenticated;

-- =========================================================
-- 8) Realtime channel authorization
-- =========================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized realtime read" ON realtime.messages;
DROP POLICY IF EXISTS "Authorized realtime write" ON realtime.messages;

CREATE POLICY "Authorized realtime read"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  -- Sidebar/notifications: only own user
  (realtime.topic() IN ('sidebar-unread','notificacoes-realtime','nutri-diarios','conversas-updates')
   AND auth.uid() IS NOT NULL)
  OR
  -- Per-conversation channels: mensagens-{id}, portal-msgs-{id}, typing-{id}
  EXISTS (
    SELECT 1 FROM public.conversas c
    LEFT JOIN public.pacientes p ON p.id = c.paciente_id
    WHERE realtime.topic() IN (
            'mensagens-' || c.id::text,
            'portal-msgs-' || c.id::text,
            'typing-' || c.id::text
          )
      AND (c.nutri_id = auth.uid()
           OR public.can_access_nutri_data(c.nutri_id)
           OR p.auth_user_id = auth.uid())
  )
);

CREATE POLICY "Authorized realtime write"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() IN ('sidebar-unread','notificacoes-realtime','nutri-diarios','conversas-updates')
   AND auth.uid() IS NOT NULL)
  OR
  EXISTS (
    SELECT 1 FROM public.conversas c
    LEFT JOIN public.pacientes p ON p.id = c.paciente_id
    WHERE realtime.topic() IN (
            'mensagens-' || c.id::text,
            'portal-msgs-' || c.id::text,
            'typing-' || c.id::text
          )
      AND (c.nutri_id = auth.uid()
           OR public.can_access_nutri_data(c.nutri_id)
           OR p.auth_user_id = auth.uid())
  )
);
