# Ficha de Avaliação Física — novo PDF

Redesenhar o PDF exportado da avaliação física para ficar bonito, padronizado e completo (avaliação atual + histórico inteiro do sistema).

## O que muda na apresentação

1. **Capa e cabeçalho**
   - Capa opcional mantida, com nome do paciente, data da avaliação e identidade visual (azul #2B3990).
   - Cabeçalho por página: marca à esquerda, "Ficha de Avaliação Física" à direita, linha divisória.

2. **Painel de destaques (novo)**
   - Faixa de cartões no topo da página 1: Peso, IMC + classificação, % Gordura + classificação, Massa magra, RCQ + risco.
   - Cada cartão traz a variação em relação à avaliação anterior (seta e valor), com cor verde/vermelha conforme o objetivo da medida.

3. **Medidas padronizadas**
   - Circunferências: todas as 20 medidas do cadastro, em tabela de duas colunas pareando Esq./Dir. (braço relaxado, braço contraído, antebraço, coxa proximal/medial/distal, panturrilha) e uma coluna de simetria (diferença D-E).
   - Dobras cutâneas: todas as 11 dobras em mm, com protocolo usado, somatório das dobras, densidade e % de gordura resultante.
   - Bioimpedância: todos os campos `bio_*` com rótulos e unidades unificados.
   - Diâmetros ósseos e alturas complementares (punho, fêmur, biacromial, bicrista, altura sentado, altura do joelho, envergadura) em bloco próprio.
   - Toda medida ausente aparece como "—" e blocos totalmente vazios são omitidos.

4. **Histórico completo e escala de evolução corrigida**
   - Tabela de evolução com uma coluna por avaliação registrada (ordem cronológica), quebrando em blocos com repetição da coluna "Medida" e do cabeçalho quando não couber na página, sem perder a coluna de variação.
   - Colunas de variação: "Δ vs. anterior" e "Δ total (1ª → última)", com percentual além do valor absoluto.
   - Seções do histórico agrupadas: composição corporal, circunferências, dobras, bioimpedância.
   - Gráficos de linha (peso, % gordura, massa magra, cintura) desenhados nativamente no PDF com eixos escalados pelos valores mínimo/máximo reais e datas no eixo X — corrige a escala atualmente errada.

5. **Fechamento**
   - Observações da avaliação, legenda de referências (classificação de IMC, % gordura por sexo, risco RCQ) e assinatura do nutricionista com CRN.
   - Rodapé com paginação e marca d'água opcional.

## Detalhes técnicos

- `src/lib/pdf/avaliacaoPdf.ts`: reescrita do gerador — novos helpers de cartões de destaque, tabela pareada Esq./Dir., tabela histórica com blocos e gráfico de linha em vetor (jsPDF `lines`/`circle`), sem dependências novas.
- `src/lib/pdf/pdfBrand.ts`: acrescentar helpers reutilizáveis (`statCard`, `miniLineChart`, `legendBlock`) e tokens de cor para variação positiva/negativa.
- `src/components/pdf/ExportPdfModal.tsx`: habilitar por padrão `incluirGraficos`, adicionar opções "Diâmetros e alturas" e "Legendas de referência"; continuar enviando o histórico completo ordenado.
- `src/components/paciente/AvaliacoesFisicasSection.tsx`: garantir que o histórico passado ao modal contenha todas as avaliações do paciente (sem corte), já em ordem crescente de data, usando `parseLocalDate` para evitar desvio de dia.
- Nenhuma mudança de banco de dados.
