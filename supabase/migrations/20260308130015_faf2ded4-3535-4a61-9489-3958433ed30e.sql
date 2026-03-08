
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('nutri', 'paciente');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 5. RLS policies on user_roles
CREATE POLICY "Nutri can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'nutri'));

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. Add auth_user_id to pacientes
ALTER TABLE public.pacientes ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. Add account_status to pacientes
ALTER TABLE public.pacientes ADD COLUMN account_status text DEFAULT 'sem_conta';

-- 8. RLS: pacientes can view their own record
CREATE POLICY "Paciente can view own record"
ON public.pacientes FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- 9. RLS: pacientes can view their own acompanhamentos
CREATE POLICY "Paciente can view own acompanhamentos"
ON public.acompanhamentos FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM pacientes p
  WHERE p.id = acompanhamentos.paciente_id
  AND p.auth_user_id = auth.uid()
));

-- 10. RLS: pacientes can view their own planos
CREATE POLICY "Paciente can view own planos"
ON public.planos_alimentares FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM pacientes p
  WHERE p.id = planos_alimentares.paciente_id
  AND p.auth_user_id = auth.uid()
));

-- 11. RLS: pacientes can view refeicoes of their planos
CREATE POLICY "Paciente can view own refeicoes"
ON public.refeicoes FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM planos_alimentares pl
  JOIN pacientes p ON p.id = pl.paciente_id
  WHERE pl.id = refeicoes.plano_id
  AND p.auth_user_id = auth.uid()
));

-- 12. RLS: pacientes can view alimentos of their refeicoes
CREATE POLICY "Paciente can view own alimentos"
ON public.alimentos_plano FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM refeicoes r
  JOIN planos_alimentares pl ON pl.id = r.plano_id
  JOIN pacientes p ON p.id = pl.paciente_id
  WHERE r.id = alimentos_plano.refeicao_id
  AND p.auth_user_id = auth.uid()
));

-- 13. Update handle_new_user to assign nutri role based on NUTRI_EMAIL secret
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _nutri_email text;
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''));

  -- Check if this is the nutri email
  BEGIN
    SELECT decrypted_secret INTO _nutri_email
    FROM vault.decrypted_secrets
    WHERE name = 'NUTRI_EMAIL';
  EXCEPTION WHEN OTHERS THEN
    _nutri_email := NULL;
  END;

  IF _nutri_email IS NOT NULL AND NEW.email = _nutri_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'nutri');
  END IF;

  RETURN NEW;
END;
$$;
