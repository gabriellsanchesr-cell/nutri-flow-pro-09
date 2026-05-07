## Objetivo

Tornar a criação de planos alimentares mais fluida em dois pontos:

1. **Adição de alimento personalizado** mais completa e prática (hoje cria um item vazio "Alimento personalizado" com tudo zerado, exigindo edição linha a linha sem campos visíveis para macros).
2. **Substituições automáticas** carregadas no momento em que um alimento é adicionado à refeição — já com a **quantidade equivalente** (mesma kcal de referência), em vez de exigir clique em "Sugerir Substituições" e mostrar texto solto.

---

## Mudanças propostas

### 1. Modal de alimento personalizado

Substituir o botão atual "Personalizado" (que insere uma linha vazia) por um **modal de cadastro rápido** com:

- Nome do alimento (obrigatório)
- Quantidade (g) e medida caseira (ex.: "1 fatia", "1 colher de sopa")
- Macros por porção informada: kcal, proteína, carboidrato, gordura, fibra
- Botão opcional **"Salvar na minha biblioteca"** — grava o alimento numa nova tabela `alimentos_personalizados` (por nutricionista) para reutilização futura
- Os personalizados salvos aparecem na busca normal, marcados com tag "Meu" ao lado dos resultados da TACO

Resultado: o nutri preenche tudo de uma vez, e ainda monta sua própria base.

### 2. Substituições automáticas por alimento

Hoje a coluna "Substituições Sugeridas" é texto livre por refeição, e o botão pega substituições do grupo inteiro sem proporção.

Nova lógica, disparada **automaticamente ao adicionar um alimento da TACO** à refeição:

- Identificar o `grupo` do alimento adicionado.
- Buscar em `substituicoes` as opções daquele grupo onde `alimento_original` = nome (ou parte do nome) do alimento adicionado.
- Para cada substituto, calcular a **quantidade equivalente em gramas** que entrega aproximadamente as mesmas kcal do alimento original na quantidade escolhida:
  - `qtd_substituto = (kcal_original_total / kcal_substituto_por_100g) * 100`
  - Se o substituto também existir na base TACO (match por nome), usar suas kcal/100g; se não existir, mostrar como informativo sem grama exata.
- Renderizar as substituições **abaixo de cada linha de alimento** (collapsible "Ver substituições (N)"), em formato visual:
  - `Arroz integral cozido — 130g (≈ mesma energia)` com macros calculados
  - Cada item tem botão **"Substituir"** (troca o alimento na linha) e **"Adicionar como opção"** (acumula no campo `substituicoes_sugeridas` da refeição, com a quantidade já calculada).
- Recalcular automaticamente quando a quantidade do alimento original muda.

### 3. Manter o campo de texto de substituições

O `substituicoes_sugeridas` (texto livre) continua existindo para anotações manuais e é preenchido pelo botão "Adicionar como opção" no formato:
`"100g de Arroz branco → 130g de Arroz integral (≈155 kcal)"`

### 4. Pequenas melhorias de UX no editor

- Mostrar o nome completo do alimento com tooltip quando truncar.
- Mostrar grupo (badge colorido) ao lado do nome na tabela de alimentos da refeição.
- Ao adicionar alimento, manter o campo de busca focado para inserções em sequência.

---

## Detalhes técnicos

**Banco de dados (migração):**

- Nova tabela `alimentos_personalizados`:
  - `id uuid pk`, `user_id uuid`, `nome text`, `grupo grupo_alimentar`, `quantidade_base numeric default 100`, `medida_caseira text`, `energia_kcal numeric`, `proteina_g`, `carboidrato_g`, `lipidio_g`, `fibra_g`, `created_at timestamptz`
  - RLS: nutri gerencia os próprios + equipe via `can_access_nutri_data(user_id)`.

**Frontend (`src/components/paciente/PlanoAlimentarEditor.tsx`):**

- Novo componente `AlimentoPersonalizadoModal` (Dialog) com formulário e flag "salvar na biblioteca".
- `AlimentoSearch`: além do `alimentos_taco`, fazer query paralela em `alimentos_personalizados` filtrado por `user_id`, mesclar resultados com badge "Meu".
- Linha de alimento: novo bloco expansível `SubstituicoesInline` que carrega via `supabase.from('substituicoes')` filtrando por `grupo` e nome (ilike). Cache local por `alimento_taco_id` para evitar refetch.
- Função utilitária `calcularEquivalencia(alimentoOriginal, substituto)` retornando `{ quantidade_g, kcal, p, c, l }` usando dados TACO do substituto quando achados por nome.

**Sem mudança em:** estrutura de `refeicoes` / `alimentos_plano`, fluxo de salvar, exportação PDF.

---

## Fora do escopo

- Edição de substituições da biblioteca (já existe em `/biblioteca`).
- Sugestão por IA — apenas mapeamento direto via tabela `substituicoes` + TACO.
- Conversão por macros além de kcal (poderia ser próxima iteração: equivalência por proteína, por exemplo).
