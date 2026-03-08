
-- Table: receitas (recipe bank)
CREATE TABLE public.receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text DEFAULT '',
  modo_preparo text DEFAULT '',
  tempo_preparo_min integer,
  porcoes integer DEFAULT 1,
  ingredientes jsonb DEFAULT '[]'::jsonb,
  calorias_total numeric DEFAULT 0,
  proteina_total numeric DEFAULT 0,
  carboidrato_total numeric DEFAULT 0,
  gordura_total numeric DEFAULT 0,
  fibra_total numeric DEFAULT 0,
  tags text[] DEFAULT '{}',
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can insert own receitas" ON public.receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can view own receitas" ON public.receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can update own receitas" ON public.receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own receitas" ON public.receitas FOR DELETE USING (auth.uid() = user_id);

-- Table: receitas_pacientes (assignment of recipes to patients)
CREATE TABLE public.receitas_pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id uuid NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enviada_em timestamptz NOT NULL DEFAULT now(),
  visualizada boolean DEFAULT false,
  UNIQUE(receita_id, paciente_id)
);

ALTER TABLE public.receitas_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can insert receitas_pacientes" ON public.receitas_pacientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can view own receitas_pacientes" ON public.receitas_pacientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete receitas_pacientes" ON public.receitas_pacientes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Paciente can view own receitas_pacientes" ON public.receitas_pacientes FOR SELECT USING (
  EXISTS (SELECT 1 FROM pacientes p WHERE p.id = receitas_pacientes.paciente_id AND p.auth_user_id = auth.uid())
);
CREATE POLICY "Paciente can update own receitas_pacientes" ON public.receitas_pacientes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pacientes p WHERE p.id = receitas_pacientes.paciente_id AND p.auth_user_id = auth.uid())
);

-- Allow patients to read assigned receitas via a separate policy
CREATE POLICY "Paciente can view assigned receitas" ON public.receitas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM receitas_pacientes rp
    JOIN pacientes p ON p.id = rp.paciente_id
    WHERE rp.receita_id = receitas.id AND p.auth_user_id = auth.uid()
  )
);
