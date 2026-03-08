
-- Enum for who filled the anamnesis
CREATE TYPE public.preenchido_por AS ENUM ('nutricionista', 'paciente');

-- Anamneses table
CREATE TABLE public.anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  objetivos_motivacoes text,
  historico_treino text,
  historico_alimentar text,
  saude_intestinal text,
  sono_estresse text,
  historico_medico text,
  espaco_livre text,
  preenchido_por public.preenchido_por NOT NULL DEFAULT 'nutricionista',
  token text NOT NULL DEFAULT (gen_random_uuid())::text,
  respondido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own anamneses" ON public.anamneses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert anamneses" ON public.anamneses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own anamneses" ON public.anamneses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own anamneses" ON public.anamneses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view anamnese by token" ON public.anamneses FOR SELECT USING (true);
CREATE POLICY "Public can update anamnese by token" ON public.anamneses FOR UPDATE USING (respondido = false) WITH CHECK (respondido = true);
