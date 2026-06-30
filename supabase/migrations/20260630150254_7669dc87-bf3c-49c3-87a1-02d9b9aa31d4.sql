
ALTER TABLE public.avaliacoes_fisicas
  ADD COLUMN IF NOT EXISTS circ_braco_contraido_esq numeric,
  ADD COLUMN IF NOT EXISTS circ_braco_contraido_dir numeric,
  ADD COLUMN IF NOT EXISTS circ_antebraco_esq numeric,
  ADD COLUMN IF NOT EXISTS circ_antebraco_dir numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_proximal_esq numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_proximal_dir numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_medial_esq numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_medial_dir numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_distal_esq numeric,
  ADD COLUMN IF NOT EXISTS circ_coxa_distal_dir numeric,
  ADD COLUMN IF NOT EXISTS circ_panturrilha_esq numeric,
  ADD COLUMN IF NOT EXISTS circ_panturrilha_dir numeric;
