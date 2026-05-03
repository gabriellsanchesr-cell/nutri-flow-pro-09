# Importar Plano Alimentar via PDF

Sim, dá para fazer. A ideia: você sobe o PDF, uma IA lê o texto e devolve a estrutura (refeições + alimentos + quantidades), o sistema cria o plano como se tivesse sido digitado aqui, e você pode revisar/editar antes de ativar.

## Fluxo do usuário

1. Na seção "Planos Alimentares" do paciente, novo botão **"Importar PDF"** ao lado de "Novo Plano".
2. Modal abre: você escolhe o arquivo PDF (até 10 MB) e dá um nome ao plano.
3. Sistema processa (5–20s) com indicador de progresso: "Lendo PDF... Interpretando refeições... Calculando macros...".
4. Ao terminar, abre direto o **Editor de Plano Alimentar já preenchido** com refeições, alimentos, quantidades e medidas caseiras extraídas — em status `rascunho`.
5. Você revisa, ajusta o que precisar (a IA pode errar quantidades exóticas), salva e ativa normalmente.
6. Banner no topo do editor: "Plano importado de PDF — revise antes de ativar".

## O que a IA reconhece

- **Refeições**: Café da manhã, Lanche da manhã, Almoço, Lanche da tarde, Jantar, Ceia (mapeadas para os tipos do sistema).
- **Alimentos por refeição**: nome, quantidade em gramas/ml, medida caseira ("1 xícara", "2 fatias").
- **Substituições sugeridas** (quando o PDF lista "ou", "substituir por").
- **Observações gerais** do plano e por refeição.
- Match automático com a base TACO quando o nome bate, para puxar macros (kcal, P, C, L, fibra). Quando não bater, deixa em branco para você completar — sem inventar valores.

## Mudanças técnicas

**Backend (Edge Function `import-plano-pdf`)**
- Recebe: `{ paciente_id, nome_plano, pdf_base64 }`.
- Faz upload do PDF para o bucket `documentos-pdf` (já existe) em `planos-importados/{paciente_id}/{timestamp}.pdf` para auditoria.
- Extrai texto do PDF usando `pdf-parse` (Deno-compatível) ou envia o PDF direto para o Lovable AI Gateway com `google/gemini-2.5-pro` (suporta input multimodal — lê o PDF como imagem, mais robusto para PDFs escaneados/com layout complexo).
- Prompt estruturado pedindo JSON com schema fixo:
  ```json
  {
    "observacoes": "...",
    "refeicoes": [
      { "tipo": "cafe_da_manha", "ordem": 1, "observacoes": "...",
        "alimentos": [{ "nome": "Aveia em flocos", "quantidade_g": 30, "medida_caseira": "3 col sopa" }],
        "substituicoes": "..." }
    ]
  }
  ```
- Para cada alimento extraído, faz lookup case-insensitive em `alimentos_taco` (já existe) e popula macros proporcionalmente à quantidade. Se não achar, retorna macros zerados e marca `precisa_revisao: true`.
- Retorna o JSON pronto para o frontend criar/preencher o editor.
- CORS + validação de JWT + Zod no input.

**Frontend**
- `src/components/paciente/ImportarPlanoPdfModal.tsx` (novo): file picker, nome, chamada à edge function, estados de loading/erro.
- `src/components/paciente/PlanoAlimentarSection.tsx`: botão "Importar PDF" + integração do modal. Após sucesso, navega para o editor com os dados pré-carregados.
- `src/components/paciente/PlanoAlimentarEditor.tsx`: aceita prop opcional `initialData` (refeições já estruturadas) para hidratar o estado quando vindo de import. Banner de aviso "rascunho importado". Highlight visual nos itens com `precisa_revisao`.

**Sem migrations de schema** — usa as tabelas existentes (`planos_alimentares`, `refeicoes`, `alimentos_plano`). O plano é salvo como `rascunho` quando você clicar Salvar no editor, igual fluxo manual.

## Limitações honestas

- PDFs escaneados de baixa qualidade ou manuscritos podem falhar — a IA avisa "não consegui interpretar" e você cria manualmente.
- Quantidades em medidas exóticas ("1 concha média") são estimadas; sempre revisar.
- Macros vêm da TACO quando o alimento bate; alimentos industrializados/marcas específicas ficam zerados para você preencher.

## Custo

Usa Lovable AI Gateway (`google/gemini-2.5-pro` para multimodal) — sem necessidade de chave externa. Cada importação consome ~1 chamada multimodal.
