
-- Permite rótulo livre para refeições (ex.: "Pré-treino", "Café da manhã / pós-treino")
ALTER TABLE public.refeicoes
  ADD COLUMN IF NOT EXISTS nome_customizado text;

-- Suporte a múltiplas opções (A/B/C) por refeição
ALTER TABLE public.alimentos_plano
  ADD COLUMN IF NOT EXISTS opcao char(1) NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS precisa_revisao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

UPDATE public.alimentos_plano SET opcao = 'A' WHERE opcao IS NULL;

CREATE INDEX IF NOT EXISTS idx_alimentos_plano_refeicao_opcao
  ON public.alimentos_plano(refeicao_id, opcao, ordem);

-- Substituições estruturadas por alimento
CREATE TABLE IF NOT EXISTS public.alimento_substituicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alimento_plano_id uuid NOT NULL REFERENCES public.alimentos_plano(id) ON DELETE CASCADE,
  nome text NOT NULL,
  quantidade numeric DEFAULT 100,
  medida_caseira text DEFAULT '1 porção',
  alimento_taco_id integer,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alimento_substituicoes_alimento
  ON public.alimento_substituicoes(alimento_plano_id, ordem);

ALTER TABLE public.alimento_substituicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own substituicoes"
ON public.alimento_substituicoes
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.alimentos_plano ap
  JOIN public.refeicoes r ON r.id = ap.refeicao_id
  JOIN public.planos_alimentares p ON p.id = r.plano_id
  WHERE ap.id = alimento_substituicoes.alimento_plano_id
    AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.alimentos_plano ap
  JOIN public.refeicoes r ON r.id = ap.refeicao_id
  JOIN public.planos_alimentares p ON p.id = r.plano_id
  WHERE ap.id = alimento_substituicoes.alimento_plano_id
    AND p.user_id = auth.uid()
));

CREATE POLICY "Equipe can manage substituicoes"
ON public.alimento_substituicoes
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.alimentos_plano ap
  JOIN public.refeicoes r ON r.id = ap.refeicao_id
  JOIN public.planos_alimentares p ON p.id = r.plano_id
  WHERE ap.id = alimento_substituicoes.alimento_plano_id
    AND public.can_access_nutri_data(p.user_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.alimentos_plano ap
  JOIN public.refeicoes r ON r.id = ap.refeicao_id
  JOIN public.planos_alimentares p ON p.id = r.plano_id
  WHERE ap.id = alimento_substituicoes.alimento_plano_id
    AND public.can_access_nutri_data(p.user_id)
));

CREATE POLICY "Paciente can view own substituicoes"
ON public.alimento_substituicoes
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.alimentos_plano ap
  JOIN public.refeicoes r ON r.id = ap.refeicao_id
  JOIN public.planos_alimentares pl ON pl.id = r.plano_id
  JOIN public.pacientes p ON p.id = pl.paciente_id
  WHERE ap.id = alimento_substituicoes.alimento_plano_id
    AND p.auth_user_id = auth.uid()
));
