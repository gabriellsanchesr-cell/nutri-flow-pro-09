
-- 1. SMTP credentials: prevent SELECT of smtp_password column
REVOKE SELECT (smtp_password) ON public.configuracoes_clinica FROM authenticated, anon;
GRANT SELECT (smtp_password) ON public.configuracoes_clinica TO service_role;

-- 2. documentos-pdf: unified patient/nutri read policy covering all subpaths scoped by paciente_id
DROP POLICY IF EXISTS "Authorized read documentos-pdf" ON storage.objects;
CREATE POLICY "Authorized read documentos-pdf"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos-pdf'
  AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE (
      (p.id)::text = (storage.foldername(name))[1]
      OR (p.id)::text = (storage.foldername(name))[2]
      OR (p.id)::text = (storage.foldername(name))[3]
    )
    AND (p.auth_user_id = auth.uid() OR public.can_access_nutri_data(p.user_id) OR p.user_id = auth.uid())
  )
);

-- 3. Realtime: restrict shared sidebar/notification topics to nutri/equipe only
DROP POLICY IF EXISTS "Authorized realtime read" ON realtime.messages;
DROP POLICY IF EXISTS "Authorized realtime write" ON realtime.messages;

CREATE POLICY "Authorized realtime read"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (
    realtime.topic() = ANY (ARRAY['sidebar-unread','notificacoes-realtime','nutri-diarios','conversas-updates'])
    AND (public.has_role(auth.uid(), 'nutri'::app_role) OR public.has_role(auth.uid(), 'equipe'::app_role))
  )
  OR EXISTS (
    SELECT 1 FROM conversas c
    LEFT JOIN pacientes p ON p.id = c.paciente_id
    WHERE (
      realtime.topic() = ('mensagens-' || c.id::text)
      OR realtime.topic() = ('portal-msgs-' || c.id::text)
      OR realtime.topic() = ('typing-' || c.id::text)
    )
    AND (c.nutri_id = auth.uid() OR public.can_access_nutri_data(c.nutri_id) OR p.auth_user_id = auth.uid())
  )
);

CREATE POLICY "Authorized realtime write"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  (
    realtime.topic() = ANY (ARRAY['sidebar-unread','notificacoes-realtime','nutri-diarios','conversas-updates'])
    AND (public.has_role(auth.uid(), 'nutri'::app_role) OR public.has_role(auth.uid(), 'equipe'::app_role))
  )
  OR EXISTS (
    SELECT 1 FROM conversas c
    LEFT JOIN pacientes p ON p.id = c.paciente_id
    WHERE (
      realtime.topic() = ('mensagens-' || c.id::text)
      OR realtime.topic() = ('portal-msgs-' || c.id::text)
      OR realtime.topic() = ('typing-' || c.id::text)
    )
    AND (c.nutri_id = auth.uid() OR public.can_access_nutri_data(c.nutri_id) OR p.auth_user_id = auth.uid())
  )
);
