
-- Add 'equipe' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'equipe';

-- Add deve_trocar_senha to pacientes
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS deve_trocar_senha boolean NOT NULL DEFAULT false;

-- Team members table
CREATE TABLE public.equipe_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  nome_completo text NOT NULL,
  email text NOT NULL,
  telefone text,
  funcao text NOT NULL DEFAULT 'personalizado',
  funcao_personalizada text,
  avatar_url text,
  ativo boolean NOT NULL DEFAULT true,
  permissoes jsonb NOT NULL DEFAULT '{}',
  acesso_todos_pacientes boolean NOT NULL DEFAULT false,
  pacientes_atribuidos uuid[] DEFAULT '{}',
  ultimo_acesso timestamptz,
  deve_trocar_senha boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage equipe" ON public.equipe_membros
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'nutri'))
  WITH CHECK (public.has_role(auth.uid(), 'nutri'));

CREATE POLICY "Equipe can view own record" ON public.equipe_membros
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Equipe can update own record" ON public.equipe_membros
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Patient portal permissions
CREATE TABLE public.paciente_portal_permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE UNIQUE,
  plano_alimentar boolean NOT NULL DEFAULT true,
  checkin_semanal boolean NOT NULL DEFAULT true,
  diario_alimentar boolean NOT NULL DEFAULT true,
  chat boolean NOT NULL DEFAULT true,
  metas boolean NOT NULL DEFAULT true,
  receituario boolean NOT NULL DEFAULT true,
  materiais boolean NOT NULL DEFAULT true,
  avaliacoes_fisicas boolean NOT NULL DEFAULT true,
  evolucao_fotografica boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paciente_portal_permissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage portal perms" ON public.paciente_portal_permissoes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = paciente_portal_permissoes.paciente_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = paciente_portal_permissoes.paciente_id AND p.user_id = auth.uid()));

CREATE POLICY "Paciente can view own portal perms" ON public.paciente_portal_permissoes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pacientes p WHERE p.id = paciente_portal_permissoes.paciente_id AND p.auth_user_id = auth.uid()));

-- Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text,
  acao text NOT NULL,
  tipo text NOT NULL DEFAULT 'outro',
  detalhes text,
  ip_address text,
  referencia_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'nutri'));

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Global user settings
CREATE TABLE public.configuracoes_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  expiracao_sessao_admin integer NOT NULL DEFAULT 12,
  expiracao_sessao_equipe integer NOT NULL DEFAULT 24,
  expiracao_sessao_paciente integer NOT NULL DEFAULT 168,
  tentativas_login integer NOT NULL DEFAULT 5,
  tempo_bloqueio integer NOT NULL DEFAULT 15,
  forcar_troca_senha boolean NOT NULL DEFAULT true,
  enviar_email_boas_vindas boolean NOT NULL DEFAULT true,
  equipe_pode_criar_pacientes boolean NOT NULL DEFAULT false,
  equipe_pode_criar_acessos boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can manage own settings" ON public.configuracoes_usuarios
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
