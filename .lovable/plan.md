

# Check-in Financeiro por Paciente

Criar uma seção "Financeiro" dentro do perfil de cada paciente, que usa a mesma tabela `financeiro_receitas` já existente, filtrada pelo `paciente_id`.

## O que muda

### 1. Nova seção na sidebar do paciente
- Adicionar `{ id: "financeiro", label: "Financeiro", icon: DollarSign, group: "outros" }` em `PacienteSidebar.tsx`

### 2. Novo componente `src/components/paciente/FinanceiroSection.tsx`
- Recebe `paciente` como prop
- Lista todas as receitas do paciente (`financeiro_receitas` filtrado por `paciente_id`)
- Cards resumo no topo: Total pago, Total pendente, Quantidade de registros
- Tabela com colunas: Descrição, Valor, Data, Forma pagamento, Status, Categoria, Ações
- Badges coloridos por status: Pago (verde), Pendente (amarelo), Cancelado (vermelho)
- Botão "Nova Cobrança" abre modal com formulário (descrição, valor, data, forma pagamento, status, categoria, observações)
- Editar e excluir inline
- Troca rápida de status direto na tabela (dropdown que atualiza imediatamente)
- Tudo salva na tabela `financeiro_receitas` com `paciente_id` preenchido, sincronizando automaticamente com o Financeiro geral

### 3. Registrar no `PacienteDetalhe.tsx`
- Importar `FinanceiroSection`
- Adicionar case `"financeiro"` no `renderSection()`

## Nenhuma migration necessária
A tabela `financeiro_receitas` já tem `paciente_id` nullable. Basta filtrar por ele.

## Arquivos modificados
1. `src/components/paciente/PacienteSidebar.tsx` — adicionar item "Financeiro"
2. `src/components/paciente/FinanceiroSection.tsx` — novo componente
3. `src/pages/PacienteDetalhe.tsx` — registrar a seção

