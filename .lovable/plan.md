
## Objetivo atualizado

Corrigir o fluxo **Anexar PDF** para que ele seja útil no portal do paciente:

1. O PDF continua sendo exibido exatamente como veio, sem alterar layout.
2. O paciente não vê mais um “plano vazio” com 0 kcal/0 refeições.
3. Ao anexar o PDF, o sistema faz uma leitura mínima/inteligente apenas para capturar os **totais nutricionais** do documento: kcal/dia, proteína, carboidrato, gordura e fibra quando existirem.
4. Esses totais aparecem nos cards do portal e na tela do plano.
5. A visualização do PDF vira uma experiência de imagem/documento: páginas em rolagem contínua, com zoom e opção de página única.

## Como vai funcionar (UX)

Na seção **Planos Alimentares** do paciente (`PlanoAlimentarSection.tsx`), o header mantém 3 botões:

- `Importar PDF` (mantém o fluxo atual, com IA)
- `Anexar PDF` (armazena o arquivo original + lê os totais nutricionais mínimos)
- `Novo Plano` (manual)

Ao clicar em **Anexar PDF**:
- Modal pede: nome do plano, status (ativo/rascunho), observações opcionais e o arquivo PDF.
- O sistema envia o PDF para uma Edge Function de leitura de totais.
- A Edge Function extrai texto/layout do PDF e usa IA, quando necessário, para encontrar:
  - calorias totais do plano/dia;
  - proteína total;
  - carboidrato total;
  - gordura total;
  - fibra total;
  - quantidade aproximada de refeições/opções, se conseguir identificar.
- O arquivo original é salvo no bucket privado `documentos-pdf`, em `planos/{paciente_id}/*`.
- Cria/atualiza um registro em `planos_alimentares` marcado como tipo `anexo`.
- Para o sistema conseguir contabilizar o plano como um plano real, será criada uma refeição técnica/resumo vinculada ao plano, com um item “Resumo nutricional do PDF” contendo os macros totais lidos. Essa refeição não precisa ser mostrada como card de refeição para o paciente; ela serve para os totais funcionarem em todo o sistema.

Na listagem, o plano aparece como card normal com badge **"PDF anexado"** e com as kcal/macros lidas. Ao expandir **Ver PDF**, mostra:
- O visualizador de PDF embutido (mesmo componente `PdfViewer.tsx` já usado em exames laboratoriais), com rolagem entre páginas, zoom e rotação, mantendo o layout original intacto.
- Botões: **Abrir em nova aba**, **Baixar**, **Substituir arquivo**, **Excluir**.

Ações no card:
- Editar → reabre o modal apenas para alterar nome/observações/status/arquivo (não abre o editor estruturado).
- Duplicar → copia o registro e o arquivo no storage.
- Exportar PDF → desabilitado (já é o próprio PDF; o botão Baixar substitui).
- Ativar/Inativar e Excluir funcionam normalmente (excluir remove também o arquivo do bucket).

No **portal do paciente** (`PortalPaciente.tsx`): se o plano ativo for do tipo anexo:
- A tela inicial mostra `kcal/dia` lidas do PDF, não 0.
- O card “Plano Ativo” mostra “PDF anexado” e os totais lidos.
- A aba “Plano” mostra primeiro um resumo nutricional normal do sistema: kcal, proteína, carboidrato, gordura e fibra.
- Abaixo aparece o PDF como imagem/documento em rolagem contínua, página por página, sem perder layout.
- O usuário pode abrir em nova aba/baixar o PDF.

## Alterações técnicas

1. **DB/migrations**
   - Manter os campos já adicionados em `planos_alimentares`: `tipo`, `pdf_url`, `pdf_nome`, `pdf_path`.
   - Criar uma refeição resumo automática para planos anexados, usando as tabelas existentes `refeicoes` e `alimentos_plano`, para que os totais sejam reutilizados pelo portal e pelo painel sem precisar criar colunas novas de macro.

2. **Storage**: reusar bucket privado `documentos-pdf`. Adicionar policy específica (se ainda não coberta) permitindo nutri dono e equipe atribuída lerem/escreverem em `planos/{paciente_id}/*`. Paciente lê apenas seus próprios planos via signed URL.

3. **Edge Function**
   - Criar uma função nova, por exemplo `parse-plano-pdf-totais`, ou reaproveitar parte da `import-plano-pdf` em modo resumido.
   - Entrada: `pdf_base64`.
   - Saída esperada:
     ```json
     {
       "kcal": 1800,
       "proteina_g": 120,
       "carboidrato_g": 180,
       "gordura_g": 55,
       "fibra_g": 25,
       "refeicoes_estimadas": 6,
       "observacoes": "Totais extraídos do PDF original"
     }
     ```
   - Se não encontrar algum campo, retorna `null`, sem inventar valores.

4. **`AnexarPlanoPdfModal.tsx`**
   - Durante o anexo/substituição do arquivo, converter o PDF para base64 e chamar a função de totais.
   - Após inserir/atualizar `planos_alimentares`, apagar refeições resumo anteriores desse plano e criar uma nova refeição resumo com um alimento único:
     - `nome_alimento`: “Resumo nutricional do PDF”
     - `quantidade`: 1
     - `medida_caseira`: “plano/dia”
     - `energia_kcal`: kcal extraída
     - `proteina_g`, `carboidrato_g`, `lipidio_g`, `fibra_g`: valores extraídos
     - `opcao`: “A”
   - Mostrar no toast se os totais foram identificados ou se precisam ser preenchidos/revisados depois.

5. **PlanoAlimentarSection.tsx**:
   - Adicionar botão "Anexar PDF" e estado `anexarOpen`.
    - Buscar também `refeicoes/alimentos_plano` ou calcular totais quando necessário para planos anexados.
    - Ao renderizar cada plano, se `plano.tipo === 'anexo'`: badge "PDF anexado", resumo de kcal/macros, expand mostra `<PdfViewer url={signedUrl} continuous />`, gera signed URL on-demand (1h), botões Baixar/Substituir.
   - Ao excluir um plano anexo, remover também o objeto do storage.

6. **Portal do paciente** (`src/pages/PortalPaciente.tsx`)
   - Ajustar cálculo de `totalDiario` para usar a refeição resumo do plano anexo.
   - Na aba “Plano”, para `tipo === 'anexo'`, exibir o mesmo card de totais usado nos planos normais.
   - Não exibir “0 refeições” no plano anexado; exibir algo como “PDF anexado” ou “Resumo do PDF”.
   - Renderizar o PDF em rolagem contínua com altura adequada e sem deixar a tela vazia.

7. **`PdfViewer.tsx`**
   - Mudar o padrão para rolagem contínua: renderizar todas as páginas empilhadas.
   - Manter zoom, rotação e botão para alternar entre “rolagem contínua” e “página única”.
   - Garantir rolagem horizontal quando o zoom passar da largura da tela.

8. **PDF export** (`ExportPdfModal`): se `tipo === 'anexo'`, ocultar exportação estruturada e mostrar apenas botão "Baixar PDF original".

## Fora de escopo

- Não transformar o PDF anexado em plano editável refeição por refeição.
- Não alterar o layout/conteúdo do PDF original.
- Não mexer no fluxo `Importar PDF` completo além de reaproveitar utilitários, se necessário.

Confirma essa direção? Se sim, sigo para implementação.
