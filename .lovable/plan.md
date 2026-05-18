# Plano — Metas e Materiais Extras

Hoje só essas duas seções do prontuário do paciente estão como "em construção". Vou implementá-las completas (CRUD no painel do nutri + visualização no portal do paciente).

## 1. Banco de dados (1 migration)

**Tabela `metas_paciente`**
- `paciente_id`, `user_id` (nutri dono), `titulo`, `descricao`
- `tipo` text: `'checklist'` ou `'numerica'`
- `valor_alvo` numeric, `valor_atual` numeric, `unidade` text (ex.: kg, L, min, x/semana) — só para numérica
- `prazo` date, `prioridade` text (`baixa|media|alta`), `status` text (`em_andamento|concluida|pausada`)
- `concluida_em` timestamptz
- RLS: nutri/equipe gerenciam; paciente vê e pode atualizar `valor_atual`/`status` (para marcar progresso/concluído).

**Tabela `materiais_paciente`**
- `paciente_id`, `user_id`, `titulo`, `descricao`, `categoria` text (ex.: ebook, video, receita, treino, outro)
- `tipo` text: `'arquivo'` ou `'link'`
- `arquivo_path` text (storage `documentos-pdf`), `arquivo_nome`, `arquivo_mime`
- `url_externa` text (YouTube, Drive, artigo)
- `visto_em` timestamptz (paciente marca como visto)
- RLS: nutri/equipe CRUD; paciente lê e atualiza `visto_em` dos próprios.

Reuso do bucket existente `documentos-pdf` (path `materiais/{paciente_id}/...`); políticas de storage já cobrem nutri+paciente para esse bucket via padrão usado em outras seções.

## 2. Painel do nutricionista

**`MetasSection.tsx`** (nova) — usada em `PacienteDetalhe` no case `"metas"`:
- Lista cards agrupados por status (Em andamento / Concluídas / Pausadas).
- Botão "+ Nova meta" abre modal com toggle Checklist / Numérica, campos condicionais, prazo, prioridade.
- Barra de progresso (valor_atual / valor_alvo) nas numéricas; checkbox de conclusão nas qualitativas.
- Ações: editar, pausar/retomar, concluir, excluir.

**`MateriaisExtrasSection.tsx`** (nova) — case `"materiais"`:
- Tabs "Todos / Arquivos / Links" + filtro por categoria.
- Botão "+ Adicionar" abre modal com toggle Arquivo / Link.
  - Arquivo: upload (PDF/imagem/vídeo até limite do bucket), título, descrição, categoria.
  - Link: URL, título, descrição, categoria.
- Cards mostram ícone do tipo, título, categoria, data, badge "Visto pelo paciente" se aplicável.
- Ações: abrir/baixar (signed URL para arquivo, nova aba para link), editar metadados, excluir.

Substitui as duas linhas `PlaceholderSection` em `src/pages/PacienteDetalhe.tsx`.

## 3. Portal do paciente

Em `src/pages/PortalPaciente.tsx`:
- Aba "Metas" (`renderMetas`): lista das metas com progresso e botão "Marcar como concluída" / input rápido para atualizar `valor_atual` nas numéricas. Mensagem amigável quando vazio.
- Substituir o default placeholder de "Materiais" no `renderMoreContent` por uma listagem real (cards com ícone, abre link em nova aba ou baixa arquivo via signed URL; marca `visto_em` ao abrir).
- Respeitar `paciente_portal_permissoes` se existir flag relevante; senão, mostrar sempre.

## 4. Detalhes técnicos
- Realtime opcional, não necessário nesta fase.
- Signed URLs com 1h para arquivos privados.
- Toasts de sucesso/erro padronizados (Sonner).
- Sem mudanças em outras seções — já estão implementadas (verificado: somente Metas e Materiais usavam `PlaceholderSection`).

## Fora do escopo
- IA para sugerir metas automaticamente.
- Notificações push quando meta vence.
- Compartilhar materiais entre múltiplos pacientes em lote (pode vir depois reusando Biblioteca).
