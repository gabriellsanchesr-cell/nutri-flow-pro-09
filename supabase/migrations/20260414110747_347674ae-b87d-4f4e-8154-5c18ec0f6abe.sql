
-- 1. Fix anamneses: drop overly permissive public policies
DROP POLICY IF EXISTS "Public can view anamnese by token" ON public.anamneses;
DROP POLICY IF EXISTS "Public can update anamnese by token" ON public.anamneses;

-- 2. Create secure RPC to get anamnese by token
CREATE OR REPLACE FUNCTION public.get_anamnese_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  paciente_id uuid,
  respondido boolean,
  objetivos_motivacoes text,
  historico_treino text,
  historico_alimentar text,
  saude_intestinal text,
  sono_estresse text,
  historico_medico text,
  espaco_livre text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, paciente_id, respondido, objetivos_motivacoes, historico_treino,
         historico_alimentar, saude_intestinal, sono_estresse, historico_medico, espaco_livre
  FROM public.anamneses
  WHERE token = p_token
  LIMIT 1;
$$;

-- 3. Create secure RPC to submit anamnese by token
CREATE OR REPLACE FUNCTION public.submit_anamnese(
  p_token text,
  p_objetivos_motivacoes text DEFAULT '',
  p_historico_treino text DEFAULT '',
  p_historico_alimentar text DEFAULT '',
  p_saude_intestinal text DEFAULT '',
  p_sono_estresse text DEFAULT '',
  p_historico_medico text DEFAULT '',
  p_espaco_livre text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.anamneses
  SET
    objetivos_motivacoes = p_objetivos_motivacoes,
    historico_treino = p_historico_treino,
    historico_alimentar = p_historico_alimentar,
    saude_intestinal = p_saude_intestinal,
    sono_estresse = p_sono_estresse,
    historico_medico = p_historico_medico,
    espaco_livre = p_espaco_livre,
    respondido = true,
    preenchido_por = 'paciente',
    updated_at = now()
  WHERE token = p_token AND respondido = false;

  RETURN FOUND;
END;
$$;

-- 4. Make medical storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('evolucao-fotos', 'exames-laboratoriais', 'diario-fotos');

-- 5. Fix configuracoes_clinica INSERT policy: restrict to authenticated only
DROP POLICY IF EXISTS "Users can insert own config" ON public.configuracoes_clinica;
CREATE POLICY "Users can insert own config"
ON public.configuracoes_clinica
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
