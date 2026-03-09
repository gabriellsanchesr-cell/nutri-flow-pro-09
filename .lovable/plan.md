

# Plan: Módulo de Suplementos e Manipulados

## Database Changes (1 migration)

### New Tables

1. **`suplementos_banco`** — Global supplement/compounded catalog
   - `id`, `user_id`, `nome`, `tipo` (enum: suplemento/manipulado), `categoria` (enum), `apresentacao`, `unidade_medida`, `dose_padrao`, `marca_referencia`, `finalidade` (for manipulados), `observacoes`, `ativo`, `created_at`, `updated_at`
   - RLS: nutri can CRUD own records

2. **`manipulado_ativos`** — Composition of compounded formulas
   - `id`, `suplemento_id` (FK to suplementos_banco), `nome_ativo`, `dose`, `unidade`
   - RLS: nutri can CRUD via join to suplementos_banco.user_id

3. **`prescricoes_suplementos`** — Patient prescriptions
   - `id`, `user_id`, `paciente_id`, `suplemento_id` (FK), `dose_prescrita`, `unidade_dose`, `frequencia`, `momento_uso`, `duracao`, `data_inicio`, `data_fim`, `farmacia`, `qtd_capsulas`, `instrucoes_farmacia`, `observacoes_paciente`, `observacoes_internas`, `ativa`, `created_at`, `updated_at`
   - RLS: nutri CRUD own, paciente SELECT own via pacientes join

### New Enums
- `tipo_suplemento`: suplemento, manipulado
- `categoria_suplemento`: proteinas_aminoacidos, vitaminas_minerais, omega_gorduras, probioticos_fibras, performance_energia, fitoterapicos, colageno_pele, emagrecimento, ganho_massa, saude_intestinal, hormonal, sono_ansiedade, imunidade, outro

## Frontend Components

### 1. Admin: Standalone Page (`src/pages/Suplementos.tsx`)
- Two tabs: **Banco de Suplementos** and **Prescrições**
- Banco tab: table listing all supplements/compounded with filters (type, category, status, search). Create/edit modal with full fields. Compounded formulas include a dynamic "ativos" list builder.
- Route: `/suplementos` added to `App.tsx` and `AppSidebar.tsx` (Pill icon)

### 2. Patient Profile Section (`src/components/paciente/SuplementosSection.tsx`)
- Added to `PacienteSidebar` sections array and `PacienteDetalhe` switch/case
- Two sub-tabs: **Prescrição Ativa** and **Histórico**
- Prescribe modal with autocomplete from banco, dose, frequency, timing, duration fields
- PDF export button using existing `pdfBrand.ts` helpers — generates A4 prescription with supplement list + compounded composition table

### 3. Patient Portal (`PortalPaciente.tsx`)
- New "Suplementos" option in the "Mais" menu
- Shows active prescription cards with name, dose, frequency, timing, remaining days with progress bar
- Historical prescriptions list with PDF download

### Implementation Order
1. SQL migration (tables, enums, RLS)
2. `Suplementos.tsx` page (banco CRUD)
3. `SuplementosSection.tsx` (patient prescriptions + PDF)
4. Portal integration
5. Sidebar/routing wiring

