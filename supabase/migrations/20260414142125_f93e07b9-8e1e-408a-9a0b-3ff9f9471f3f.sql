
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Nutri can view exames files" ON storage.objects;

-- Create a scoped SELECT policy that checks the file path starts with the user's ID
CREATE POLICY "Nutri can view own exames files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'exames-laboratoriais'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
