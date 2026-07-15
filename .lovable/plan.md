## Objetivo

Permitir que admin/nutri altere o e-mail ou a senha de um paciente diretamente na aba **Acesso do Paciente** dentro do perfil.

## Situação atual

- Já existe `PacienteAccessModal` com `mode="edit"` que chama a edge function `manage-patient-auth` (action `update`) para atualizar e-mail e/ou senha.
- Em `PacienteDetalhe.tsx` o modal só é aberto em `mode: "create"` a partir de `AcessoPaciente`. Não há botão para abrir em modo `edit`.
- `AcessoPaciente.tsx` mostra apenas: Criar Acesso / Desativar / Reativar.

## Mudanças

1. **`src/components/paciente/AcessoPaciente.tsx`**
   - Adicionar prop `onEditAccess: () => void`.
   - Adicionar botão "Alterar E-mail/Senha" (ícone `KeyRound` ou `Pencil`) visível quando `status === "ativo"` ou `status === "desativado"` (ou seja, quando `paciente.auth_user_id` existe). Não exibir em `sem_conta`.

2. **`src/pages/PacienteDetalhe.tsx`**
   - Passar `onEditAccess={() => setAccessModal({ open: true, mode: "edit" })}` para `<AcessoPaciente>`.

Nenhuma alteração de backend/edge function é necessária — o fluxo `update` já está implementado e testado.

## Fora de escopo

- UI da aba de Gestão de Usuários (já possui esse fluxo via `PacientesTab`).
- Alterações no header do paciente.