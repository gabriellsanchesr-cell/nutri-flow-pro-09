import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TIPOS_VALIDOS = [
  "cafe_da_manha",
  "lanche_da_manha",
  "almoco",
  "lanche_da_tarde",
  "jantar",
  "ceia",
];

const SYSTEM_PROMPT = `Você é um extrator de planos alimentares estruturados a partir de PDFs feitos por nutricionistas (em português brasileiro).

REGRAS CRÍTICAS:
- COPIE LITERALMENTE os nomes dos alimentos e quantidades como aparecem no PDF. NUNCA invente alimentos, NUNCA troque "doce de leite" por "batata doce", NUNCA troque "suco de uva" por "suco de laranja", NUNCA troque "Maçã" por "Macarrão". Se estiver na dúvida, copie o termo exato e marque precisa_revisao=true.
- Para o campo "nome", devolva o nome PRINCIPAL do alimento, limpo, em minúsculo, SEM parênteses descritivos. Coloque o conteúdo entre parênteses no campo "nota". Exemplos:
  • "Carne magra (patinho ou alcatra)" → nome="carne magra", nota="patinho ou alcatra"
  • "Folhas e legumes (alface, rucula, cenoura)" → nome="folhas e legumes", nota="alface, rucula, cenoura"
  • "Ovos mexidos" → nome="ovos mexidos", sem nota
- Mantenha "macarrão de arroz" como nome próprio (NÃO encurte para "macarrão"). Mantenha "iogurte natural zero lactose" inteiro. Mantenha "tapioca (goma)" como nome="tapioca", nota="goma".
- Extraia TODAS as refeições do PDF na ordem em que aparecem.
- Para cada refeição, extraia o NOME exato do título (ex.: "Almoço", "Lanche da tarde", "Jantar", "Ceia") e o HORÁRIO no formato HH:MM se houver.
- Mapeie tipo_sugerido para o enum mais próximo: cafe_da_manha, lanche_da_manha, almoco, lanche_da_tarde, jantar, ceia.
- Cada refeição pode ter MÚLTIPLAS OPÇÕES (Opção A, Opção B, Opção C…). Extraia CADA OPÇÃO como item separado em opcoes, com sua própria lista de alimentos e suas próprias substituições por item.
- TOTAIS DA OPÇÃO: se o PDF traz no cabeçalho da opção algo como "507 kcal · P 40 · C 61 · G 12", preencha kcal_opcao=507, prot_opcao_g=40, carb_opcao_g=61, gord_opcao_g=12. NÃO recalcule, copie os valores do PDF. Se não houver, deixe em branco.
- Para cada alimento extraia: nome (limpo, minúsculo, sem parênteses), nota (texto entre parênteses, se houver), quantidade_g em GRAMAS/ML (converta unidades: "1 fatia"≈30g, "1 col sopa"≈15g, "1 xícara"≈200ml, "1 unidade média maçã"≈130g, "1 unidade média banana"≈65g, "1 ovo"≈50g, "1 clara"≈33g), medida_caseira (texto literal, ex.: "2 un (100g)" ou "à vontade").
- Para "à vontade", "a vontade", "livre" use quantidade_g=100 e medida_caseira="à vontade" e precisa_revisao=true.
- SUBSTITUIÇÕES POR ITEM: para cada opção, se houver bloco "SUBSTITUIÇÕES POR ITEM", extraia em substituicoes_por_item: para cada alimento base, alternativas[] com nome, quantidade_g e medida_caseira.
- Observações específicas da refeição vão em observacoes da refeição. Observações gerais do plano (notas clínicas, hidratação, lista de compras) vão na raiz em observacoes.
- Devolva APENAS JSON válido conforme o schema da tool.`;

interface AlimentoExtraido {
  nome: string;
  nota?: string;
  quantidade_g: number;
  medida_caseira: string;
  precisa_revisao?: boolean;
}

interface SubstituicaoItem {
  alimento_base: string;
  alternativas: AlimentoExtraido[];
}

