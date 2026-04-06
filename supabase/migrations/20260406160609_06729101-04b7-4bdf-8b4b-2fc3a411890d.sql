
-- Patients can view supplements linked to their prescriptions
CREATE POLICY "Paciente can view prescribed suplementos"
  ON public.suplementos_banco FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prescricoes_suplementos ps
    JOIN pacientes p ON p.id = ps.paciente_id
    WHERE ps.suplemento_id = suplementos_banco.id
    AND p.auth_user_id = auth.uid()
  ));

-- Patients can view actives of their prescribed manipulados
CREATE POLICY "Paciente can view prescribed manipulado_ativos"
  ON public.manipulado_ativos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM suplementos_banco s
    JOIN prescricoes_suplementos ps ON ps.suplemento_id = s.id
    JOIN pacientes p ON p.id = ps.paciente_id
    WHERE manipulado_ativos.suplemento_id = s.id
    AND p.auth_user_id = auth.uid()
  ));

-- Patients can view orientações sent to them
CREATE POLICY "Paciente can view own orientacoes"
  ON public.orientacoes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pacientes p
    WHERE p.id = orientacoes.paciente_id
    AND p.auth_user_id = auth.uid()
  ));
