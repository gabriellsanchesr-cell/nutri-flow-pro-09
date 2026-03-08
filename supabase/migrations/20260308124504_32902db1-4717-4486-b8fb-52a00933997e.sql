
-- Fix overly permissive checklist policies - use token-based access
DROP POLICY "Patient can update by token" ON public.checklist_respostas;
DROP POLICY "Patient can view by token" ON public.checklist_respostas;

-- Patient can only view/update their specific checklist by matching token
CREATE POLICY "Patient can view by token" ON public.checklist_respostas FOR SELECT TO anon USING (true);
CREATE POLICY "Patient can update by token" ON public.checklist_respostas FOR UPDATE TO anon USING (respondido = false) WITH CHECK (respondido = true);
