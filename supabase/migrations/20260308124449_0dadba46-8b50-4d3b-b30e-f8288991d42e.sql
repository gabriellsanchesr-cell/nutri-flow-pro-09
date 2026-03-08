
-- Enums
CREATE TYPE public.objetivo_principal AS ENUM ('emagrecimento', 'ganho_de_massa', 'saude_intestinal', 'controle_ansiedade_alimentar', 'performance', 'outro');
CREATE TYPE public.nivel_atividade AS ENUM ('sedentario', 'leve', 'moderado', 'intenso', 'muito_intenso');
CREATE TYPE public.fase_real AS ENUM ('rotina', 'estrategia', 'autonomia', 'liberdade');
CREATE TYPE public.tipo_consulta AS ENUM ('primeira_consulta', 'retorno', 'online', 'presencial');
CREATE TYPE public.status_consulta AS ENUM ('agendado', 'realizado', 'cancelado');
CREATE TYPE public.tipo_refeicao AS ENUM ('cafe_da_manha', 'lanche_da_manha', 'almoco', 'lanche_da_tarde', 'jantar', 'ceia');
CREATE TYPE public.grupo_alimentar AS ENUM ('cereais', 'verduras', 'frutas', 'leguminosas', 'oleaginosas', 'carnes', 'leites', 'ovos', 'oleos', 'acucares', 'outros');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles (nutricionista)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  crn TEXT,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pacientes
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE,
  sexo TEXT,
  telefone TEXT,
  email TEXT,
  peso_inicial NUMERIC(5,2),
  altura NUMERIC(3,2),
  objetivo objetivo_principal DEFAULT 'outro',
  objetivo_outro TEXT,
  restricoes_alimentares TEXT,
  alergias TEXT,
  historico_patologias TEXT,
  medicamentos TEXT,
  nivel_atividade nivel_atividade DEFAULT 'sedentario',
  rotina_sono TEXT,
  observacoes_comportamentais TEXT,
  fase_real fase_real DEFAULT 'rotina',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own patients" ON public.pacientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert patients" ON public.pacientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own patients" ON public.pacientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own patients" ON public.pacientes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alimentos TACO (public, no RLS needed for read)
CREATE TABLE public.alimentos_taco (
  id SERIAL PRIMARY KEY,
  numero INTEGER,
  nome TEXT NOT NULL,
  grupo grupo_alimentar DEFAULT 'outros',
  energia_kcal NUMERIC(7,2) DEFAULT 0,
  proteina_g NUMERIC(7,2) DEFAULT 0,
  carboidrato_g NUMERIC(7,2) DEFAULT 0,
  lipidio_g NUMERIC(7,2) DEFAULT 0,
  fibra_g NUMERIC(7,2) DEFAULT 0
);
ALTER TABLE public.alimentos_taco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read taco" ON public.alimentos_taco FOR SELECT USING (true);

-- Planos Alimentares
CREATE TABLE public.planos_alimentares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Plano Alimentar',
  observacoes TEXT,
  is_template BOOLEAN DEFAULT false,
  objetivo_template objetivo_principal,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own plans" ON public.planos_alimentares FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert plans" ON public.planos_alimentares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own plans" ON public.planos_alimentares FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own plans" ON public.planos_alimentares FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_planos_updated_at BEFORE UPDATE ON public.planos_alimentares FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Refeições
CREATE TABLE public.refeicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.planos_alimentares(id) ON DELETE CASCADE,
  tipo tipo_refeicao NOT NULL,
  observacoes TEXT,
  substituicoes_sugeridas TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.refeicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own refeicoes" ON public.refeicoes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.planos_alimentares p WHERE p.id = plano_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can insert refeicoes" ON public.refeicoes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.planos_alimentares p WHERE p.id = plano_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can update refeicoes" ON public.refeicoes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.planos_alimentares p WHERE p.id = plano_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can delete refeicoes" ON public.refeicoes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.planos_alimentares p WHERE p.id = plano_id AND p.user_id = auth.uid())
);

