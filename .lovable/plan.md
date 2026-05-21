## Plano de correção

1. **Separar “aba visual” de “opção contabilizada”**
   - Hoje a aba A/B/C tenta fazer os dois papéis ao mesmo tempo, o que deixa o fluxo confuso.
   - Vou criar um estado único de seleção contabilizada por refeição, com padrão automático em **Opção A**.
   - A aba mostrará a lista de alimentos daquela opção, e a opção marcada no checklist será a que entra no cálculo do dia.

2. **Adicionar checklist de contabilização por refeição**
   - Em cada refeição com opções A/B/C, aparecerá uma seleção clara tipo checklist/radio: **Contabilizar A / B / C**.
   - Ao marcar B ou C naquela refeição, o total do dia no topo passa a considerar B ou C somente naquela refeição.
   - As outras refeições continuam contabilizando suas próprias opções selecionadas, ou A se nada tiver sido alterado.

3. **Corrigir todos os totais para usar a seleção real**
   - O bloco grande do topo recalculará **kcal, proteína, carboidrato, gordura e fibra** com base na opção contabilizada em cada refeição.
   - O resumo de kcal no cabeçalho do plano e o kcal de cada refeição também usarão a mesma regra.
   - Isso garante que, por exemplo: café A + almoço B + jantar A gere o total correto, sem somar todas as opções.

4. **Persistir a escolha corretamente**
   - As opções contabilizadas serão salvas no `localStorage` por plano.
   - Ao recarregar ou voltar ao portal, o sistema restaura as escolhas do paciente.
   - Se o plano mudar ou uma opção não existir mais, o sistema volta com segurança para Opção A.

5. **Ajustar textos e indicadores para evitar ambiguidade**
   - Trocar o texto do topo para algo como: “Totais calculados pelas opções marcadas em cada refeição”.
   - Em cada refeição, mostrar um badge discreto: “Conta no dia: Opção X”.
   - Remover qualquer indicação antiga que pareça dizer que é sempre Opção A quando o usuário marcou outra.

6. **Validar o caso do Gabriel Arruda no comportamento esperado**
   - Confirmar que o portal não soma A+B+C na mesma refeição.
   - Confirmar que a troca para B/C altera imediatamente o total diário e todos os macros.
   - Confirmar que substituições por alimento continuam aparecendo dentro da opção exibida.