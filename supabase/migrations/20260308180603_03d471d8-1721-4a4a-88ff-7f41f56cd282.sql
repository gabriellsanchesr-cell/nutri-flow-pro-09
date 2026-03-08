
-- New table: calculos_energeticos
CREATE TABLE public.calculos_energeticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  peso numeric,
  altura numeric,
  idade integer,
  sexo text,
  massa_magra numeric,
  formula text,
  fator_atividade numeric,
  fator_injuria numeric,
  adicional_met numeric DEFAULT 0,
  adicional_gestante boolean DEFAULT false,
  trimestre_gestante integer,
  objetivo text DEFAULT 'manutencao',
  percentual_ajuste numeric DEFAULT 0,
  tmb numeric,
  get numeric,
  meta_calorica numeric,
  proteina_g numeric,
  proteina_pct numeric,
  carboidrato_g numeric,
  carboidrato_pct numeric,
  gordura_g numeric,
  gordura_pct numeric,
  distribuicao_refeicoes jsonb
);

ALTER TABLE public.calculos_energeticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can insert own calculos" ON public.calculos_energeticos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can view own calculos" ON public.calculos_energeticos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can update own calculos" ON public.calculos_energeticos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own calculos" ON public.calculos_energeticos FOR DELETE USING (auth.uid() = user_id);

-- Expand avaliacoes_fisicas with new columns
ALTER TABLE public.avaliacoes_fisicas
  ADD COLUMN IF NOT EXISTS circ_pescoco numeric,
  ADD COLUMN IF NOT EXISTS circ_ombro numeric,
  ADD COLUMN IF NOT EXISTS circ_abdomen numeric,
  ADD COLUMN IF NOT EXISTS circ_antebraco numeric,
  ADD COLUMN IF NOT EXISTS circ_braco_contraido numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_proximal numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_medial numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_distal numeric,
  ADD COLUMN IF NOT EXISTS dobra_axilar_media numeric,
  ADD COLUMN IF NOT EXISTS dobra_toracica numeric,
  ADD COLUMN IF NOT EXISTS dobra_panturrilha numeric,
  ADD COLUMN IF NOT EXISTS dobra_supraespinhal numeric,
  ADD COLUMN IF NOT EXISTS diam_punho numeric,
  ADD COLUMN IF NOT EXISTS diam_femur numeric,
  ADD COLUMN IF NOT EXISTS diam_biacromial numeric,
  ADD COLUMN IF NOT EXISTS diam_bicrista numeric,
  ADD COLUMN IF NOT EXISTS bio_percentual_ideal numeric,
  ADD COLUMN IF NOT EXISTS bio_percentual_massa_muscular numeric,
  ADD COLUMN IF NOT EXISTS bio_peso_osseo numeric,
  ADD COLUMN IF NOT EXISTS bio_massa_livre_gordura numeric,
  ADD COLUMN IF NOT EXISTS bio_gordura_visceral numeric,
  ADD COLUMN IF NOT EXISTS altura_sentado numeric,
  ADD COLUMN IF NOT EXISTS altura_joelho numeric,
  ADD COLUMN IF NOT EXISTS envergadura numeric;
