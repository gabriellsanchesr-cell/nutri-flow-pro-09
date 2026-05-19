## Objetivo

Reformular a importação de plano alimentar via PDF para preservar toda a estrutura: horário, nome livre da refeição, múltiplas **opções (A/B/C)** por refeição e **substituições por alimento**. Expandir o editor e o portal do paciente para exibir essas opções.

## Mudanças no banco

Migração com 2 colunas novas e 1 tabela nova:

1. `refeicoes`
   - `nome_customizado text null` — para rótulos livres ("Pré-treino", "Café da manhã / pós-treino"). Quando preenchido, sobrepõe o label do `tipo`.
2. `alimentos_plano`
   - `opcao char(1) not null default 'A'` — letra da opção (A, B, C, D…). Permite múltiplas listas de alimentos por refeição diferenciadas só por essa coluna.
   - `precisa_revisao boolean default false` — flag para itens importados com baixa confiança.
3. Nova tabela `alimento_substituicoes`
   - `id, alimento_plano_id (fk → alimentos_plano on delete cascade), nome text, quantidade numeric, medida_caseira text, alimento_taco_id int null, ordem int`
   - RLS espelhando `alimentos_plano` (nutri/equipe gerencia; paciente lê).

Sem alteração na tabela `refeicoes` quanto a `tipo` (mantém enum), porque permitimos nome livre via `nome_customizado`.

## Edge function `import-plano-pdf`

Reescrita do schema da tool e do prompt:

- Schema da tool passa a aceitar `refeicoes[].nome` (string livre), `horario` ("HH:MM"), `tipo_sugerido` (mapeia para enum: cafe_da_manha…ceia), `opcoes[]` com `letra` + `alimentos[]` + `substituicoes_por_item[]`.
  - Cada `alimento` tem `nome`, `quantidade_g`, `medida_caseira`, `precisa_revisao`.
  - Cada `substituicao_por_item` tem `alimento_base` (nome) + `alternativas[]` com `nome`, `quantidade_g`, `medida_caseira`.
- Prompt atualizado:
  - Instrui literalidade: copiar nomes e quantidades exatamente como aparecem ("doce de leite", não "batata doce"; "suco de uva", não "suco de laranja").
  - Lista heurísticas para detectar blocos OPÇÃO A / OPÇÃO B / OPÇÃO C e SUBSTITUIÇÕES POR ITEM.
  - Pede captura do horário no cabeçalho da refeição (ex.: "06:30").
  - Pede `nome` livre quando o título da refeição não é canônico.
- Enriquecimento TACO continua igual, agora aplicado também às alternativas das substituições.
- Resposta passa a ter formato:
  ```
  { observacoes, refeicoes: [{ nome, horario, tipo, opcoes: [{ letra, alimentos, substituicoes }] }] }
  ```

## Editor `PlanoAlimentarEditor.tsx`

- Estrutura interna passa de `refeicao.alimentos[]` para `refeicao.opcoes[]` onde cada opção tem `letra` + `alimentos[]`.
- Cabeçalho da refeição ganha campo de texto editável para nome customizado (default = label do tipo) ao lado do select de tipo e do horário.
- Cada refeição renderiza **abas Opção A / Opção B / Opção C** com botão "+ Adicionar opção". Cada aba mostra a tabela de alimentos atual.
- Cada linha de alimento ganha um botão "Substituições" que abre um popover/inline editor listando substitutos com nome + qtd + medida (CRUD inline).
- O bloco "Substituições Sugeridas" global da refeição vira "Notas/Substituições gerais" (mantido).
- Cálculo de macros: soma alimentos somente da **opção A** (ou da opção marcada como ativa) para evitar somar 3x. Indicador no topo: "Macros calculados sobre Opção A".
- Persistência:
  - Insere uma linha em `refeicoes` por refeição (com `nome_customizado`, `horario_sugerido`, `tipo`).
  - Insere alimentos em `alimentos_plano` com a coluna `opcao` correspondente.
  - Insere substituições em `alimento_substituicoes` ligadas a cada alimento.
  - Estratégia de delete em cascade já cobre tudo.

## Modal `ImportarPlanoPdfModal.tsx`

- Mensagem do banner pós-importação atualiza para: "Plano importado: X refeições, Y opções, Z substituições. Revise antes de ativar."
- Stages atualizados: "Lendo PDF → OCR → Identificando refeições e opções → Identificando substituições → Calculando macros".

## Portal do paciente (`PortalPaciente.tsx` / view de plano)

- Cada refeição mostra o nome customizado + horário.
- Tabs Opção A/B/C (default A). Paciente escolhe qual seguir no dia.
- Botão "Ver substituições" por alimento, abrindo lista com qtd e medida.

## Fora do escopo

- Importação de fim-de-semana (plano separado): o usuário importa um PDF por vez. Suporte a múltiplos planos por paciente já existe.
- Editor visual de drag-and-drop entre opções.
- Sugestão automática de qual opção comer baseado em dia da semana.

## Detalhes técnicos

- Migração faz `UPDATE alimentos_plano SET opcao='A'` para registros antigos, garantindo retrocompatibilidade.
- Editor existente que lê apenas `alimentos` continua funcionando se a refeição só tiver opção A (fluxo legado).
- `alimento_substituicoes` é opcional — refeições antigas sem substituições estruturadas seguem usando o campo texto `substituicoes_sugeridas` da refeição.
- PDF export (`planoAlimentarPdf.ts`) precisará iterar opções; será atualizado para imprimir "OPÇÃO A / B / C" e listar substituições por item embaixo de cada bloco.
