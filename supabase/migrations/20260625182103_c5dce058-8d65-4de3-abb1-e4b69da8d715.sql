
-- Helper: equipe member has permission for nutri's data
CREATE OR REPLACE FUNCTION public.equipe_has_permission(_nutri_id uuid, _modulo text, _permissao text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.equipe_membros em
    WHERE em.auth_user_id = auth.uid()
      AND em.ativo = true
      AND em.created_by = _nutri_id
      AND COALESCE((em.permissoes -> _modulo ->> _permissao)::boolean, false) = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.equipe_has_permission(uuid, text, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.equipe_has_permission(uuid, text, text) TO authenticated;

-- ANAMNESES (módulo: anamnese)
DROP POLICY IF EXISTS "Equipe can manage anamneses" ON public.anamneses;
CREATE POLICY "Equipe can view anamneses with permission" ON public.anamneses
  FOR SELECT TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'anamnese', 'ver'));
CREATE POLICY "Equipe can modify anamneses with permission" ON public.anamneses
  FOR UPDATE TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'anamnese', 'editar'))
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'anamnese', 'editar'));
CREATE POLICY "Equipe can insert anamneses with permission" ON public.anamneses
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'anamnese', 'editar'));

-- CALCULOS_ENERGETICOS (módulo: avaliacoes)
DROP POLICY IF EXISTS "Equipe can manage calculos" ON public.calculos_energeticos;
CREATE POLICY "Equipe can view calculos with permission" ON public.calculos_energeticos
  FOR SELECT TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'avaliacoes', 'ver'));
CREATE POLICY "Equipe can modify calculos with permission" ON public.calculos_energeticos
  FOR UPDATE TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'avaliacoes', 'criar'))
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'avaliacoes', 'criar'));
CREATE POLICY "Equipe can insert calculos with permission" ON public.calculos_energeticos
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'avaliacoes', 'criar'));

-- FINANCEIRO_RECEITAS (módulo: financeiro)
DROP POLICY IF EXISTS "Equipe can manage receitas" ON public.financeiro_receitas;
CREATE POLICY "Equipe can view receitas with permission" ON public.financeiro_receitas
  FOR SELECT TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'financeiro', 'ver'));
CREATE POLICY "Equipe can modify receitas with permission" ON public.financeiro_receitas
  FOR UPDATE TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'financeiro', 'emitir_recibos'))
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'financeiro', 'emitir_recibos'));
CREATE POLICY "Equipe can insert receitas with permission" ON public.financeiro_receitas
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'financeiro', 'emitir_recibos'));
CREATE POLICY "Equipe can delete receitas with permission" ON public.financeiro_receitas
  FOR DELETE TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'financeiro', 'emitir_recibos'));

-- LEADS (módulo: pacientes — leads são pré-pacientes)
DROP POLICY IF EXISTS "Equipe can manage leads" ON public.leads;
CREATE POLICY "Equipe can view leads with permission" ON public.leads
  FOR SELECT TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'pacientes', 'ver'));
CREATE POLICY "Equipe can modify leads with permission" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'pacientes', 'editar'))
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'pacientes', 'editar'));
CREATE POLICY "Equipe can insert leads with permission" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'pacientes', 'criar'));
CREATE POLICY "Equipe can delete leads with permission" ON public.leads
  FOR DELETE TO authenticated
  USING (public.can_access_nutri_data(user_id) AND public.equipe_has_permission(user_id, 'pacientes', 'excluir'));
