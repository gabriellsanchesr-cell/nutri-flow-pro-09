Plano para tornar a importação de PDF mais confiável e evitar falhas como calorias/alimentos errados:

1. Fortalecer a leitura e validação do retorno da IA
- Aceitar também retorno em texto JSON caso a IA não use tool_call corretamente.
- Sanitizar números antes de usar: converter strings como “507 kcal”, “P 40”, “40g”, vírgula decimal etc.
- Validar estrutura mínima: refeição com tipo válido, opção com letra, alimento com nome, quantidade segura e medida.
- Nunca deixar um erro parcial quebrar a importação inteira quando for possível marcar item para revisão.

2. Extrair totais do PDF por heurística local como fallback
- Além de pedir os totais para a IA, analisar o texto bruto do PDF no backend para capturar padrões como “507 kcal · P 40 · C 61 · G 12”.
- Se a IA não preencher kcal/proteína/carbo/gordura da opção, preencher com os totais detectados no texto, seguindo a ordem das refeições/opções.
- Usar esses totais do PDF como valores oficiais da opção na tela.

3. Corrigir persistência dos totais por opção
- Hoje os campos `kcal_opcao`, `prot_opcao_g`, `carb_opcao_g`, `gord_opcao_g` existem só no estado do editor e se perdem ao salvar, porque o banco não tem colunas para eles.
- Criar colunas em `refeicoes` para armazenar os totais da opção A/B/C como JSON, sem criar novas tabelas.
- Ao salvar o plano, gravar os totais de cada opção da refeição.
- Ao abrir plano salvo, restaurar esses totais para que o sistema não volte a recalcular errado pela TACO.

4. Tornar o pareamento TACO mais seguro
- Manter o nome original do PDF sempre visível.
- Melhorar aliases e critérios de confiança para evitar falsos positivos como maçã/macarrão e carne magra/carne suína.
- Se o pareamento não for altamente confiável, não “chutar”: deixar alimento sem TACO, macros zerados internamente e marcado para revisão.

5. Exibir revisão de importação de forma clara
- Manter “—” nas colunas de macro quando não houver TACO confiável.
- Mostrar que os totais da opção vieram do PDF quando disponíveis.
- Ajustar mensagem do modal/banner para deixar claro que a estrutura foi importada e que itens marcados precisam revisão.

6. Validar com o caso da Érica
- Conferir que a Opção A do Almoço preserva “carne magra (patinho ou alcatra)” e “maçã”.
- Conferir que o header usa 507 kcal · P 40 · C 61 · G 12 quando vier do PDF.
- Conferir que trocar opção no editor atualiza os totais pela opção selecionada e que, após salvar e reabrir, os totais continuam corretos.

Arquivos previstos:
- `supabase/functions/import-plano-pdf/index.ts`
- `src/components/paciente/PlanoAlimentarEditor.tsx`
- `src/lib/pdf/planoAlimentarPdf.ts` se necessário para exportação consistente
- Nova migration para guardar totais por opção em `refeicoes`