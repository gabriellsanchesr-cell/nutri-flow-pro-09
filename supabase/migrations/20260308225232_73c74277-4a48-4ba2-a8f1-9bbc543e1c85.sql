
-- Table: conversas
CREATE TABLE public.conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutri_id uuid NOT NULL,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  arquivada boolean NOT NULL DEFAULT false,
  ultima_mensagem_texto text,
  ultima_mensagem_em timestamptz,
  nao_lidas_nutri int NOT NULL DEFAULT 0,
  nao_lidas_paciente int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nutri_id, paciente_id)
);
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own conversas" ON public.conversas FOR SELECT USING (auth.uid() = nutri_id);
CREATE POLICY "Nutri can insert own conversas" ON public.conversas FOR INSERT WITH CHECK (auth.uid() = nutri_id);
CREATE POLICY "Nutri can update own conversas" ON public.conversas FOR UPDATE USING (auth.uid() = nutri_id);
CREATE POLICY "Nutri can delete own conversas" ON public.conversas FOR DELETE USING (auth.uid() = nutri_id);
CREATE POLICY "Paciente can view own conversas" ON public.conversas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = conversas.paciente_id AND p.auth_user_id = auth.uid())
);
CREATE POLICY "Paciente can update own conversas" ON public.conversas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = conversas.paciente_id AND p.auth_user_id = auth.uid())
);

-- Table: mensagens
CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'texto',
  arquivo_url text,
  referencia_id uuid,
  lida boolean NOT NULL DEFAULT false,
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view mensagens" ON public.mensagens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND c.nutri_id = auth.uid())
);
CREATE POLICY "Nutri can insert mensagens" ON public.mensagens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND c.nutri_id = auth.uid())
);
CREATE POLICY "Nutri can update mensagens" ON public.mensagens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND c.nutri_id = auth.uid())
);
CREATE POLICY "Paciente can view own mensagens" ON public.mensagens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversas c JOIN public.pacientes p ON p.id = c.paciente_id WHERE c.id = mensagens.conversa_id AND p.auth_user_id = auth.uid())
);
CREATE POLICY "Paciente can insert own mensagens" ON public.mensagens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversas c JOIN public.pacientes p ON p.id = c.paciente_id WHERE c.id = mensagens.conversa_id AND p.auth_user_id = auth.uid())
);
CREATE POLICY "Paciente can update own mensagens" ON public.mensagens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversas c JOIN public.pacientes p ON p.id = c.paciente_id WHERE c.id = mensagens.conversa_id AND p.auth_user_id = auth.uid())
);

-- Table: respostas_rapidas
CREATE TABLE public.respostas_rapidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'geral',
  texto text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.respostas_rapidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own respostas" ON public.respostas_rapidas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert own respostas" ON public.respostas_rapidas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own respostas" ON public.respostas_rapidas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own respostas" ON public.respostas_rapidas FOR DELETE USING (auth.uid() = user_id);

-- Table: notificacoes
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'mensagem',
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  cor text NOT NULL DEFAULT 'azul',
  lida boolean NOT NULL DEFAULT false,
  link text,
  referencia_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notificacoes" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notificacoes" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notificacoes" ON public.notificacoes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;

-- Trigger to update conversas.updated_at
CREATE TRIGGER update_conversas_updated_at
  BEFORE UPDATE ON public.conversas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
