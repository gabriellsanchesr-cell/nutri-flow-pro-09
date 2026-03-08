
-- Table: configuracoes_pdf
CREATE TABLE public.configuracoes_pdf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  crn text,
  telefone text,
  site text DEFAULT 'gabrielnutri.com.br',
  logo_url text,
  cor_primaria text DEFAULT '#2B3990',
  incluir_capa boolean DEFAULT true,
  marca_dagua boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.configuracoes_pdf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own config" ON public.configuracoes_pdf FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own config" ON public.configuracoes_pdf FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON public.configuracoes_pdf FOR UPDATE USING (auth.uid() = user_id);

-- Table: documentos_gerados
CREATE TABLE public.documentos_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'plano_alimentar',
  nome text NOT NULL,
  arquivo_path text,
  expires_at timestamptz DEFAULT (now() + interval '90 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documentos_gerados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can CRUD own docs" ON public.documentos_gerados FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Paciente can view own docs" ON public.documentos_gerados FOR SELECT USING (
  EXISTS (SELECT 1 FROM pacientes p WHERE p.id = documentos_gerados.paciente_id AND p.auth_user_id = auth.uid())
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-pdf', 'documentos-pdf', false);

CREATE POLICY "Nutri can upload docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentos-pdf' AND auth.role() = 'authenticated');
CREATE POLICY "Nutri can read own docs" ON storage.objects FOR SELECT USING (bucket_id = 'documentos-pdf' AND auth.role() = 'authenticated');
CREATE POLICY "Nutri can delete own docs" ON storage.objects FOR DELETE USING (bucket_id = 'documentos-pdf' AND auth.role() = 'authenticated');
