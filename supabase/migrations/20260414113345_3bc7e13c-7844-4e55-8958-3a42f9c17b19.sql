
-- 1. Fix configuracoes_clinica: restrict SELECT and UPDATE to authenticated only
DROP POLICY IF EXISTS "Users can view own config" ON public.configuracoes_clinica;
CREATE POLICY "Users can view own config"
ON public.configuracoes_clinica
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own config" ON public.configuracoes_clinica;
CREATE POLICY "Users can update own config"
ON public.configuracoes_clinica
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix conteudo-real public bucket: replace broad SELECT with scoped policy
-- Drop the overly permissive default public bucket policy
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "public_read_conteudo_real" ON storage.objects;

-- Create a scoped read policy for conteudo-real bucket (authenticated users only)
CREATE POLICY "Authenticated can read conteudo_real"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'conteudo-real');
