

# CRM: Gestão de Leads + Financeiro (Receitas + Dashboard)

Sistema exclusivo para o painel admin/nutri. Pacientes não terão acesso.

## Novas tabelas (migration)

### `leads`
| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL (nutri owner) |
| nome | text | NOT NULL |
| email | text | nullable |
| telefone | text | nullable |
| origem | text | 'indicacao' (indicacao, instagram, site, outro) |
| status | text | 'novo' (novo, em_contato, agendou, converteu, perdido) |
| valor_estimado | numeric | nullable |
| anotacoes | text | nullable |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: nutri CRUD where `auth.uid() = user_id`

### `financeiro_receitas`
| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL |
| paciente_id | uuid | nullable |
| descricao | text | NOT NULL |
| valor | numeric | NOT NULL |
| data_pagamento | date | CURRENT_DATE |
| forma_pagamento | text | 'pix' (pix, dinheiro, cartao, transferencia) |
| status | text | 'pago' (pago, pendente, cancelado) |
| categoria | text | 'consulta' (consulta, pacote, retorno, outro) |
| observacoes | text | nullable |
| created_at | timestamptz | now() |

RLS: nutri CRUD where `auth.uid() = user_id`

## Novas páginas

### 1. `src/pages/Leads.tsx` -- Pipeline de leads
- Kanban board com 5 colunas (novo, em_contato, agendou, converteu, perdido)
- Drag & drop entre colunas para mudar status
- Modal para criar/editar lead com todos os campos
- Filtros por origem e busca por nome
- Contadores por coluna

### 2. `src/pages/Financeiro.tsx` -- Receitas + Dashboard
- Duas abas: **Dashboard** e **Receitas**
- **Aba Dashboard**: cards com faturamento do mês, total recebido, pendentes, ticket médio. Gráfico de barras (Recharts) com faturamento dos últimos 6 meses
- **Aba Receitas**: tabela com listagem, filtros por status/período, botão adicionar receita (modal com formulário), editar e excluir

## Sidebar
- Adicionar "Leads" com ícone `UserPlus` (show: isAdmin)
- Adicionar "Financeiro" com ícone `DollarSign` (show: isAdmin)
- Posicionar após "Relatórios"

## Rotas (App.tsx)
- `/leads` e `/financeiro` dentro do layout admin existente (AdminRoute > AppLayout)

## Arquivos criados/modificados
1. **Migration SQL** -- criar tabelas `leads` e `financeiro_receitas` com RLS
2. `src/pages/Leads.tsx` -- página do pipeline
3. `src/pages/Financeiro.tsx` -- página financeira
4. `src/components/AppSidebar.tsx` -- adicionar itens no menu
5. `src/App.tsx` -- adicionar rotas

