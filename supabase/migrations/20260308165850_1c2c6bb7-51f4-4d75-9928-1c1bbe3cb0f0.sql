
-- Add status, data_inicio, data_fim to planos_alimentares
ALTER TABLE public.planos_alimentares
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date;

-- Add horario_sugerido to refeicoes
ALTER TABLE public.refeicoes
  ADD COLUMN IF NOT EXISTS horario_sugerido text;
