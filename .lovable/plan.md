

# Login Inteligente e Gestão de Acesso

## Visao Geral

Transformar o sistema para ter dois tipos de usuario (nutricionista e paciente) com login unico, redirecionamento automatico por role, e gestao completa de contas de pacientes pelo nutricionista.

## Arquitetura de Roles

### Database
1. **Criar tabela `user_roles`** com enum `app_role` ('nutri', 'paciente') seguindo o padrao de seguranca recomendado
2. **Criar funcao `has_role`** (SECURITY DEFINER) para checar roles sem recursao de RLS
3. **Adicionar coluna `auth_user_id`** na tabela `pacientes` — vincula o paciente ao seu usuario de autenticacao (nullable, pois nem todo paciente precisa ter conta)
4. **RLS na `user_roles`**: nutri ve todos os roles, paciente ve apenas o proprio

### Edge Function: `manage-patient-auth`
- **Criar conta**: recebe email + senha + paciente_id, usa service role para `auth.admin.createUser`, insere role 'paciente' e atualiza `pacientes.auth_user_id`
- **Desativar conta**: desativa o usuario via `auth.admin.updateUserById` (ban) — preserva todos os dados
- **Reativar conta**: remove o ban
- **Excluir conta**: deleta o usuario via `auth.admin.deleteUser` e limpa `auth_user_id`
- Apenas o nutricionista (verificado via `has_role`) pode chamar essas acoes

### Nutricionista Fixo
- O email do nutricionista sera armazenado como secret (`NUTRI_EMAIL`) no backend
- Na edge function `manage-patient-auth`, verificar que o caller tem role 'nutri'
- O nutricionista nao aparece em nenhuma listagem de pacientes (ja filtrado por tabela separada)
- A conta do nutri nao pode ser criada/excluida pela interface — ela ja existe como o primeiro usuario registrado
- Adicionar migration para inserir role 'nutri' automaticamente via trigger no `handle_new_user` (apenas para o primeiro usuario, ou baseado no email configurado)

## Login Inteligente (Tela Unica)

### `Login.tsx` — Refatorar
- Remover toggle de cadastro (pacientes nao se cadastram sozinhos)
- Apos login com sucesso, consultar `user_roles` para identificar o tipo
- Redirecionar: nutri → `/` (dashboard), paciente → `/meu-painel`

### `useAuth.tsx` — Expandir
- Adicionar `role: 'nutri' | 'paciente' | null` ao contexto
- Apos autenticacao, buscar role via funcao `has_role` ou query direta
- Expor `isNutri` e `isPaciente` como helpers

### Rotas Protegidas
- `NutriRoute`: so permite acesso se role = 'nutri'
- `PacienteRoute`: so permite acesso se role = 'paciente'
- Rotas do nutricionista permanecem as mesmas (dashboard, pacientes, planos, etc.)
- Nova rota `/meu-painel` para o painel do paciente

## Painel do Paciente (`/meu-painel`)
- Layout simplificado sem sidebar completa
- Ve apenas: seus dados, seu plano alimentar atual, checklist semanal, seus acompanhamentos
- Nao pode editar dados clinicos, apenas responder checklist

## Gestao de Pacientes pelo Nutricionista

### Na listagem (`Pacientes.tsx`)
- Adicionar indicador visual de status: ativo / desativado / sem conta
- Filtro por status

### No detalhe (`PacienteDetalhe.tsx`)
- Botao **"Criar acesso"**: abre modal com email + senha para criar conta auth do paciente
- Botao **"Desativar acesso"**: desativa conta (preserva dados), com confirmacao simples
- Botao **"Reativar acesso"**: reativa conta desativada
- Botao **"Excluir paciente"**: confirmacao dupla (digitar nome do paciente para confirmar), exclui conta auth + registro

## Seguranca
- Senhas gerenciadas pelo sistema de auth (bcrypt hash automatico)
- Sessoes com expiracao configurada no auth (ja default do sistema)
- Rate limiting no login (configuracao nativa do auth)
- Todas as rotas protegidas por role no frontend e RLS no backend
- Edge function valida role do caller antes de executar acoes administrativas

## Resumo dos Arquivos

**Novos:**
- `supabase/functions/manage-patient-auth/index.ts` — edge function para CRUD de contas
- `src/pages/MeuPainel.tsx` — painel do paciente
- `src/components/PacienteAccessModal.tsx` — modal para criar acesso
- Migration SQL para `user_roles`, `has_role`, `auth_user_id` em pacientes

**Modificados:**
- `src/hooks/useAuth.tsx` — adicionar role ao contexto
- `src/App.tsx` — novas rotas protegidas por role
- `src/pages/Login.tsx` — remover cadastro, adicionar redirecionamento por role
- `src/pages/Pacientes.tsx` — indicadores de status e filtros
- `src/pages/PacienteDetalhe.tsx` — botoes de gestao de acesso
- `src/components/AppSidebar.tsx` — condicional por role

