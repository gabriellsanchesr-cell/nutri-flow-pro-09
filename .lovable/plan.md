# Melhoria de Responsividade Mobile

Após revisar as principais páginas, identifiquei pontos concretos onde o layout quebra ou fica apertado em telas <768px. Foco: garantir que tudo seja **visível, legível e clicável** no mobile, mantendo o desktop intacto.

## Problemas encontrados

1. **`AppLayout` (main)** — `p-6` (24px) é grande demais para telas de 320-400px. Pouco espaço útil para conteúdo.
2. **`PacienteHeader`** — Os 4-5 botões de ação (Editar, Criar Acesso, Desativar, Excluir) quebram em 2-3 linhas no mobile, ocupando metade da tela. Breadcrumb com nome longo + seção também transborda.
3. **`PacienteDetalhe`** — `<main>` interno usa `p-6`, deixando muito pouco espaço lateral em mobile (já restrito pelo dropdown da sidebar de seções).
4. **`Leads.tsx`** — `grid grid-cols-5` força 5 colunas em qualquer largura; o `overflow-x-auto` não funciona porque o grid não estoura o container, ele só comprime as colunas a ~70px (ilegível no mobile).
5. **`Pacientes.tsx`** — Tabela sem wrapper de scroll horizontal: colunas E-mail/Cadastro são cortadas ou empurram a tabela para fora da viewport.
6. **`PacienteSidebar` mobile** — O dropdown funciona, mas o botão fica colado na borda quando o `<main>` é zerado.

## Correções propostas

### 1. `src/components/AppLayout.tsx`
- Trocar `p-6` por `p-4 md:p-6` no `<main>`.

### 2. `src/components/paciente/PacienteHeader.tsx`
- Padding responsivo: `px-4 md:px-6` em ambos os blocos.
- Breadcrumb: ocultar o item central (nome do paciente) em mobile, manter "Pacientes › [Seção]".
- No mobile: agrupar as ações secundárias (Desativar/Reativar, Excluir) dentro de um `DropdownMenu` "Mais ações" (ícone `MoreVertical`). Manter visíveis apenas **Editar** e o botão principal de acesso.
- Avatar reduzido para `h-10 w-10` no mobile (`md:h-12 md:w-12`).
- Título `text-lg md:text-xl`.

### 3. `src/pages/PacienteDetalhe.tsx`
- `<main>` interno: `p-4 md:p-6`.
- Layout flex já é `flex` (lado a lado no desktop, stack no mobile via `PacienteSidebar` que detecta mobile) — manter.

### 4. `src/pages/Leads.tsx` (Kanban)
- Trocar `grid grid-cols-5 gap-4 overflow-x-auto` por flex horizontal com scroll real:
  ```tsx
  <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
    {STATUS_COLUMNS.map(...) =>
      <div className="w-[260px] shrink-0 snap-start md:w-auto md:flex-1 md:min-w-0">
    }
  </div>
  ```
- No desktop (`md+`) volta a comportamento de grid igualitário; no mobile rola horizontalmente com colunas de largura fixa legível (260px).
- Filtros (busca + select origem): `flex-wrap` para empilhar.

### 5. `src/pages/Pacientes.tsx`
- Envolver `<Table>` em `<div className="overflow-x-auto">` para permitir scroll horizontal sem quebrar layout.
- Ocultar colunas E-mail e Cadastro em telas pequenas (`hidden md:table-cell`), mantendo Nome / Status / Ações sempre visíveis.

### 6. Ajustes adicionais menores
- `src/pages/Financeiro.tsx`: garantir `overflow-x-auto` em tabelas de receitas.
- `src/pages/Agenda.tsx`: padding e gap reduzidos no mobile (`gap-1 p-1.5`) para o calendário 7-col caber em 320px.

## Arquivos a editar
- `src/components/AppLayout.tsx`
- `src/components/paciente/PacienteHeader.tsx`
- `src/pages/PacienteDetalhe.tsx`
- `src/pages/Leads.tsx`
- `src/pages/Pacientes.tsx`
- `src/pages/Financeiro.tsx` (ajuste pequeno em tabelas)
- `src/pages/Agenda.tsx` (ajuste pequeno no calendário)

## Resultado esperado
- Em **375px** (iPhone SE): todas as páginas visíveis sem zoom horizontal; ações principais a um toque.
- Em **768px+**: layout desktop atual preservado.
- Kanban de leads: scroll horizontal natural com snap em mobile; grid igual no desktop.
- Tabelas: scroll horizontal apenas quando necessário, sem quebrar a viewport.

Confirma para eu implementar?
