

# Fase 3: Exames Laboratoriais, Orientações e Materiais, Prontuário

## Database Changes (2 migrations)

### 1. Tabela `exames_laboratoriais`
- `id` uuid PK, `paciente_id` uuid, `user_id` uuid, `created_at` timestamptz
- `nome_exame` text NOT NULL
- `data_coleta` date NOT NULL
- `arquivo_path` text NOT NULL (path in storage bucket)
- `observacoes` text nullable
- RLS: Nutri CRUD on own records (user_id = auth.uid())

### 2. Tabela `orientacoes`
- `id` uuid PK, `paciente_id` uuid, `user_id` uuid, `created_at` timestamptz
- `titulo` text NOT NULL
- `conteudo` text NOT NULL (rich text HTML)
- `categoria` enum (`alimentacao`, `hidratacao`, `sono`, `treino`, `intestino`, `comportamento`, `outro`)
- `enviada` boolean default false
- `data_envio` timestamptz nullable
- `visualizada` boolean default false
- RLS: Nutri CRUD on own records

### 3. Storage bucket `exames-laboratoriais` (public)

## Components to Create

### `ExamesSection.tsx`
- List of exams with columns: Nome, Data Coleta, Observações, Ações (download, delete)
- "Adicionar Exame" button opens modal with: nome_exame, data_coleta, file upload (PDF/image), observações
- Upload to `exames-laboratoriais` bucket
- Filter by exam name (text search)

### `OrientacoesSection.tsx`
- List of orientações as cards with título, categoria badge, data, status (enviada/visualizada)
- "Adicionar Orientação" opens modal/dialog with: título, categoria select, conteúdo textarea (rich-ish with basic formatting)
- Actions per item: editar, marcar como enviada, excluir
- Filter by categoria

### `ProntuarioSection.tsx`
- Aggregated timeline querying: consultas, acompanhamentos, planos_alimentares, anamneses, questionarios, exames_laboratoriais, orientacoes
- Each event rendered as a timeline item with icon, date, type badge, and summary
- Filter by period (date range) and event type (multi-select)
- All data fetched client-side from existing tables, no new table needed

## Modify `PacienteDetalhe.tsx`
Replace 3 remaining placeholder cases (`exames`, `orientacoes`, `prontuario`) with the new components.

## File Summary
- **Create**: `ExamesSection.tsx`, `OrientacoesSection.tsx`, `ProntuarioSection.tsx`
- **Modify**: `PacienteDetalhe.tsx` (wire new sections)
- **Migrations**: 2 tables + 1 storage bucket + 1 enum

