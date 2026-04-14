
-- Remove overly permissive anon policies
DROP POLICY IF EXISTS "Patient can view by token" ON public.checklist_respostas;
DROP POLICY IF EXISTS "Patient can update by token" ON public.checklist_respostas;

-- Secure RPC to get checklist by token
CREATE OR REPLACE FUNCTION public.get_checklist_by_token(p_token text)
RETURNS TABLE(id uuid, paciente_id uuid, semana date, peso numeric, nivel_energia integer, qualidade_sono integer, aderencia_plano integer, observacoes text, respondido boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, paciente_id, semana, peso, nivel_energia, qualidade_sono, aderencia_plano, observacoes, respondido
  FROM public.checklist_respostas
  WHERE token = p_token
  LIMIT 1;
$$;

-- Secure RPC to submit checklist by token
CREATE OR REPLACE FUNCTION public.submit_checklist(
  p_token text,
  p_peso numeric DEFAULT NULL,
  p_nivel_energia integer DEFAULT NULL,
  p_qualidade_sono integer DEFAULT NULL,
  p_aderencia_plano integer DEFAULT NULL,
  p_observacoes text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.checklist_respostas
  SET
    peso = p_peso,
    nivel_energia = p_nivel_energia,
    qualidade_sono = p_qualidade_sono,
    aderencia_plano = p_aderencia_plano,
    observacoes = p_observacoes,
    respondido = true
  WHERE token = p_token AND respondido = false;

  RETURN FOUND;
END;
$$;
