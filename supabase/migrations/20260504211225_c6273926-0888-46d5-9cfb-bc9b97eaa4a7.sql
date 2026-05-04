
-- Helper: retorna true se o usuário logado é membro ativo da equipe do nutri _nutri_id
CREATE OR REPLACE FUNCTION public.can_access_nutri_data(_nutri_id uuid)
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
  );
$$;

-- Helper: retorna true se o usuário logado é equipe ativa e tem acesso ao paciente
CREATE OR REPLACE FUNCTION public.equipe_can_access_paciente(_paciente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.equipe_membros em
    JOIN public.pacientes p ON p.user_id = em.created_by
    WHERE em.auth_user_id = auth.uid()
      AND em.ativo = true
      AND p.id = _paciente_id
      AND (em.acesso_todos_pacientes = true OR _paciente_id = ANY(em.pacientes_atribuidos))
  );
$$;

-- ==================== PACIENTES ====================
DROP POLICY IF EXISTS "Equipe can view pacientes" ON public.pacientes;
CREATE POLICY "Equipe can view pacientes" ON public.pacientes FOR SELECT TO authenticated
USING (public.equipe_can_access_paciente(id));

DROP POLICY IF EXISTS "Equipe can update pacientes" ON public.pacientes;
CREATE POLICY "Equipe can update pacientes" ON public.pacientes FOR UPDATE TO authenticated
USING (public.equipe_can_access_paciente(id));

DROP POLICY IF EXISTS "Equipe can insert pacientes" ON public.pacientes;
CREATE POLICY "Equipe can insert pacientes" ON public.pacientes FOR INSERT TO authenticated
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== DIARIO_REGISTROS ====================
DROP POLICY IF EXISTS "Equipe can view diario" ON public.diario_registros;
CREATE POLICY "Equipe can view diario" ON public.diario_registros FOR SELECT TO authenticated
USING (public.equipe_can_access_paciente(paciente_id));

DROP POLICY IF EXISTS "Equipe can update diario" ON public.diario_registros;
CREATE POLICY "Equipe can update diario" ON public.diario_registros FOR UPDATE TO authenticated
USING (public.equipe_can_access_paciente(paciente_id));

-- ==================== DIARIO_CONFIG ====================
DROP POLICY IF EXISTS "Equipe can manage diario_config" ON public.diario_config;
CREATE POLICY "Equipe can manage diario_config" ON public.diario_config FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== CONVERSAS ====================
DROP POLICY IF EXISTS "Equipe can view conversas" ON public.conversas;
CREATE POLICY "Equipe can view conversas" ON public.conversas FOR SELECT TO authenticated
USING (public.can_access_nutri_data(nutri_id));

DROP POLICY IF EXISTS "Equipe can update conversas" ON public.conversas;
CREATE POLICY "Equipe can update conversas" ON public.conversas FOR UPDATE TO authenticated
USING (public.can_access_nutri_data(nutri_id));

DROP POLICY IF EXISTS "Equipe can insert conversas" ON public.conversas;
CREATE POLICY "Equipe can insert conversas" ON public.conversas FOR INSERT TO authenticated
WITH CHECK (public.can_access_nutri_data(nutri_id));

-- ==================== MENSAGENS ====================
DROP POLICY IF EXISTS "Equipe can view mensagens" ON public.mensagens;
CREATE POLICY "Equipe can view mensagens" ON public.mensagens FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND public.can_access_nutri_data(c.nutri_id)));

DROP POLICY IF EXISTS "Equipe can insert mensagens" ON public.mensagens;
CREATE POLICY "Equipe can insert mensagens" ON public.mensagens FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND public.can_access_nutri_data(c.nutri_id)));

DROP POLICY IF EXISTS "Equipe can update mensagens" ON public.mensagens;
CREATE POLICY "Equipe can update mensagens" ON public.mensagens FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND public.can_access_nutri_data(c.nutri_id)));

