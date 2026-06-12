
## Diagnóstico (com base no PDF da Érica vs. o que apareceu na tela)

O PDF da Opção A do Almoço diz:
- Carne magra (patinho ou alcatra) 105g
- Batata inglesa cozida 290g
- Folhas e legumes — à vontade
- Azeite de oliva 5g
- **Maçã** 130g
- Total da opção: **507 kcal · P 40 · C 61 · G 12**

O sistema importou:
- "Carne suína, lombo, assado" 276 kcal  ← errado
- Batata inglesa, cozida 151 kcal  ← ok
- folhas e legumes 0 kcal  ← ok
- Azeite de oliva 44 kcal  ← ok
- **"Macarrão, cozido"** 144 kcal  ← errado (era Maçã)
- Total do header: 615 kcal · P 38 · C 67 · G 22  ← errado (devia mostrar 507/40/61/12 do PDF)

Causas reais no código (`supabase/functions/import-plano-pdf/index.ts`):

1. **`findTaco` casa por prefixo perigoso e por primeiro token solto.**
   - `tacoIndex.find(t => t.norm.startsWith(n) || n.startsWith(t.norm))` faz "maca" casar com "macarrao cozido", "uva" casar com "uva-passa", etc.
   - O fallback final `tacoIndex.find(t => t.norm.includes(tokens[0]))` pega o primeiro item que contenha "carne", resultando em "Carne suína, lombo, assado" para "carne magra".

2. **Nome do alimento é sobrescrito pelo nome do TACO** (`nome_alimento: taco.nome`), então mesmo quando o match é razoável o usuário vê "Macarrão, cozido" no lugar de "Maçã" e perde a redação original do nutricionista.

3. **Os totais por opção que o PDF já traz (kcal · P · C · G) são ignorados.** Hoje somamos sempre os macros calculados via TACO, que ficam enviesados por qualquer match ruim. O nutricionista perde a referência real.

4. **A IA não está sendo instruída a extrair esses totais por opção**, nem a separar parênteses de "preparo/observação" (ex.: "(patinho ou alcatra)") do nome principal do alimento.

## O que vai ser feito

### 1. Reescrever `findTaco` com regras seguras
- Normalizar removendo acentos, parênteses e separadores (`,` `·` `-`).
- Match em ordem: (a) igualdade exata, (b) match por todos os tokens significativos (>=4 chars) presentes no nome TACO, (c) match por alias (dicionário curado), (d) sem match → retorna `null` (não chuta).
- **Proibir startsWith/includes em tokens <=4 chars** (evita maca→macarrão, uva→uva-passa, mel→melancia).
- Adicionar dicionário de aliases comuns do dia a dia que não batem 1:1 com o texto TACO:
  - `maca`/`maçã` → "Maçã"
  - `ponca`/`poncã` → "Tangerina/Poncã" (ou marcar como precisa_revisao se não existir)
  - `carne magra` / `patinho` → "Carne bovina, patinho, grelhado"
  - `carne moida` → "Carne bovina, acém, moída, cozida" (ou patinho moído se houver)
  - `frango grelhado` → "Frango, peito, grelhado"
  - `tilapia` → "Peixe, tilápia, cozida"
  - `atum` → "Peixe, atum, em água, enlatado"
  - `arroz` → "Arroz, integral, cozido" só se o PDF disser integral; senão "Arroz, cozido"
  - `macarrao de arroz` → entrada própria (não casar com "Macarrão, cozido" comum)
  - `iogurte natural zero lactose` → "Iogurte, natural"
  - `aveia em flocos` → "Aveia, flocos, crua"
  - `pasta de amendoim` → "Amendoim, grão, cru" (com `precisa_revisao=true` para o nutri conferir)
  - `tapioca (goma)` → "Tapioca, goma"

### 2. Preservar o nome original do PDF
- `nome_alimento` passa a ser o nome literal extraído pela IA (ex.: "Carne magra (patinho ou alcatra)", "Maçã", "Macarrão de arroz cozido").
- O TACO é usado **só** para calcular macros e guardar `alimento_taco_id`. Se não houver match → macros 0 + `precisa_revisao=true` + ícone de aviso que já existe no editor.

### 3. Usar os totais por opção que vêm no PDF
- Estender o schema da tool da IA com `kcal_opcao`, `prot_opcao_g`, `carb_opcao_g`, `gord_opcao_g` por opção (e opcional `kcal_alimento` por alimento quando o PDF traz).
- Reforçar no prompt: "Se o PDF traz um cabeçalho da opção tipo '507 kcal · P 40 · C 61 · G 12', extraia esses 4 valores em kcal_opcao/prot/carb/gord_opcao_g."
- No editor (`PlanoAlimentarEditor.tsx`):
  - Quando a opção tiver totais vindos do PDF, mostrar **esses** valores no badge da opção e no header da refeição (Opção A: 507 kcal · P 40 · C 61 · G 12) com legenda "valores do PDF".
  - Os totais calculados via TACO ficam disponíveis como referência secundária (tooltip "Calculado TACO: …") para o nutri comparar e ajustar.
  - O totalizador do topo passa a somar, por refeição, os totais da opção selecionada usando os valores do PDF quando existirem, caindo para o cálculo TACO quando não houver.

### 4. Limpeza de nome enviada pela IA
- No system prompt: "Separe o nome principal de parênteses descritivos. Ex.: 'Carne magra (patinho ou alcatra)' → nome='Carne magra', nota='patinho ou alcatra'."
- Adicionar campo `nota` opcional no alimento, exibido como subtítulo cinza no editor (sem afetar o match TACO, que usa o nome limpo + alias).

### 5. Marcar visualmente os macros sem TACO
- Quando `alimento_taco_id` é null e o PDF não traz kcal por alimento, exibir "—" em vez de "0" nas colunas kcal/P/C/G e manter o ⚠️ "precisa revisão" já existente, para evitar a sensação de que está "calculando errado".

## Validação (com o próprio PDF da Érica)

Reimportar o PDF e conferir, para a Opção A do Almoço:
- Carne magra (patinho ou alcatra) — match com "Carne bovina, patinho, grelhado", ~230 kcal em 105g
- Maçã 130g — match correto, ~78 kcal
- Header da opção: 507 kcal · P 40 · C 61 · G 12 (valores do PDF, não recalculados)
- Trocar para Opção B/C: header do topo recalcula com os totais do PDF da opção escolhida.

Checar também Lanche A (419/18/60/12) e Jantar A (453/37/48/12).

## Arquivos alterados

- `supabase/functions/import-plano-pdf/index.ts` — novo `findTaco`, dicionário de aliases, parsing de totais por opção, preservação do nome original, campo `nota`.
- `src/components/paciente/PlanoAlimentarEditor.tsx` — exibir totais do PDF quando existirem, fallback para TACO, "—" para alimentos sem match, subtítulo `nota`.
- `src/lib/pdf/planoAlimentarPdf.ts` — totais do PDF na exportação quando disponíveis (consistência com a tela).

Nenhuma alteração de schema do banco é necessária: `alimentos_plano` já tem colunas livres para guardar os valores; o que muda é a origem dos números.