-- Alimentos do plano (itens dentro de cada refeição)
CREATE TABLE public.alimentos_plano (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refeicao_id UUID NOT NULL REFERENCES public.refeicoes(id) ON DELETE CASCADE,
  alimento_taco_id INTEGER REFERENCES public.alimentos_taco(id),
  nome_alimento TEXT NOT NULL,
  quantidade NUMERIC(7,2) DEFAULT 100,
  medida_caseira TEXT DEFAULT '1 porção',
  energia_kcal NUMERIC(7,2) DEFAULT 0,
  proteina_g NUMERIC(7,2) DEFAULT 0,
  carboidrato_g NUMERIC(7,2) DEFAULT 0,
  lipidio_g NUMERIC(7,2) DEFAULT 0,
  fibra_g NUMERIC(7,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alimentos_plano ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own alimentos_plano" ON public.alimentos_plano FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.refeicoes r JOIN public.planos_alimentares p ON p.id = r.plano_id WHERE r.id = refeicao_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can insert alimentos_plano" ON public.alimentos_plano FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.refeicoes r JOIN public.planos_alimentares p ON p.id = r.plano_id WHERE r.id = refeicao_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can update alimentos_plano" ON public.alimentos_plano FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.refeicoes r JOIN public.planos_alimentares p ON p.id = r.plano_id WHERE r.id = refeicao_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can delete alimentos_plano" ON public.alimentos_plano FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.refeicoes r JOIN public.planos_alimentares p ON p.id = r.plano_id WHERE r.id = refeicao_id AND p.user_id = auth.uid())
);

-- Acompanhamentos
CREATE TABLE public.acompanhamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  peso NUMERIC(5,2),
  circunferencia_abdominal NUMERIC(5,2),
  circunferencia_quadril NUMERIC(5,2),
  foto_url TEXT,
  nivel_energia INTEGER CHECK (nivel_energia BETWEEN 1 AND 5),
  qualidade_sono INTEGER CHECK (qualidade_sono BETWEEN 1 AND 5),
  aderencia_plano INTEGER CHECK (aderencia_plano BETWEEN 0 AND 100),
  observacoes_paciente TEXT,
  observacoes_nutricionista TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acompanhamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own acompanhamentos" ON public.acompanhamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert acompanhamentos" ON public.acompanhamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own acompanhamentos" ON public.acompanhamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own acompanhamentos" ON public.acompanhamentos FOR DELETE USING (auth.uid() = user_id);

-- Consultas (agenda)
CREATE TABLE public.consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo tipo_consulta DEFAULT 'retorno',
  status status_consulta DEFAULT 'agendado',
  anotacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own consultas" ON public.consultas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert consultas" ON public.consultas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own consultas" ON public.consultas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own consultas" ON public.consultas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_consultas_updated_at BEFORE UPDATE ON public.consultas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Substituições (biblioteca)
CREATE TABLE public.substituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo grupo_alimentar NOT NULL,
  alimento_original TEXT NOT NULL,
  alimento_substituto TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.substituicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri can view own substituicoes" ON public.substituicoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert substituicoes" ON public.substituicoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own substituicoes" ON public.substituicoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own substituicoes" ON public.substituicoes FOR DELETE USING (auth.uid() = user_id);

-- Checklist respostas (paciente responde sem auth)
CREATE TABLE public.checklist_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  semana DATE NOT NULL DEFAULT CURRENT_DATE,
  peso NUMERIC(5,2),
  nivel_energia INTEGER CHECK (nivel_energia BETWEEN 1 AND 5),
  qualidade_sono INTEGER CHECK (qualidade_sono BETWEEN 1 AND 5),
  aderencia_plano INTEGER CHECK (aderencia_plano BETWEEN 0 AND 100),
  observacoes TEXT,
  respondido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_respostas ENABLE ROW LEVEL SECURITY;
-- Nutri can manage checklists
CREATE POLICY "Nutri can view checklists" ON public.checklist_respostas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.user_id = auth.uid())
);
CREATE POLICY "Nutri can insert checklists" ON public.checklist_respostas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.user_id = auth.uid())
);
-- Public access by token for patient to respond
CREATE POLICY "Patient can update by token" ON public.checklist_respostas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Patient can view by token" ON public.checklist_respostas FOR SELECT USING (true);

-- Storage bucket for evolution photos
INSERT INTO storage.buckets (id, name, public) VALUES ('evolucao-fotos', 'evolucao-fotos', true);
CREATE POLICY "Nutri can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evolucao-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'evolucao-fotos');
CREATE POLICY "Nutri can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'evolucao-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);
