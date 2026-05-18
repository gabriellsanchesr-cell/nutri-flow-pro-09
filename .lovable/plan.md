## O que muda

O importador atual extrai **apenas uma** avaliação por arquivo. Seu PDF do WebDiet (e relatórios parecidos) traz **várias datas lado a lado** numa única tabela de evolução — 3 datas no caso do Gabriel (20/12/2025, 17/01/2026, 14/03/2026), cada uma com dezenas de medidas (peso, IMC, RCQ, todas as dobras, todas as circunferências, bioimpedância, somatório, densidade, classificações).

A ideia é trocar o fluxo para: **um upload → várias avaliações criadas de uma vez**, preservando 100% das medidas + anexando o PDF original como histórico.

## Fluxo novo

1. Em `Avaliações Físicas`, botão **"Importar histórico"** abre o modal.
2. Usuário envia o PDF (WebDiet, Dietbox, planilha, InBody, etc.) — sem precisar informar data.
3. A IA lê o documento e devolve uma **lista de avaliações** (uma por coluna/data detectada), com todos os campos preenchidos.
4. Tela de **revisão em tabela** mostra todas as datas detectadas em colunas, com as medidas em linhas (igual ao PDF original). Usuário pode:
   - Desmarcar datas que não quer importar.
   - Editar qualquer célula antes de salvar.
   - Ver quantos campos foram extraídos por data.
5. Botão **"Salvar N avaliações"** insere todas de uma vez na tabela `avaliacoes_fisicas`, marcadas com `origem = 'importado_ia'`.
6. O PDF original fica anexado ao paciente (bucket `documentos-pdf`) e cada avaliação importada guarda referência ao arquivo, para o nutri abrir e conferir depois.

## Mudanças no código

### 1. Edge function `parse-avaliacao-fisica` (reescrita)
- Schema de saída muda de `{ extracted: {...} }` para `{ avaliacoes: [{ data_avaliacao, ...campos }, ...] }`.
- Prompt instrui o modelo a:
  - Detectar **todas as colunas de data** em tabelas de evolução.
  - Para cada data, montar um objeto com todos os campos disponíveis (ignorar setas/variações `↑↓`, pegar só o número).
  - Mapear nomes do WebDiet/Dietbox para o schema da `avaliacoes_fisicas` (ex: "Circunf. Medial da Coxa" → `circ_coxa_dir`, "Dobra Torácica" → `dobra_toracica`, "Massa Muscular" → `bio_massa_muscular`, etc).
  - Bioimpedância em coluna separada vai para os campos `bio_*` na avaliação da data correspondente (ou na mais próxima se não houver data explícita).
  - Capturar classificações textuais ("Sobrepeso", "Alta II", "Muito alto") em `observacoes`.
  - Inferir `protocolo_dobras` pelo conjunto de dobras coletadas (8 dobras = Petroski, 7 = Pollock 7, etc).
- Continua usando `google/gemini-2.5-flash` multimodal, `response_format: json_object`, sanitização numérica (já existe).
- Aumenta limite para PDFs grandes (até ~20 páginas).

### 2. `ImportarAvaliacaoModal.tsx` (refatorado)
- Vira modal de 2 passos:
  - **Passo 1 — Upload**: só arquivo + botão "Analisar". Remove o campo de data (a IA detecta).
  - **Passo 2 — Revisão**: tabela com colunas = datas detectadas, linhas = medidas (agrupadas por seção: Básico / Dobras / Circunferências / Bioimpedância). Checkbox no topo de cada coluna para incluir/excluir. Inputs editáveis em cada célula. Botão "Salvar N avaliações".
- No salvar, faz `insert` em lote em `avaliacoes_fisicas` + upload do PDF original.

### 3. `AvaliacoesFisicasSection.tsx`
- Botão muda de "Importar" para "Importar histórico" (Upload icon).
- Após importação em lote, recarrega lista e mostra toast "N avaliações importadas".
- Nos cards importados, além do badge `IA`, adicionar link "Ver PDF original" quando houver `pdf_url`.

### 4. Migration
- Adicionar coluna `pdf_origem_url text` em `avaliacoes_fisicas` (URL/path do PDF anexado).
- Adicionar coluna `pdf_origem_nome text` (nome amigável do arquivo).
- (`origem` já foi criada na migration anterior — mantida.)

### 5. Storage
- Reusa o bucket `documentos-pdf` existente. Caminho: `avaliacoes-importadas/{paciente_id}/{timestamp}-{filename}`.

## Fora do escopo
- Importar múltiplos PDFs de uma vez (um arquivo por importação).
- OCR de gráficos (somente tabelas — gráficos são reconstruídos no sistema a partir dos dados salvos).
- Editar/excluir o PDF anexado depois (só leitura).
- Reconciliar com avaliações existentes (sempre cria novas).

## Notas técnicas
- O parsing fica determinístico no front: a IA só transcreve, a UI dá controle total antes de salvar — evita ruído nos dados históricos.
- Datas devem vir em ISO (`YYYY-MM-DD`); prompt converte `dd/MM/yyyy` automaticamente.
- Campos com valor `null` ou `"-"` no PDF são omitidos do insert.