-- ==================== CONSULTAS ====================
DROP POLICY IF EXISTS "Equipe can manage consultas" ON public.consultas;
CREATE POLICY "Equipe can manage consultas" ON public.consultas FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== ACOMPANHAMENTOS ====================
DROP POLICY IF EXISTS "Equipe can manage acompanhamentos" ON public.acompanhamentos;
CREATE POLICY "Equipe can manage acompanhamentos" ON public.acompanhamentos FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== AVALIACOES_FISICAS ====================
DROP POLICY IF EXISTS "Equipe can manage avaliacoes" ON public.avaliacoes_fisicas;
CREATE POLICY "Equipe can manage avaliacoes" ON public.avaliacoes_fisicas FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== ANAMNESES ====================
DROP POLICY IF EXISTS "Equipe can manage anamneses" ON public.anamneses;
CREATE POLICY "Equipe can manage anamneses" ON public.anamneses FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== CHECKLIST_RESPOSTAS ====================
DROP POLICY IF EXISTS "Equipe can view checklists" ON public.checklist_respostas;
CREATE POLICY "Equipe can view checklists" ON public.checklist_respostas FOR SELECT TO authenticated
USING (public.equipe_can_access_paciente(paciente_id));

DROP POLICY IF EXISTS "Equipe can insert checklists" ON public.checklist_respostas;
CREATE POLICY "Equipe can insert checklists" ON public.checklist_respostas FOR INSERT TO authenticated
WITH CHECK (public.equipe_can_access_paciente(paciente_id));

-- ==================== ORIENTACOES ====================
DROP POLICY IF EXISTS "Equipe can manage orientacoes" ON public.orientacoes;
CREATE POLICY "Equipe can manage orientacoes" ON public.orientacoes FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== EVOLUCAO_FOTOS ====================
DROP POLICY IF EXISTS "Equipe can manage evolucao_fotos" ON public.evolucao_fotos;
CREATE POLICY "Equipe can manage evolucao_fotos" ON public.evolucao_fotos FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== EXAMES_LABORATORIAIS ====================
DROP POLICY IF EXISTS "Equipe can manage exames" ON public.exames_laboratoriais;
CREATE POLICY "Equipe can manage exames" ON public.exames_laboratoriais FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== CALCULOS_ENERGETICOS ====================
DROP POLICY IF EXISTS "Equipe can manage calculos" ON public.calculos_energeticos;
CREATE POLICY "Equipe can manage calculos" ON public.calculos_energeticos FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== DOCUMENTOS_GERADOS ====================
DROP POLICY IF EXISTS "Equipe can manage docs" ON public.documentos_gerados;
CREATE POLICY "Equipe can manage docs" ON public.documentos_gerados FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== FINANCEIRO_RECEITAS ====================
DROP POLICY IF EXISTS "Equipe can manage receitas" ON public.financeiro_receitas;
CREATE POLICY "Equipe can manage receitas" ON public.financeiro_receitas FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== LEADS ====================
DROP POLICY IF EXISTS "Equipe can manage leads" ON public.leads;
CREATE POLICY "Equipe can manage leads" ON public.leads FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== CONTEUDOS_REAL ====================
DROP POLICY IF EXISTS "Equipe can manage conteudos_real" ON public.conteudos_real;
CREATE POLICY "Equipe can manage conteudos_real" ON public.conteudos_real FOR ALL TO authenticated
USING (public.can_access_nutri_data(user_id))
WITH CHECK (public.can_access_nutri_data(user_id));

-- ==================== CONFIGURACOES_CLINICA ====================
DROP POLICY IF EXISTS "Equipe can view config clinica" ON public.configuracoes_clinica;
CREATE POLICY "Equipe can view config clinica" ON public.configuracoes_clinica FOR SELECT TO authenticated
USING (public.can_access_nutri_data(user_id));

-- ==================== ALIMENTOS_PLANO ====================
DROP POLICY IF EXISTS "Equipe can manage alimentos_plano" ON public.alimentos_plano;
CREATE POLICY "Equipe can manage alimentos_plano" ON public.alimentos_plano FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.refeicoes r JOIN public.planos_alimentares p ON p.id = r.plano_id WHERE r.id = alimentos_plano.refeicao_id AND public.can_access_nutri_data(p.user_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.refeicoes r JOIN public.planos_alimentares p ON p.id = r.plano_id WHERE r.id = alimentos_plano.refeicao_id AND public.can_access_nutri_data(p.user_id)));
