ALTER TABLE public.avaliacoes_fisicas 
  ADD COLUMN IF NOT EXISTS pdf_origem_url text,
  ADD COLUMN IF NOT EXISTS pdf_origem_nome text;