
-- METAS
CREATE TABLE public.metas_paciente (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL,
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'checklist',
  valor_alvo numeric,
  valor_atual numeric DEFAULT 0,
  unidade text,
  prazo date,
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'em_andamento',
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.metas_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own metas" ON public.metas_paciente
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Equipe can manage metas" ON public.metas_paciente
  FOR ALL TO authenticated USING (can_access_nutri_data(user_id)) WITH CHECK (can_access_nutri_data(user_id));

CREATE POLICY "Paciente can view own metas" ON public.metas_paciente
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = metas_paciente.paciente_id AND p.auth_user_id = auth.uid()));

CREATE POLICY "Paciente can update own metas" ON public.metas_paciente
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = metas_paciente.paciente_id AND p.auth_user_id = auth.uid()));

CREATE TRIGGER trg_metas_paciente_updated
  BEFORE UPDATE ON public.metas_paciente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MATERIAIS
CREATE TABLE public.materiais_paciente (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL,
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  categoria text NOT NULL DEFAULT 'outro',
  tipo text NOT NULL DEFAULT 'arquivo',
  arquivo_path text,
  arquivo_nome text,
  arquivo_mime text,
  url_externa text,
  visto_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.materiais_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own materiais" ON public.materiais_paciente
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Equipe can manage materiais" ON public.materiais_paciente
  FOR ALL TO authenticated USING (can_access_nutri_data(user_id)) WITH CHECK (can_access_nutri_data(user_id));

CREATE POLICY "Paciente can view own materiais" ON public.materiais_paciente
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = materiais_paciente.paciente_id AND p.auth_user_id = auth.uid()));

CREATE POLICY "Paciente can update own materiais" ON public.materiais_paciente
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = materiais_paciente.paciente_id AND p.auth_user_id = auth.uid()));

CREATE TRIGGER trg_materiais_paciente_updated
  BEFORE UPDATE ON public.materiais_paciente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for materiais path under documentos-pdf bucket
CREATE POLICY "Nutri can upload materiais"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = 'materiais');

CREATE POLICY "Nutri can read materiais"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = 'materiais');

CREATE POLICY "Nutri can delete materiais"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = 'materiais');
