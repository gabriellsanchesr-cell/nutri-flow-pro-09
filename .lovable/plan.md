

# Plan: Fix Patient Access & Visibility Issues

## Issues Found

After auditing all RLS policies and portal code, I identified **3 critical RLS gaps** that prevent patients from seeing data in the portal:

### 1. `suplementos_banco` — No patient SELECT policy
The portal queries `prescricoes_suplementos` joined with `suplementos_banco(nome, tipo, categoria, apresentacao, manipulado_ativos(*))`. Patients can read prescriptions but the join to `suplementos_banco` and `manipulado_ativos` returns null because there's no SELECT policy for patients on these tables.

### 2. `orientacoes` — No patient SELECT policy
Orientações sent by the nutritionist are invisible to patients. No SELECT policy exists for patients on this table.

### 3. `manage-patient-auth` edge function uses `auth.getClaims()`
This method may not be available in all Supabase JS versions. Should fall back to `auth.getUser()` for reliability.

## Changes

### Migration (1 SQL migration)
Add 3 new RLS policies:

```sql
-- Patients can view supplements linked to their prescriptions
CREATE POLICY "Paciente can view prescribed suplementos"
  ON public.suplementos_banco FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prescricoes_suplementos ps
    JOIN pacientes p ON p.id = ps.paciente_id
    WHERE ps.suplemento_id = suplementos_banco.id
    AND p.auth_user_id = auth.uid()
  ));

-- Patients can view actives of their prescribed manipulados
CREATE POLICY "Paciente can view prescribed manipulado_ativos"
  ON public.manipulado_ativos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM suplementos_banco s
    JOIN prescricoes_suplementos ps ON ps.suplemento_id = s.id
    JOIN pacientes p ON p.id = ps.paciente_id
    WHERE manipulado_ativos.suplemento_id = s.id
    AND p.auth_user_id = auth.uid()
  ));

-- Patients can view orientações sent to them
CREATE POLICY "Paciente can view own orientacoes"
  ON public.orientacoes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pacientes p
    WHERE p.id = orientacoes.paciente_id
    AND p.auth_user_id = auth.uid()
  ));
```

### Edge Function Fix: `manage-patient-auth/index.ts`
Replace `auth.getClaims(token)` with `auth.getUser(token)` to ensure compatibility. Extract `callerId` from `user.id` instead of claims.

### No UI changes needed
The portal components already query these tables correctly — they just fail silently due to missing RLS policies. Once policies are added, data will flow automatically.

