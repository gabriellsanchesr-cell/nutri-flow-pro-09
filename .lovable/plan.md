## Objetivo

Permitir cadastrar avaliações físicas de pacientes vindos de outros apps (InBody, Tanita, bioimpedâncias, planilhas, etc.) fazendo upload de um **PDF ou imagem da avaliação**. A IA lê o arquivo, extrai os dados antropométricos e preenche automaticamente uma nova avaliação no histórico — mantendo a mesma estrutura de visualização/gráficos atuais.

## Fluxo do usuário

1. Em `Pacientes → [Paciente] → Avaliações Físicas`, novo botão **"Importar avaliação"** ao lado de "Nova Avaliação".
2. Modal solicita: data da avaliação + arquivo (PDF, JPG, PNG).
3. Sistema envia para uma edge function que usa **Lovable AI (Gemini multimodal)** para extrair os campos.
4. A tela do formulário abre **pré-preenchida** com tudo que a IA detectou — usuário revisa, ajusta e salva normalmente.
5. Histórico, gráficos de evolução e PDF de avaliação passam a incluir esses registros como qualquer outro.

## Mudanças

### 1. Edge function `parse-avaliacao-fisica` (nova)
- Recebe `{ fileBase64, mimeType }`.
- Chama Lovable AI Gateway com `google/gemini-3-flash-preview` (multimodal) usando **structured output** (`Output.object` + Zod) com schema cobrindo todos os campos da tabela `avaliacoes_fisicas`:
  - Básicos: `peso`, `altura`, `imc`
  - Dobras (todas as 11 em `FOLD_FIELDS`)
  - Circunferências (todas as 13 em `CIRC_FIELDS`)
  - Bioimpedância (todos os 11 em `BIO_FIELDS`)
  - Observações livres detectadas
- Prompt instrui o modelo a retornar `null` para campos ausentes, normalizar unidades (cm, kg, mm, %), e identificar o protocolo de dobras se mencionado.
- Retorna `{ extracted: {...campos}, confidence: "high"|"medium"|"low", raw_notes: string }`.
- Valida JWT, CORS, trata 429/402.

### 2. Componente `ImportarAvaliacaoModal.tsx` (novo)
- Dialog com `Input type="file"` (`accept=".pdf,image/*"`), input de data da avaliação, botão "Analisar".
- Mostra loader durante o processamento ("Lendo avaliação com IA…").
- Após resposta, fecha o modal e abre o formulário de avaliação em modo "form" já preenchido com os campos extraídos + flag visual indicando que foi importado.

### 3. `AvaliacoesFisicasSection.tsx`
- Adicionar botão **"Importar"** (ícone Upload) ao lado de "Nova Avaliação".
- Adicionar handler `openFormPrefilled(data)` que faz `setForm({ ...data })` e `setView("form")`.
- No topo do formulário, quando vier de importação, mostrar badge "Importado por IA — revise os dados antes de salvar".

### 4. Coluna opcional `origem` em `avaliacoes_fisicas` (migration)
- `origem text default 'manual'` (valores: `'manual' | 'importado_ia'`).
- Usada apenas para exibir o badge no card da listagem.

## Fora do escopo
- Importar lote de múltiplos PDFs de uma vez.
- Editar o prompt de IA pela UI.
- Mudar a visualização existente da lista/gráficos (continua igual — só passa a ter mais registros).
- Integração direta com APIs de balanças/bioimpedâncias.

## Notas técnicas
- A função usa `LOVABLE_API_KEY` (já configurada).
- Para PDFs, envia direto como `inlineData` para o Gemini (suporta PDF nativo até 50 páginas).
- Cliente abre o arquivo com `FileReader.readAsDataURL` e envia base64.
