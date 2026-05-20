## Plano de correção

1. **Centralizar a regra de cálculo**
   - Criar/ajustar helpers no portal para sempre calcular totais diários usando apenas a **Opção A** de cada refeição.
   - A regra valerá para: calorias, proteína, carboidrato, gordura e fibra.
   - Se uma refeição antiga não tiver letra de opção, ela será tratada como Opção A.

2. **Corrigir o bloco grande de totais no Portal do Paciente**
   - O resumo no topo do plano deixará de usar a opção selecionada pelo paciente.
   - Ele mostrará os totais da referência prescrita: **somente Opção A em todas as refeições**.
   - Incluir fibra nesse resumo, mantendo o mesmo padrão visual do editor.
   - Adicionar uma indicação discreta: “Totais baseados na Opção A”.

3. **Ativar o sistema de escolha por refeição**
   - Manter as abas/botões Opção A/B/C dentro de cada refeição para o paciente escolher qual alternativa seguir naquele momento.
   - A escolha mudará apenas a lista de alimentos exibida naquela refeição e o subtotal visual daquela refeição.
   - Essa escolha não alterará o total diário do topo, para evitar a impressão de que o paciente deve consumir todas as opções.

4. **Ajustar o editor para não gerar ambiguidade**
   - Corrigir o texto atual que diz “Totais calculados com base na opção ativa”, porque o código já deve trabalhar com Opção A.
   - O texto ficará claro: “Totais calculados com base na Opção A”.
   - Conferir também o envio para PDF/exportação para não voltar a somar opções B/C.

5. **Validar com o caso Gabriel Arruda**
   - Verificar o plano importado no banco/app para confirmar que as refeições foram separadas por opções.
   - Validar que o portal mostra opções A/B/C, mas o topo soma apenas a Opção A.
   - Validar que o editor exibe o mesmo total da Opção A e que substituições por alimento seguem aparecendo.