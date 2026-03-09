
-- Content types enum
CREATE TYPE public.tipo_conteudo AS ENUM ('video', 'pdf', 'texto', 'audio', 'link');
CREATE TYPE public.categoria_conteudo AS ENUM (
  'alimentacao', 'comportamento', 'rotina', 'exercicio', 
  'sono', 'saude_intestinal', 'ansiedade', 'motivacao', 'receitas', 'outro'
);
CREATE TYPE public.status_conteudo AS ENUM ('rascunho', 'publicado');

-- Main content table
CREATE TABLE public.conteudos_real (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fase TEXT NOT NULL DEFAULT 'rotina',
  tipo tipo_conteudo NOT NULL DEFAULT 'texto',
  categoria categoria_conteudo NOT NULL DEFAULT 'outro',
  status status_conteudo NOT NULL DEFAULT 'rascunho',
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo_texto TEXT,
  url_midia TEXT,
  arquivo_path TEXT,
  thumbnail_url TEXT,
  duracao_estimada TEXT,
  tags TEXT[] DEFAULT '{}',
  ordem INTEGER DEFAULT 0,
  obrigatorio BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conteudos_real ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own conteudos" ON public.conteudos_real
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Paciente can view published conteudos" ON public.conteudos_real
  FOR SELECT TO authenticated
  USING (status = 'publicado' AND has_role(auth.uid(), 'paciente'));

-- Visualizations tracking
CREATE TABLE public.conteudo_visualizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_id UUID NOT NULL REFERENCES public.conteudos_real(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  visto BOOLEAN DEFAULT false,
  visto_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conteudo_id, paciente_id)
);

ALTER TABLE public.conteudo_visualizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view all visualizacoes" ON public.conteudo_visualizacoes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nutri'));

CREATE POLICY "Paciente can manage own visualizacoes" ON public.conteudo_visualizacoes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = conteudo_visualizacoes.paciente_id AND p.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = conteudo_visualizacoes.paciente_id AND p.auth_user_id = auth.uid()));

-- Favorites
CREATE TABLE public.conteudo_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_id UUID NOT NULL REFERENCES public.conteudos_real(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conteudo_id, paciente_id)
);

ALTER TABLE public.conteudo_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente can manage own favoritos" ON public.conteudo_favoritos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = conteudo_favoritos.paciente_id AND p.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = conteudo_favoritos.paciente_id AND p.auth_user_id = auth.uid()));

CREATE POLICY "Nutri can view all favoritos" ON public.conteudo_favoritos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nutri'));

-- Manual content unlocks for specific patients
CREATE TABLE public.conteudo_liberacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_id UUID NOT NULL REFERENCES public.conteudos_real(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  liberado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conteudo_id, paciente_id)
);

ALTER TABLE public.conteudo_liberacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage liberacoes" ON public.conteudo_liberacoes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'nutri'))
  WITH CHECK (has_role(auth.uid(), 'nutri'));

CREATE POLICY "Paciente can view own liberacoes" ON public.conteudo_liberacoes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = conteudo_liberacoes.paciente_id AND p.auth_user_id = auth.uid()));

-- Storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('conteudo-real', 'conteudo-real', true);

CREATE POLICY "Nutri can upload content files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'conteudo-real' AND has_role(auth.uid(), 'nutri'));

CREATE POLICY "Anyone can read content files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'conteudo-real');

CREATE POLICY "Nutri can delete content files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'conteudo-real' AND has_role(auth.uid(), 'nutri'));
