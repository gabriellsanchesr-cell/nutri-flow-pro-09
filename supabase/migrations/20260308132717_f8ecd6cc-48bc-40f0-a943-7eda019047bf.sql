
-- Evolucao fotos table
CREATE TABLE public.evolucao_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  data_registro date NOT NULL DEFAULT CURRENT_DATE,
  angulo text NOT NULL DEFAULT 'frente',
  foto_path text NOT NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evolucao_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own evolucao_fotos" ON public.evolucao_fotos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert evolucao_fotos" ON public.evolucao_fotos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own evolucao_fotos" ON public.evolucao_fotos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own evolucao_fotos" ON public.evolucao_fotos FOR DELETE USING (auth.uid() = user_id);

-- Storage RLS for evolucao-fotos bucket
CREATE POLICY "Nutri can upload evolucao fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evolucao-fotos' AND auth.role() = 'authenticated');
CREATE POLICY "Nutri can delete evolucao fotos" ON storage.objects FOR DELETE USING (bucket_id = 'evolucao-fotos' AND auth.role() = 'authenticated');
CREATE POLICY "Public can view evolucao fotos" ON storage.objects FOR SELECT USING (bucket_id = 'evolucao-fotos');
