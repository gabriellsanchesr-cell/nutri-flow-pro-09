
-- Create enum for orientacao categories
CREATE TYPE public.categoria_orientacao AS ENUM (
  'alimentacao', 'hidratacao', 'sono', 'treino', 'intestino', 'comportamento', 'outro'
);

-- Create exames_laboratoriais table
CREATE TABLE public.exames_laboratoriais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nome_exame text NOT NULL,
  data_coleta date NOT NULL DEFAULT CURRENT_DATE,
  arquivo_path text NOT NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exames_laboratoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own exames" ON public.exames_laboratoriais FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert exames" ON public.exames_laboratoriais FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own exames" ON public.exames_laboratoriais FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own exames" ON public.exames_laboratoriais FOR DELETE USING (auth.uid() = user_id);

-- Create orientacoes table
CREATE TABLE public.orientacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  categoria categoria_orientacao NOT NULL DEFAULT 'outro',
  enviada boolean NOT NULL DEFAULT false,
  data_envio timestamptz,
  visualizada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orientacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own orientacoes" ON public.orientacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert orientacoes" ON public.orientacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own orientacoes" ON public.orientacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own orientacoes" ON public.orientacoes FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for exams
INSERT INTO storage.buckets (id, name, public) VALUES ('exames-laboratoriais', 'exames-laboratoriais', true);

-- Storage policies for exames bucket
CREATE POLICY "Nutri can upload exames" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exames-laboratoriais' AND auth.uid() IS NOT NULL);
CREATE POLICY "Nutri can view exames files" ON storage.objects FOR SELECT USING (bucket_id = 'exames-laboratoriais');
CREATE POLICY "Nutri can delete exames files" ON storage.objects FOR DELETE USING (bucket_id = 'exames-laboratoriais' AND auth.uid() IS NOT NULL);
