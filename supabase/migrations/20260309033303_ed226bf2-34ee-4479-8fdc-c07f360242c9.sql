
-- Enums
CREATE TYPE public.tipo_suplemento AS ENUM ('suplemento', 'manipulado');
CREATE TYPE public.categoria_suplemento AS ENUM (
  'proteinas_aminoacidos', 'vitaminas_minerais', 'omega_gorduras',
  'probioticos_fibras', 'performance_energia', 'fitoterapicos',
  'colageno_pele', 'emagrecimento', 'ganho_massa', 'saude_intestinal',
  'hormonal', 'sono_ansiedade', 'imunidade', 'outro'
);

-- Banco global de suplementos
CREATE TABLE public.suplementos_banco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  tipo tipo_suplemento NOT NULL DEFAULT 'suplemento',
  categoria categoria_suplemento NOT NULL DEFAULT 'outro',
  apresentacao text DEFAULT 'cápsula',
  unidade_medida text DEFAULT 'mg',
  dose_padrao numeric,
  marca_referencia text,
  finalidade text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suplementos_banco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own suplementos_banco"
  ON public.suplementos_banco FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ativos de manipulados
CREATE TABLE public.manipulado_ativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suplemento_id uuid NOT NULL REFERENCES public.suplementos_banco(id) ON DELETE CASCADE,
  nome_ativo text NOT NULL,
  dose numeric,
  unidade text DEFAULT 'mg'
);

ALTER TABLE public.manipulado_ativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage manipulado_ativos"
  ON public.manipulado_ativos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.suplementos_banco s WHERE s.id = manipulado_ativos.suplemento_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.suplementos_banco s WHERE s.id = manipulado_ativos.suplemento_id AND s.user_id = auth.uid()));

-- Prescrições por paciente
CREATE TABLE public.prescricoes_suplementos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  suplemento_id uuid NOT NULL REFERENCES public.suplementos_banco(id) ON DELETE CASCADE,
  dose_prescrita text,
  unidade_dose text,
  frequencia text DEFAULT '1x ao dia',
  momento_uso text DEFAULT 'com refeições',
  duracao text DEFAULT '30 dias',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  farmacia text,
  qtd_capsulas integer,
  instrucoes_farmacia text,
  observacoes_paciente text,
  observacoes_internas text,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prescricoes_suplementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own prescricoes"
  ON public.prescricoes_suplementos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Paciente can view own prescricoes"
  ON public.prescricoes_suplementos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = prescricoes_suplementos.paciente_id AND p.auth_user_id = auth.uid()));
