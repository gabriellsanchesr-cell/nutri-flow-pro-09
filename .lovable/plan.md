

# Fase 2: Anamnese, Evolução Fotográfica e Questionários

## Database Changes (3 migrations)

### 1. Tabela `anamneses`
Stores full anamnesis per patient with structured sections as JSONB fields:
- `id`, `paciente_id`, `user_id`, `created_at`, `updated_at`
- `objetivos_motivacoes` (text)
- `historico_treino` (text)
- `historico_alimentar` (text)
- `saude_intestinal` (text)
- `sono_estresse` (text)
- `historico_medico` (text)
- `espaco_livre` (text)
- `preenchido_por` (enum: 'nutricionista' | 'paciente')
- `token` (text, for patient link access)
- `respondido` (boolean, default false)

RLS: Nutri CRUD on own patients. Public SELECT by token (for patient link).

### 2. Tabela `evolucao_fotos`
- `id`, `paciente_id`, `user_id`, `created_at`
- `data_registro` (date)
- `angulo` (text: 'frente' | 'lateral' | 'costas')
- `foto_path` (text, path in `evolucao-fotos` bucket)
- `observacoes` (text, nullable)

RLS: Nutri CRUD on own patients. Storage bucket `evolucao-fotos` already exists (public).

### 3. Tabela `questionarios`
General questionnaire tracking beyond checklist_respostas:
- `id`, `paciente_id`, `user_id`, `created_at`
- `tipo` (enum: 'anamnese' | 'checkin_semanal' | 'qualidade_vida' | 'comportamento_alimentar' | 'sintomas_intestinais')
- `status` (enum: 'pendente' | 'enviado' | 'respondido')
- `data_envio` (timestamptz, nullable)
- `data_resposta` (timestamptz, nullable)
- `token` (text)
- `respostas` (jsonb, nullable)

RLS: Nutri CRUD. Public SELECT/UPDATE by token.

## Components to Create

### `src/components/paciente/AnamneseSection.tsx`
- If no anamnesis exists: two buttons "Enviar link ao paciente" and "Preencher manualmente"
- "Preencher manualmente" opens a form with 7 text areas (one per section)
- "Enviar link" generates a token-based URL and copies to clipboard
- If anamnesis exists: displays all sections in cards, with "Editar" button and date of completion
- Badge showing who filled it (nutricionista/paciente)

### `src/components/paciente/EvolucaoFotograficaSection.tsx`
- Grid of photos grouped by date
- "Adicionar fotos" button with multi-file upload to `evolucao-fotos` bucket
- Each upload: select date + angle tag (Frente/Lateral/Costas)
- Delete photo action
- **Comparison mode**: select two dates from dropdowns, show photos side by side
- Empty state with upload CTA

### `src/components/paciente/QuestionariosSection.tsx`
- Table listing all questionnaires with columns: Tipo, Status (badge), Data Envio, Data Resposta, Ações
- "Enviar questionário" button opens modal to select type
- Generates token-based link, copies to clipboard
- "Ver respostas" opens dialog showing JSONB responses formatted
- Uses both `questionarios` table and existing `checklist_respostas`

## Update `PacienteDetalhe.tsx`
Replace 3 placeholder cases with the new components.

## Public pages for token-based access
- `src/pages/AnamnesePublica.tsx` - patient fills anamnesis via token link
- `src/pages/QuestionarioPublico.tsx` - patient fills questionnaire via token link
- Add routes in `App.tsx`: `/anamnese/:token` and `/questionario/:token` (public, no auth)

## Summary of files
- **Create**: `AnamneseSection.tsx`, `EvolucaoFotograficaSection.tsx`, `QuestionariosSection.tsx`, `AnamnesePublica.tsx`, `QuestionarioPublico.tsx`
- **Modify**: `PacienteDetalhe.tsx` (wire new sections), `App.tsx` (public routes)
- **Migrations**: 3 (anamneses table, evolucao_fotos table, questionarios table + enum)

