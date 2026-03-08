
-- Enums for questionarios
CREATE TYPE public.tipo_questionario AS ENUM ('anamnese', 'checkin_semanal', 'qualidade_vida', 'comportamento_alimentar', 'sintomas_intestinais');
CREATE TYPE public.status_questionario AS ENUM ('pendente', 'enviado', 'respondido');

-- Questionarios table
CREATE TABLE public.questionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo public.tipo_questionario NOT NULL,
  status public.status_questionario NOT NULL DEFAULT 'pendente',
  data_envio timestamptz,
  data_resposta timestamptz,
  token text NOT NULL DEFAULT (gen_random_uuid())::text,
  respostas jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.questionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own questionarios" ON public.questionarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert questionarios" ON public.questionarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own questionarios" ON public.questionarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own questionarios" ON public.questionarios FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view questionario by token" ON public.questionarios FOR SELECT USING (true);
CREATE POLICY "Public can update questionario by token" ON public.questionarios FOR UPDATE USING (status != 'respondido') WITH CHECK (status = 'respondido');
