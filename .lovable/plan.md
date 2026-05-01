## Problema

No print, em mobile, o seletor de seção ("Acompanhamento Semanal") aparece à esquerda e o conteúdo da seção (filtros 4sem/3 mes, Relatório, tabela "Nenhum registro encontrado") aparece à direita, espremido e cortado.

Causa raiz: em `src/pages/PacienteDetalhe.tsx` (linha 133), o container do corpo usa `flex flex-1 overflow-hidden` sem direção responsiva. A `PacienteSidebar` em mobile retorna um bloco (dropdown), mas como o pai é `flex` (row), ela divide a largura com o `<main>`. No desktop esse layout está certo (sidebar + conteúdo lado a lado), mas em mobile precisa empilhar.

## Correção principal

`src/pages/PacienteDetalhe.tsx`
- Trocar a div da linha 133 para empilhar em mobile e manter linha em desktop:
  - `flex flex-col md:flex-row flex-1 overflow-hidden`
- Garantir que `<main>` ocupe largura total no mobile (já tem `flex-1 min-w-0`, vai funcionar com `flex-col`).

`src/components/paciente/PacienteSidebar.tsx`
- O bloco mobile (linha 49) deve ficar full-width e não competir por largura. Já está `w-full` no Button, mas o container não restringe — apenas confirmar que com o pai `flex-col` ele ocupa 100%.

## Ajustes adicionais de polimento mobile

`src/components/paciente/PacienteHeader.tsx`
- Está OK; manter como está (avatar/nome/badges + dropdown de ações já responsivo).

`src/components/paciente/AcompanhamentoSection.tsx`
- Os filtros (4 sem / 3 meses / 6 meses / Tudo) + botões "Relatório Mensal" e "Registrar semana" no topo já têm `flex-wrap`. Reduzir gap em mobile e permitir que "Relatório Mensal" e "Registrar" quebrem para nova linha está OK. Sem mudanças necessárias.

`src/components/paciente/PlanoAlimentarSection.tsx`
- O header de cada card (linhas 161-187) tem 5 botões de ação à direita + título à esquerda numa única `flex` sem wrap. Em telas estreitas isso pode espremer o título.
- Ajuste: adicionar `flex-wrap gap-2` no container e permitir que os botões quebrem para a linha de baixo se necessário.

`src/components/paciente/VisaoGeral.tsx`
- Já usa `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. OK.

## Resumo dos arquivos modificados

1. `src/pages/PacienteDetalhe.tsx` — corrigir flex direction responsivo (FIX PRINCIPAL do bug do print)
2. `src/components/paciente/PlanoAlimentarSection.tsx` — permitir wrap dos botões de ação no card de plano em telas estreitas

## O que NÃO muda

- Layout desktop permanece idêntico (sidebar fixa de 224px à esquerda + conteúdo).
- Funcionalidades, dados, fluxos e RLS permanecem inalterados.
