Plano de implementação:

1. Reestruturar a leitura do PDF
- Trocar a extração atual que junta o conteúdo em texto corrido por uma extração com coordenadas X/Y.
- Recriar linhas, colunas e espaçamentos para preservar horários, títulos, opções A/B/C, listas de alimentos e blocos de substituições.
- Evitar que tabelas ou colunas do PDF sejam lidas fora de ordem.

2. Criar uma etapa local de pré-estruturação antes da IA
- Detectar refeições por padrões reais: “Café da manhã”, “Almoço”, “Jantar”, “Ceia”, “Pré-treino”, horários e títulos customizados.
- Detectar opções: “Opção A”, “Opção B”, “Opção C”, variações como “Opção 1/2” e blocos repetidos.
- Separar alimentos linha a linha, em vez de deixar uma refeição inteira virar um único campo de texto.
- Identificar substituições por item e associá-las ao alimento correto.

3. Melhorar o contrato da IA
- Enviar para a IA o texto já organizado em linhas/blocos, com marcações de refeição/opção/substituição.
- Reforçar que a IA deve retornar somente estrutura JSON com refeições, opções, alimentos, quantidades, medidas, totais e substituições.
- Bloquear respostas onde a IA coloque parágrafos inteiros em `nome_alimento`; esses casos serão quebrados ou marcados para revisão.

4. Pós-processar e validar a importação
- Sanitizar nomes, quantidades e medidas sem perder o texto original do PDF.
- Separar alimentos quando vierem juntos na mesma linha, por padrões como “+”, “,”, “ou”, bullets e quebras visuais.
- Usar totais do PDF como fonte oficial quando existirem.
- Quando não houver TACO confiável, manter o alimento no plano com macros zerados e `precisa_revisao`, em vez de trocar por alimento errado.

5. Garantir que o resultado entre no editor como plano feito manualmente
- Cada refeição importada vira uma refeição real do editor.
- Cada opção vira aba/opção real.
- Cada alimento vira item editável com quantidade, medida, macros e substituições.
- Substituições serão salvas na tabela própria e aparecerão no editor e portal como substituições estruturadas, não como texto solto.

6. Melhorar feedback da tela de importação
- Exibir mensagem mais clara quando o PDF foi parcialmente interpretado.
- Informar quantas refeições, opções, alimentos e substituições foram importados.
- Destacar itens que precisam revisão para o nutricionista corrigir antes de ativar.

Arquivos principais:
- `supabase/functions/import-plano-pdf/index.ts`
- `src/components/paciente/ImportarPlanoPdfModal.tsx`
- `src/components/paciente/PlanoAlimentarEditor.tsx`

Validação:
- Testar importação com PDFs que têm opções A/B/C, horários, substituições e totais nutricionais.
- Confirmar que nada entra como um bloco de texto único quando deveria ser refeição/alimento.
- Confirmar que salvar e reabrir preserva opções, totais e substituições.