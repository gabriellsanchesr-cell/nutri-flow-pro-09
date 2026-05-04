## Novo painel: Diários Alimentares (visão do nutricionista)

Painel central onde o nutri vê **todos os registros de diário alimentar de todas as pacientes** em um só lugar, com filtros, fotos, tags e ação rápida de feedback.

### 1. Nova rota e item de menu

- Nova página: `src/pages/DiariosAlimentares.tsx` registrada em `src/App.tsx` na rota `/diarios` dentro do `AdminRoute`.
- Novo item no `src/components/AppSidebar.tsx`: **"Diários Alimentares"** com ícone `BookMarked`, posicionado logo após "Acompanhamento". Visível para `isAdmin` (e via `hasPermission` se aplicável).

### 2. Estrutura da página

**Cabeçalho**
- Título + subtítulo.
- Badges de resumo (lado direito): total de registros filtrados, quantos "novos" (não vistos) e quantos sem feedback.

**Barra de filtros (5 colunas em desktop, empilhada em mobile)**
- Busca textual (descrição, sentimento, nome da paciente).
- Paciente (lista única extraída dos registros).
- Tipo de refeição (café, almoço, lanche, jantar, ceia, outro).
- Período (Hoje / 7 / 30 / 90 dias / Tudo) — padrão 7 dias.
- Status: Todos / Não vistos / Sem feedback.

**Lista agrupada por dia**
- Cada dia renderiza um cabeçalho com data por extenso e contagem.
- Cards em grid responsivo (1 / 2 / 3 colunas).
- Cada card mostra:
  - Nome da paciente (link para `/pacientes/:id`).
  - Tag da refeição + horário + badge "Novo" se `visto_nutri = false`.
  - Foto do registro (signed URL do bucket `diario-fotos`, altura fixa, `object-cover`).
  - Descrição (linha-clamp 3) e sentimento (se houver).
  - Caixa azul com feedback enviado (se já houver).
  - Botões: **Marcar visto** (se ainda não visto) e **Enviar/Editar feedback**.

**Modal de feedback**
- Mostra contexto resumido (paciente, refeição, dia, descrição) e textarea.
- Salva em `diario_registros.feedback_nutri` + `feedback_data = now()` e marca `visto_nutri = true`.

### 3. Integração com o banco (sem alterações de schema)

A tabela `diario_registros` já existe com:
- `paciente_id`, `data_registro`, `tipo_refeicao`, `horario`, `descricao`, `foto_path`, `sentimento`, `feedback_nutri`, `feedback_data`, `visto_nutri`.

E as RLS já permitem ao nutri:
- `Nutri can view patient diario` (SELECT) e `Nutri can update patient diario` (UPDATE).

Operações usadas:
- `select("*, pacientes(id, nome_completo)")` ordenado por `data_registro desc, horario desc`, limit 500.
- `supabase.storage.from("diario-fotos").createSignedUrls(paths, 3600)` para imagens.
- `update({ visto_nutri, feedback_nutri, feedback_data })`.
- Realtime: subscribe em `postgres_changes` na tabela para atualizar a lista quando pacientes registrarem novas refeições.

### 4. Design

- Plus Jakarta Sans, `rounded-xl` (14px), tokens semânticos (`primary`, `muted`, `warning`).
- Cards "novos" recebem borda `border-primary/40` e fundo `bg-primary/[0.02]` para destaque.
- Mobile-first: filtros empilham, grid colapsa para 1 coluna.

### 5. Arquivos alterados/criados

- **Criar**: `src/pages/DiariosAlimentares.tsx`
- **Editar**: `src/App.tsx` (importar página + rota `diarios`)
- **Editar**: `src/components/AppSidebar.tsx` (item de menu "Diários Alimentares")

Sem migrações, edge functions ou alterações de RLS.
