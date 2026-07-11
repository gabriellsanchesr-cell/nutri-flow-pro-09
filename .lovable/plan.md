## Objetivo
No PDF de avaliação física, a seção "Comparativo com Avaliação Anterior" hoje mostra apenas a avaliação atual vs. a imediatamente anterior. Vamos transformá-la em um **Comparativo Histórico Completo**, mostrando a evolução em todas as avaliações registradas do paciente.

## Mudanças

### 1. `src/lib/pdf/avaliacaoPdf.ts`
- Trocar o parâmetro `avaliacaoAnterior: any | null` por `historicoAvaliacoes: any[]` (todas as avaliações do paciente, ordenadas cronologicamente da mais antiga para a mais recente, incluindo a atual).
- Reescrever a Seção 6 (quando `options.incluirComparativo` estiver ligado e existirem 2+ avaliações):
  - **Tabela de evolução histórica**: cabeçalho com "Medida" + uma coluna para cada data de avaliação (`DD/MM/AAAA`), formatadas com `formatLocalDateBR`.
  - Linhas: Peso, IMC, % Gordura, Massa magra, Cintura, Quadril, Abdômen, RCQ (apenas as com pelo menos um valor preenchido).
  - Última coluna "Variação total" = valor mais recente − primeiro valor, com seta (↑/↓/=) e indicador ✓/✗ conforme o campo (peso/cintura/quadril/abdômen/gordura → menor é melhor; massa magra → maior é melhor).
  - Se houver muitas datas (>6), a tabela usa fonte reduzida e quebra automaticamente para nova página; se ainda assim não couber, gerar uma segunda tabela dividindo as datas em blocos.
- Ajustar o título da seção para "Evolução — Comparativo Histórico".

### 2. `src/components/paciente/AvaliacoesFisicasSection.tsx` (chamada de exportação)
- Onde hoje monta `avaliacaoAnterior` (a penúltima), passar em vez disso `historicoAvaliacoes` = todas as avaliações daquele paciente, ordenadas por `data_avaliacao` ascendente, filtradas para incluir apenas as até a data da avaliação sendo exportada (para não mostrar avaliações "futuras" quando o usuário exporta uma antiga).

### 3. Retrocompatibilidade
- Manter a assinatura anterior aceitando também `avaliacaoAnterior` legado não é necessário — só há uma chamada a `generateAvaliacaoPdf` no projeto (na section de avaliações). Vamos simplesmente atualizar essa chamada.

## Detalhes técnicos
- Layout: `autoTable` do jspdf-autotable já suporta larguras dinâmicas; usaremos `styles.fontSize: 8` quando houver mais de 4 datas.
- Variação: mesmo cálculo já existente (arredonda em 2 casas), aplicado entre primeira e última avaliação com valor não nulo daquela linha.
- Se houver apenas 1 avaliação, a seção é omitida (comportamento atual mantido).

## Fora do escopo
- Não altero o CSV nem os outros relatórios.
- Não altero a UI da tela de avaliações — apenas o PDF exportado.
