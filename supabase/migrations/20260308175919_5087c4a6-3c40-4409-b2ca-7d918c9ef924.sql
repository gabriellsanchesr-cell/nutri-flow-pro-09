
-- Configuração do diário por paciente
CREATE TABLE public.diario_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  refeicoes_habilitadas TEXT[] DEFAULT ARRAY['cafe_da_manha','almoco','lanche_da_tarde','jantar'],
  frequencia TEXT NOT NULL DEFAULT 'diario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paciente_id)
);

ALTER TABLE public.diario_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can insert diario_config" ON public.diario_config
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can view own diario_config" ON public.diario_config
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Nutri can update own diario_config" ON public.diario_config
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own diario_config" ON public.diario_config
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Paciente can view own diario_config" ON public.diario_config
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = diario_config.paciente_id AND p.auth_user_id = auth.uid())
  );

-- Registros do diário alimentar
CREATE TABLE public.diario_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  paciente_user_id UUID NOT NULL,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_refeicao TEXT NOT NULL DEFAULT 'outro',
  horario TIME,
  descricao TEXT NOT NULL DEFAULT '',
  foto_path TEXT,
  sentimento TEXT,
  feedback_nutri TEXT,
  feedback_data TIMESTAMPTZ,
  visto_nutri BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diario_registros ENABLE ROW LEVEL SECURITY;

-- Paciente pode inserir e ver seus próprios registros
CREATE POLICY "Paciente can insert own diario" ON public.diario_registros
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = diario_registros.paciente_id AND p.auth_user_id = auth.uid())
  );
CREATE POLICY "Paciente can view own diario" ON public.diario_registros
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = diario_registros.paciente_id AND p.auth_user_id = auth.uid())
  );
CREATE POLICY "Paciente can update own diario" ON public.diario_registros
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = diario_registros.paciente_id AND p.auth_user_id = auth.uid())
  );

-- Nutri pode ver e dar feedback nos registros dos seus pacientes
CREATE POLICY "Nutri can view patient diario" ON public.diario_registros
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = diario_registros.paciente_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Nutri can update patient diario" ON public.diario_registros
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = diario_registros.paciente_id AND p.user_id = auth.uid())
  );

-- Storage bucket para fotos do diário
INSERT INTO storage.buckets (id, name, public) VALUES ('diario-fotos', 'diario-fotos', true);

CREATE POLICY "Paciente can upload diario fotos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'diario-fotos');
CREATE POLICY "Anyone can view diario fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'diario-fotos');
