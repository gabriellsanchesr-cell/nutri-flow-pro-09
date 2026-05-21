Plano para corrigir o painel de criação/edição do plano alimentar:

1. Ajustar o cálculo principal do topo
- Trocar o cálculo que hoje força sempre a Opção A por refeição.
- Usar a opção atualmente selecionada em cada refeição (`opcaoAtiva`) para somar calorias, proteína, carboidrato, gordura e fibra.
- Se a opção selecionada não existir mais, usar a primeira opção disponível como fallback seguro.

2. Sincronizar indicadores por refeição
- Manter o badge de cada refeição mostrando exatamente a opção selecionada naquele bloco.
- Garantir que ao clicar em Opção A/B/C, o total do topo recalcule imediatamente.
- Incluir fibra no cálculo auxiliar se necessário para manter consistência dos macros.

3. Corrigir textos para não induzir erro
- Alterar “Totais calculados com base na Opção A de cada refeição” para algo como “Totais calculados pelas opções selecionadas em cada refeição”.
- Deixar claro que a aba/opção selecionada no editor é a que entra no cálculo do resumo.

4. Validar o fluxo
- Conferir que, no plano do Gabriel Arruda, selecionar B ou C em uma refeição altera o total do topo apenas daquela refeição.
- Conferir que refeições ainda em A continuam somando A.
- Conferir que o PDF/exportação continua usando a opção selecionada em cada refeição, como já está estruturado.

Detalhe técnico:
- A correção fica no `PlanoAlimentarEditor.tsx`, principalmente no `useMemo` de `totals`, que atualmente está comentado e implementado para somar somente a Opção A.