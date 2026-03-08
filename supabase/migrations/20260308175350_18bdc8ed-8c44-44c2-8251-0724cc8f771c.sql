
-- Tabela de avaliações físicas completas
CREATE TABLE public.avaliacoes_fisicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Dados básicos
  peso NUMERIC,
  altura NUMERIC,
  imc NUMERIC,
  classificacao_imc TEXT,

  -- Medidas antropométricas
  circ_cintura NUMERIC,
  circ_quadril NUMERIC,
  relacao_cintura_quadril NUMERIC,
  circ_braco_dir NUMERIC,
  circ_braco_esq NUMERIC,
  circ_coxa_dir NUMERIC,
  circ_coxa_esq NUMERIC,
  circ_panturrilha NUMERIC,
  circ_torax NUMERIC,

  -- Dobras cutâneas
  dobra_subescapular NUMERIC,
  dobra_triceps NUMERIC,
  dobra_biceps NUMERIC,
  dobra_peitoral NUMERIC,
  dobra_abdominal NUMERIC,
  dobra_suprailiaca NUMERIC,
  dobra_coxa NUMERIC,
  protocolo_dobras TEXT,
  percentual_gordura_dobras NUMERIC,
  massa_gorda_kg NUMERIC,
  massa_magra_kg NUMERIC,

  -- Bioimpedância
  bio_percentual_gordura NUMERIC,
  bio_massa_gorda NUMERIC,
  bio_massa_muscular NUMERIC,
  bio_agua_corporal NUMERIC,
  bio_metabolismo_basal NUMERIC,
  bio_idade_metabolica NUMERIC,

  -- Observações
  observacoes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can insert avaliacoes" ON public.avaliacoes_fisicas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Nutri can view own avaliacoes" ON public.avaliacoes_fisicas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Nutri can update own avaliacoes" ON public.avaliacoes_fisicas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Nutri can delete own avaliacoes" ON public.avaliacoes_fisicas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Paciente can view own avaliacoes" ON public.avaliacoes_fisicas
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = avaliacoes_fisicas.paciente_id AND p.auth_user_id = auth.uid()
    )
  );
