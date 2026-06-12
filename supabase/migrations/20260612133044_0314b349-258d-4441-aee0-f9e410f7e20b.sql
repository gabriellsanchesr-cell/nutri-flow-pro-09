ALTER TABLE public.refeicoes
  ADD COLUMN IF NOT EXISTS totais_opcao jsonb NOT NULL DEFAULT '{}'::jsonb;