interface OpcaoExtraida {
  letra: string;
  alimentos: AlimentoExtraido[];
  substituicoes_por_item?: SubstituicaoItem[];
  kcal_opcao?: number;
  prot_opcao_g?: number;
  carb_opcao_g?: number;
  gord_opcao_g?: number;
}

interface RefeicaoExtraida {
  nome: string;
  horario?: string;
  tipo_sugerido: string;
  ordem: number;
  observacoes?: string;
  opcoes: OpcaoExtraida[];
}

// Curated alias dictionary: maps normalized user text → preferred TACO name fragment
// The right side is matched (substring, all tokens) against the TACO catalog.
const ALIASES: Array<{ match: RegExp; tacoLike: string; precisaRevisao?: boolean }> = [
  // Frutas
  { match: /^maca$/, tacoLike: "maca com casca" },
  { match: /^maca fuji$/, tacoLike: "maca fuji" },
  { match: /^banana( prata)?$/, tacoLike: "banana prata" },
  { match: /^ponca$/, tacoLike: "tangerina", precisaRevisao: true },
  { match: /^tangerina$/, tacoLike: "tangerina" },
  // Carnes
  { match: /^carne magra/, tacoLike: "carne bovina patinho grelhado" },
  { match: /^patinho/, tacoLike: "carne bovina patinho grelhado" },
  { match: /^alcatra/, tacoLike: "carne bovina alcatra grelhada" },
  { match: /^carne moida/, tacoLike: "carne bovina acem cozido", precisaRevisao: true },
  { match: /^frango( grelhado| peito)?$/, tacoLike: "frango peito grelhado" },
  { match: /^tilapia( grelhada| cozida)?$/, tacoLike: "peixe tilapia cozida" },
  { match: /tilapia ou sardinha/, tacoLike: "peixe sardinha enlatada", precisaRevisao: true },
  { match: /^sardinha/, tacoLike: "peixe sardinha enlatada" },
  { match: /^atum/, tacoLike: "peixe atum em agua enlatado" },
  { match: /^salmao/, tacoLike: "peixe salmao grelhado" },
  // Ovos
  { match: /^ovos? mexidos?$/, tacoLike: "ovo de galinha inteiro cozido" },
  { match: /^ovos?$/, tacoLike: "ovo de galinha inteiro cozido" },
  { match: /^claras?( de ovo)?$/, tacoLike: "ovo de galinha clara", precisaRevisao: true },
  // Carboidratos
  { match: /^arroz( branco| cozido)?$/, tacoLike: "arroz cozido" },
  { match: /^arroz integral/, tacoLike: "arroz integral cozido" },
  { match: /^batata( inglesa)?( cozida)?$/, tacoLike: "batata inglesa cozida" },
  { match: /^batata[- ]doce( cozida)?$/, tacoLike: "batata-doce cozida" },
  { match: /^mandioca/, tacoLike: "mandioca cozida" },
  { match: /^inhame/, tacoLike: "inhame cozido" },
  { match: /^quinoa/, tacoLike: "quinoa" },
  { match: /^macarrao de arroz/, tacoLike: "macarrao de arroz", precisaRevisao: true },
  { match: /^macarrao( comum| trigo)?$/, tacoLike: "macarrao cozido" },
  { match: /^aveia/, tacoLike: "aveia flocos" },
  { match: /^tapioca( goma)?/, tacoLike: "tapioca" },
  // Folhas e legumes (não tem entrada precisa — marcar revisao)
  { match: /^folhas e legumes/, tacoLike: "alface", precisaRevisao: true },
  // Laticínios
  { match: /iogurte.*(zero lactose|natural|desnatado)/, tacoLike: "iogurte natural desnatado" },
  { match: /^iogurte/, tacoLike: "iogurte natural integral" },
  // Oleaginosas e gorduras
  { match: /^amendoas?$/, tacoLike: "amendoa", precisaRevisao: true },
  { match: /^amendoim/, tacoLike: "amendoim torrado" },
  { match: /^pasta de amendoim/, tacoLike: "pasta de amendoim" },
  { match: /^abacate/, tacoLike: "abacate" },
  { match: /^azeite/, tacoLike: "azeite oliva" },
  // Molho
  { match: /^molho de tomate/, tacoLike: "molho de tomate", precisaRevisao: true },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Não autenticado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json();
    const pacienteId: string | undefined = body?.paciente_id;
    const pdfBase64: string | undefined = body?.pdf_base64;
    const mode: string = body?.mode || "paciente";
    if (!pdfBase64) return json({ error: "pdf_base64 é obrigatório" }, 400);
    if (mode === "paciente" && !pacienteId) {
      return json({ error: "paciente_id é obrigatório no modo paciente" }, 400);
    }

    const binaryStr = atob(pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    let pdfText = "";
    try {
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      pdfText = (Array.isArray(text) ? text.join("\n") : text).trim();
    } catch (e) {
      console.warn("PDF text parse failed, will try OCR:", e);
    }

    const MAX_CHARS = 60000;
    if (pdfText.length > MAX_CHARS) pdfText = pdfText.slice(0, MAX_CHARS);

    const useOcr = pdfText.length < 30;
    if (useOcr && pdfBase64.length > 15 * 1024 * 1024) {
      return json({ error: "PDF muito grande para OCR (máx ~10 MB)." }, 413);
    }

    const userMessage: any = useOcr
      ? {
          role: "user",
          content: [
            { type: "text", text: "Este PDF é um plano alimentar (provavelmente escaneado). Faça OCR e extraia a estrutura completa conforme o schema, preservando opções A/B/C, totais por opção e substituições por item." },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
          ],
        }
      : { role: "user", content: `Conteúdo do PDF:\n\n${pdfText}` };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          userMessage,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "salvar_plano",
              description: "Salva o plano alimentar estruturado",
              parameters: {
                type: "object",
                properties: {
                  observacoes: { type: "string" },
                  refeicoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        horario: { type: "string" },
                        tipo_sugerido: { type: "string", enum: TIPOS_VALIDOS },
                        ordem: { type: "number" },
                        observacoes: { type: "string" },
                        opcoes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              letra: { type: "string" },
                              kcal_opcao: { type: "number", description: "Total de kcal da opção, conforme aparece no PDF (não recalcular)" },
                              prot_opcao_g: { type: "number" },
                              carb_opcao_g: { type: "number" },
                              gord_opcao_g: { type: "number" },
                              alimentos: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    nome: { type: "string" },
                                    nota: { type: "string", description: "Texto entre parênteses ou descritor secundário" },
                                    quantidade_g: { type: "number" },
                                    medida_caseira: { type: "string" },
                                    precisa_revisao: { type: "boolean" },
                                  },
                                  required: ["nome", "quantidade_g", "medida_caseira"],
                                },
                              },
                              substituicoes_por_item: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    alimento_base: { type: "string" },
                                    alternativas: {
                                      type: "array",
                                      items: {
                                        type: "object",
                                        properties: {
                                          nome: { type: "string" },
                                          nota: { type: "string" },
                                          quantidade_g: { type: "number" },
                                          medida_caseira: { type: "string" },
                                        },
                                        required: ["nome", "quantidade_g", "medida_caseira"],
                                      },
                                    },
                                  },
                                  required: ["alimento_base", "alternativas"],
                                },
                              },
                            },
                            required: ["letra", "alimentos"],
                          },
                        },
                      },
                      required: ["nome", "tipo_sugerido", "ordem", "opcoes"],
                    },
                  },
                },
                required: ["refeicoes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "salvar_plano" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Muitas requisições. Tente novamente em instantes." }, 429);
      if (aiResp.status === 402) return json({ error: "Créditos de IA esgotados no workspace Lovable." }, 402);
      return json({ error: "Erro ao chamar IA" }, 500);
    }

    const aiJson = await aiResp.json();
    const message = aiJson?.choices?.[0]?.message;
    const toolCall = message?.tool_calls?.[0];
    let rawArgs: string | undefined = toolCall?.function?.arguments;
    if (!rawArgs && typeof message?.content === "string") {
      const m = message.content.match(/\{[\s\S]*\}/);
      if (m) rawArgs = m[0];
    }
    if (!rawArgs) {
      console.error("No tool call/JSON:", JSON.stringify(aiJson).slice(0, 800));
      return json({ error: "IA não devolveu estrutura válida" }, 500);
    }
    let parsed: { observacoes?: string; refeicoes: RefeicaoExtraida[] };
    try {
      parsed = JSON.parse(rawArgs);
    } catch {
      return json({ error: "Resposta da IA inválida (JSON)" }, 500);
    }
    if (!Array.isArray(parsed.refeicoes) || parsed.refeicoes.length === 0) {
      return json({ error: "Nenhuma refeição identificada no PDF." }, 422);
    }

    // Sanitiza número aceitando "507", "507 kcal", "40g", "40,5", "P 40"
    const num = (v: any): number | undefined => {
      if (v == null) return undefined;
      if (typeof v === "number" && isFinite(v)) return v;
      const s = String(v).replace(",", ".").match(/-?\d+(\.\d+)?/);
      return s ? parseFloat(s[0]) : undefined;
    };

    // Fallback local: varre o texto do PDF capturando padrões como
    // "507 kcal · P 40 · C 61 · G 12" (separadores variados).
    const pdfTotalsQueue: Array<{ kcal: number; p?: number; c?: number; g?: number }> = [];
    if (pdfText) {
      const re = /(\d{2,4})\s*kcal[^\n]{0,80}?P[^\d]{0,4}(\d{1,3})[^\n]{0,20}?C[^\d]{0,4}(\d{1,3})[^\n]{0,20}?G[^\d]{0,4}(\d{1,3})/gi;
      let mm: RegExpExecArray | null;
      while ((mm = re.exec(pdfText)) !== null) {
        pdfTotalsQueue.push({
          kcal: parseInt(mm[1], 10),
          p: parseInt(mm[2], 10),
          c: parseInt(mm[3], 10),
          g: parseInt(mm[4], 10),
        });
      }
    }
    let pdfTotalsIdx = 0;
    const nextPdfTotal = () => pdfTotalsQueue[pdfTotalsIdx++];

    const admin = createClient(supabaseUrl, supabaseService);
    const { data: tacoAll } = await admin
      .from("alimentos_taco")
      .select("id, nome, energia_kcal, proteina_g, carboidrato_g, lipidio_g, fibra_g");

    const normalize = (s: string) =>
      (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\([^)]*\)/g, " ")
        .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

    const tacoIndex = (tacoAll || []).map((t) => ({ ...t, norm: normalize(t.nome) }));

    // SAFE matcher: never use prefix/includes on short tokens; require all significant
    // tokens (>=4 chars) to appear in the TACO name. Returns null when not confident.
    function matchTacoByText(text: string) {
      const n = normalize(text);
      if (!n) return null;
      // exact
      let m = tacoIndex.find((t) => t.norm === n);
      if (m) return m;
      // all significant tokens
      const tokens = n.split(" ").filter((w) => w.length >= 4);
      if (tokens.length === 0) return null;
      const candidates = tacoIndex.filter((t) =>
        tokens.every((tok) => new RegExp(`(^|\\s)${tok}`).test(t.norm))
      );
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.norm.length - b.norm.length);
        return candidates[0];
      }
      return null;
    }

    function findTaco(nome: string, nota?: string) {
      const n = normalize(nome);
      if (!n) return { taco: null, precisaRevisao: false };
      // 1. alias dictionary
      for (const alias of ALIASES) {
        if (alias.match.test(n)) {
          const t = matchTacoByText(alias.tacoLike);
          if (t) return { taco: t, precisaRevisao: !!alias.precisaRevisao };
        }
      }
      // 2. try literal name
      let t = matchTacoByText(n);
      if (t) return { taco: t, precisaRevisao: false };
      // 3. try name + nota combined (e.g., "carne magra" + "patinho")
      if (nota) {
        t = matchTacoByText(`${n} ${normalize(nota)}`);
        if (t) return { taco: t, precisaRevisao: false };
        t = matchTacoByText(normalize(nota));
        if (t) return { taco: t, precisaRevisao: false };
      }
      return { taco: null, precisaRevisao: true };
    }

    function enrichAlimento(a: AlimentoExtraido) {
      const { taco, precisaRevisao } = findTaco(a.nome, a.nota);
      const qty = Number(a.quantidade_g) || 100;
      const displayName = a.nota ? `${a.nome} (${a.nota})` : a.nome;
      if (taco) {
        const ratio = qty / 100;
        return {
          nome_alimento: displayName,
          quantidade: qty,
          medida_caseira: a.medida_caseira || "1 porção",
          energia_kcal: Number(taco.energia_kcal) * ratio,
          proteina_g: Number(taco.proteina_g) * ratio,
          carboidrato_g: Number(taco.carboidrato_g) * ratio,
          lipidio_g: Number(taco.lipidio_g) * ratio,
          fibra_g: Number(taco.fibra_g) * ratio,
          alimento_taco_id: taco.id,
          precisa_revisao: !!a.precisa_revisao || precisaRevisao,
        };
      }
      return {
        nome_alimento: displayName,
        quantidade: qty,
        medida_caseira: a.medida_caseira || "1 porção",
        energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipidio_g: 0, fibra_g: 0,
        alimento_taco_id: null,
        precisa_revisao: true,
      };
    }

    const refeicoesEnriquecidas = parsed.refeicoes.map((r, i) => {
      const tipo = TIPOS_VALIDOS.includes(r.tipo_sugerido) ? r.tipo_sugerido : "lanche_da_manha";
      const opcoes = (r.opcoes || []).map((op, j) => {
        const alimentos = (op.alimentos || []).map(enrichAlimento);
        const subsMap = new Map<string, AlimentoExtraido[]>();
        for (const s of op.substituicoes_por_item || []) {
          const key = normalize(s.alimento_base);
          if (!key) continue;
          subsMap.set(key, s.alternativas || []);
        }
        const alimentosComSubs = alimentos.map((a, idx) => {
          const aNorm = normalize(a.nome_alimento);
          let alts: AlimentoExtraido[] | undefined = subsMap.get(aNorm);
          if (!alts) {
            const baseToken = aNorm.split(" ")[0];
            for (const [k, v] of subsMap.entries()) {
              if (baseToken.length >= 4 && (k === baseToken || k.startsWith(baseToken + " "))) {
                alts = v;
                break;
              }
            }
          }
          const substituicoes = (alts || []).map((alt, k) => {
            const enriched = enrichAlimento(alt);
            return {
              nome: enriched.nome_alimento,
              quantidade: enriched.quantidade,
              medida_caseira: enriched.medida_caseira,
              alimento_taco_id: enriched.alimento_taco_id,
              ordem: k,
            };
          });
          return { ...a, ordem: idx, substituicoes };
        });
        let kcalOp = num(op.kcal_opcao);
        let pOp = num(op.prot_opcao_g);
        let cOp = num(op.carb_opcao_g);
        let gOp = num(op.gord_opcao_g);
        if (kcalOp == null) {
          // Fallback: consome o próximo total detectado no texto do PDF
          const pdfTot = nextPdfTotal();
          if (pdfTot) {
            kcalOp = pdfTot.kcal;
            pOp = pOp ?? pdfTot.p;
            cOp = cOp ?? pdfTot.c;
            gOp = gOp ?? pdfTot.g;
          }
        }
        return {
          letra: op.letra || String.fromCharCode(65 + j),
          alimentos: alimentosComSubs,
          kcal_opcao: kcalOp,
          prot_opcao_g: pOp,
          carb_opcao_g: cOp,
          gord_opcao_g: gOp,
        };
      });
      return {
        nome: r.nome || "",
        horario: r.horario || "",
        tipo,
        ordem: r.ordem || i + 1,
        observacoes: r.observacoes || "",
        opcoes,
      };
    });

    return json({
      observacoes: parsed.observacoes || "",
      refeicoes: refeicoesEnriquecidas,
    });
  } catch (e) {
    console.error("import-plano-pdf error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
