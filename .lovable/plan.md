
## Objetivo

Manter a importação inteligente atual e adicionar uma segunda abordagem: **Anexar PDF** — o nutricionista anexa o plano em PDF, e o sistema apenas armazena e exibe o arquivo original (igual a um visualizador), sem tentar interpretar, editar ou estruturar nada. Útil para planos vindos de outras ferramentas, garantindo fidelidade visual 100%.

## Como vai funcionar (UX)

Na seção **Planos Alimentares** do paciente (`PlanoAlimentarSection.tsx`), o header passa a ter 3 botões:

- `Importar PDF` (mantém o fluxo atual, com IA)
- `Anexar PDF` (novo — sem IA, só armazena)
- `Novo Plano` (manual)

Ao clicar em **Anexar PDF**:
- Modal pede: nome do plano, status (ativo/rascunho), observações opcionais e o arquivo (até 10 MB).
- Upload direto para o bucket privado `documentos-pdf`, em `planos/{paciente_id}/{plano_id}.pdf`.
- Cria um registro em `planos_alimentares` marcado como tipo "anexo" (sem refeições associadas).

Na listagem, o plano aparece como card normal com badge **"PDF anexado"**. Ao expandir **Ver refeições**, em vez da lista de refeições, mostra:
- O visualizador de PDF embutido (mesmo componente `PdfViewer.tsx` já usado em exames laboratoriais), com rolagem entre páginas, zoom e rotação, mantendo o layout original intacto.
- Botões: **Abrir em nova aba**, **Baixar**, **Substituir arquivo**, **Excluir**.

Ações no card:
- Editar → reabre o modal apenas para alterar nome/observações/status/arquivo (não abre o editor estruturado).
- Duplicar → copia o registro e o arquivo no storage.
- Exportar PDF → desabilitado (já é o próprio PDF; o botão Baixar substitui).
- Ativar/Inativar e Excluir funcionam normalmente (excluir remove também o arquivo do bucket).

No **portal do paciente** (`PortalJornada` / seção de plano alimentar do paciente): se o plano ativo for do tipo anexo, mostra o mesmo `PdfViewer` em vez da renderização estruturada por refeições, com botão de download.

## Alterações técnicas

1. **DB migration** em `planos_alimentares`:
   - `tipo text not null default 'estruturado'` (`'estruturado' | 'anexo'`)
   - `pdf_url text`, `pdf_nome text`, `pdf_path text` (path no bucket, para deleção/replace)
   - Sem mudança de RLS — políticas existentes cobrem o novo campo.

2. **Storage**: reusar bucket privado `documentos-pdf`. Adicionar policy específica (se ainda não coberta) permitindo nutri dono e equipe atribuída lerem/escreverem em `planos/{paciente_id}/*`. Paciente lê apenas seus próprios planos via signed URL.

3. **Novo componente** `src/components/paciente/AnexarPlanoPdfModal.tsx`: form + upload + insert. Reaproveita estilo do `ImportarPlanoPdfModal`.

4. **PlanoAlimentarSection.tsx**:
   - Adicionar botão "Anexar PDF" e estado `anexarOpen`.
   - Ao renderizar cada plano, se `plano.tipo === 'anexo'`: badge "PDF anexado", expand mostra `<PdfViewer url={signedUrl} />`, gera signed URL on-demand (1h), botões Baixar/Substituir.
   - Ao excluir um plano anexo, remover também o objeto do storage.

5. **Portal do paciente** (`src/components/portal/PortalJornada.tsx` ou onde o plano é renderizado): branch para `tipo === 'anexo'` → exibe `PdfViewer` com signed URL.

6. **PDF export** (`ExportPdfModal`): se `tipo === 'anexo'`, oculta a opção e mostra apenas botão "Baixar PDF original".

## Fora de escopo

- Nenhuma extração de texto/IA sobre o PDF anexado.
- Sem edição de conteúdo do PDF anexado.
- Não altera o fluxo `Importar PDF` existente.

Confirma essa direção? Se sim, sigo para implementação.
