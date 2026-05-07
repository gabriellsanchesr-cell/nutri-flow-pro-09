
CREATE TABLE public.alimentos_personalizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  grupo grupo_alimentar NOT NULL DEFAULT 'outros',
  quantidade_base numeric NOT NULL DEFAULT 100,
  medida_caseira text DEFAULT '1 porção',
  energia_kcal numeric NOT NULL DEFAULT 0,
  proteina_g numeric NOT NULL DEFAULT 0,
  carboidrato_g numeric NOT NULL DEFAULT 0,
  lipidio_g numeric NOT NULL DEFAULT 0,
  fibra_g numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alimentos_personalizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can manage own alimentos personalizados"
  ON public.alimentos_personalizados FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Equipe can manage alimentos personalizados"
  ON public.alimentos_personalizados FOR ALL TO authenticated
  USING (can_access_nutri_data(user_id)) WITH CHECK (can_access_nutri_data(user_id));

CREATE INDEX idx_alimentos_personalizados_user ON public.alimentos_personalizados(user_id);
CREATE INDEX idx_alimentos_personalizados_nome ON public.alimentos_personalizados USING gin (to_tsvector('portuguese', nome));

CREATE TRIGGER update_alimentos_personalizados_updated_at
  BEFORE UPDATE ON public.alimentos_personalizados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
