

# Login Inteligente e Gestão Completa de Acesso

## O que existe hoje
- Tabelas `user_roles`, `profiles`, `pacientes` com `auth_user_id` e `account_status` já criados
- Edge function `manage-patient-auth` já implementada (create, deactivate, reactivate, delete)
- `useAuth` já tem `role`, `isNutri`, `isPaciente`
- `MeuPainel.tsx` já existe para pacientes
- Login básico sem detecção de conta desativada
- Cores atuais usam HSL ~233 38% (mais lilás), precisam ajustar para #2B3990 exato

## Mudanças necessárias

### 1. Atualizar identidade visual
Ajustar CSS variables em `index.css` para as cores exatas:
- Primary: #2B3990 (HSL ~233 54% 37%)
- Background: #F4F5FA (HSL ~230 33% 97%)
- Foreground/Text: #1A1F3C (HSL ~233 40% 17%)
- Destaque: #5B6EC7 (HSL ~233 47% 57%)
- Sidebar: tons mais escuros de #2B3990

### 2. Refatorar Login.tsx
- Remover link "Esqueci minha senha" para admin (mostrar apenas se não for email admin — na prática, manter o link genérico mas funcional só para pacientes)
- Tratar erro de usuário banido: interceptar resposta do Supabase e mostrar "Seu acesso está temporariamente suspenso. Entre em contato com seu nutricionista."
- Mensagem genérica para credenciais inválidas: "E-mail ou senha incorretos."
- Redirecionamento automático por role já funciona via `useAuth` + `App.tsx`
- Remover qualquer referência a cadastro público
- Visual: logo centralizada no topo, layout limpo

### 3. Refatorar App.tsx — Rotas por role
- Criar `NutriRoute` wrapper: redireciona para `/meu-painel` se `isPaciente`
- Criar `PacienteRoute` wrapper: redireciona para `/` se `isNutri`
- Rotas admin (`/`, `/pacientes`, etc.) protegidas com `NutriRoute`
- Rota `/meu-painel` protegida com `PacienteRoute`

### 4. Refatorar Pacientes.tsx — Tabela com gestão completa
Substituir grid de cards por tabela com colunas:
- Nome, E-mail, Status (Ativo/Inativo/Sem conta), Data cadastro, Último acesso, Ações
- Menu de ações por linha: Ativar, Desativar, Editar, Excluir
- Botão "Novo Paciente" abre modal com: nome, email, senha inicial
- Modal de exclusão com confirmação dupla ("Tem certeza? Esta ação não pode ser desfeita.")

### 5. Criar PacienteAccessModal.tsx
Modal reutilizável para:
- **Criar acesso**: campos nome, email, senha — chama edge function `manage-patient-auth` action=create
- **Editar**: alterar nome/email/senha do paciente

### 6. Atualizar PacienteDetalhe.tsx
Adicionar seção de gestão de acesso no topo:
- Badge de status da conta (Ativo/Inativo/Sem conta)
- Botões: Criar acesso, Desativar, Reativar, Excluir (conforme status)

### 7. Atualizar edge function manage-patient-auth
- Adicionar action `update` para editar email/senha do paciente via `auth.admin.updateUserById`
- A função já valida que caller tem role `nutri`

### 8. Atualizar useAuth para tratar banimento
- No login flow, detectar erro "User is banned" e traduzir para mensagem amigável

### 9. Config.toml — JWT settings
- Adicionar `[functions.manage-patient-auth] verify_jwt = false` para validação manual no código

## Arquivos a criar/modificar
- `src/index.css` — cores
- `src/pages/Login.tsx` — redesign + tratamento de erros
- `src/App.tsx` — NutriRoute/PacienteRoute
- `src/pages/Pacientes.tsx` — tabela com ações
- `src/pages/PacienteDetalhe.tsx` — gestão de acesso
- `src/components/PacienteAccessModal.tsx` — novo modal
- `src/components/DeleteConfirmModal.tsx` — confirmação dupla
- `supabase/functions/manage-patient-auth/index.ts` — add update action
- `supabase/config.toml` — verify_jwt config

