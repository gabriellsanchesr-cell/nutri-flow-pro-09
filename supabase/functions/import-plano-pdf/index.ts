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
- COPIE LITERALMENTE os nomes dos alimentos e quantidades como aparecem no PDF. NUNCA invente alimentos, NUNCA troque "doce de leite" por "batata doce", NUNCA troque "suco de uva" por "suco de laranja". Se estiver na dúvida, copie o termo exato e marque precisa_revisao=true.
- Extraia TODAS as refeições do PDF na ordem em que aparecem.
- Para cada refeição, extraia o NOME exato do título (ex.: "Pré-treino", "Café da manhã / pós-treino", "Almoço", "Lanche da tarde", "Jantar", "Ceia") e o HORÁRIO no formato HH:MM se houver (ex.: "06:30").
- Mapeie o tipo_sugerido para o enum mais próximo: cafe_da_manha, lanche_da_manha, almoco, lanche_da_tarde, jantar, ceia. Use "lanche_da_manha" para Pré-treino e "cafe_da_manha" para Pós-treino quando ambíguo.
- Cada refeição pode ter MÚLTIPLAS OPÇÕES (Opção A, Opção B, Opção C…). Extraia CADA OPÇÃO COMO UM ITEM SEPARADO no array opcoes, com sua própria lista de alimentos e suas próprias substituições por item.
- Se a refeição tiver apenas uma lista (sem opções A/B/C), use uma única opção com letra "A".
- Para cada alimento extraia: nome (limpo, sem marca, em minúsculo), quantidade_g em GRAMAS/ML (converta: "1 fatia"≈30g, "1 col sopa"≈15g, "1 xícara"≈200ml, "1 unidade média maçã"≈130g, "1 unidade média banana"≈65g, "1 medidor whey"=30g, "1 concha pequena feijão"≈65g), medida_caseira (texto literal como "2 fatias (50g)").
- SUBSTITUIÇÕES POR ITEM: cada opção pode ter um bloco "SUBSTITUIÇÕES POR ITEM" listando alternativas para cada alimento. Extraia em substituicoes_por_item: para cada alimento base do bloco, extraia alternativas[] com nome, quantidade_g e medida_caseira.
  Ex.: "Pão integral ↔ tapioca 40g goma · pão francês 1 unid · cuscuz 90g · torrada integral 4 unid"
  → alimento_base: "Pão integral", alternativas: [{nome:"tapioca goma", quantidade_g:40, medida_caseira:"40g goma"}, {nome:"pão francês", quantidade_g:50, medida_caseira:"1 unidade"}, {nome:"cuscuz", quantidade_g:90, medida_caseira:"90g"}, {nome:"torrada integral", quantidade_g:32, medida_caseira:"4 unidades"}]
- Observações da refeição vão em observacoes. Observações gerais do plano (hidratação, café, suplementação, totais, etc.) vão na raiz em observacoes.
- Devolva APENAS JSON válido conforme o schema da tool.`;

interface AlimentoExtraido {
  nome: string;
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
}

interface RefeicaoExtraida {
  nome: string;
  horario?: string;
  tipo_sugerido: string;
  ordem: number;
  observacoes?: string;
  opcoes: OpcaoExtraida[];
}

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

    // Decode PDF
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
            { type: "text", text: "Este PDF é um plano alimentar (provavelmente escaneado). Faça OCR e extraia a estrutura completa conforme o schema, preservando opções A/B/C e substituições por item." },
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
                  observacoes: { type: "string", description: "Observações gerais do plano (hidratação, suplementação, notas finais)" },
                  refeicoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string", description: "Nome literal da refeição como no PDF (ex.: 'Pré-treino', 'Café da manhã / pós-treino')" },
                        horario: { type: "string", description: "Horário no formato HH:MM se houver" },
                        tipo_sugerido: { type: "string", enum: TIPOS_VALIDOS },
                        ordem: { type: "number" },
                        observacoes: { type: "string" },
                        opcoes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              letra: { type: "string", description: "Letra da opção: A, B, C…" },
                              alimentos: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    nome: { type: "string" },
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
                                    alimento_base: { type: "string", description: "Nome do alimento base ao qual estas substituições se aplicam" },
                                    alternativas: {
                                      type: "array",
                                      items: {
                                        type: "object",
                                        properties: {
                                          nome: { type: "string" },
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
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call:", JSON.stringify(aiJson).slice(0, 500));
      return json({ error: "IA não devolveu estrutura válida" }, 500);
    }
    let parsed: { observacoes?: string; refeicoes: RefeicaoExtraida[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return json({ error: "Resposta da IA inválida" }, 500);
    }
    if (!parsed.refeicoes?.length) {
      return json({ error: "Nenhuma refeição identificada no PDF." }, 422);
    }

    // TACO
    const admin = createClient(supabaseUrl, supabaseService);
    const { data: tacoAll } = await admin
      .from("alimentos_taco")
      .select("id, nome, energia_kcal, proteina_g, carboidrato_g, lipidio_g, fibra_g");

    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const tacoIndex = (tacoAll || []).map((t) => ({ ...t, norm: normalize(t.nome) }));

    function findTaco(nome: string) {
      const n = normalize(nome);
      if (!n) return null;
      let m = tacoIndex.find((t) => t.norm === n);
      if (m) return m;
      m = tacoIndex.find((t) => t.norm.startsWith(n) || n.startsWith(t.norm));
      if (m) return m;
      const tokens = n.split(" ").filter((w) => w.length >= 3);
      if (tokens.length === 0) return null;
      const candidates = tacoIndex.filter((t) => tokens.every((tok) => t.norm.includes(tok)));
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.norm.length - b.norm.length);
        return candidates[0];
      }
      m = tacoIndex.find((t) => t.norm.includes(tokens[0]));
      return m || null;
    }

    function enrichAlimento(a: AlimentoExtraido) {
      const taco = findTaco(a.nome);
      const qty = Number(a.quantidade_g) || 100;
      if (taco) {
        const ratio = qty / 100;
        return {
          nome_alimento: taco.nome,
          quantidade: qty,
          medida_caseira: a.medida_caseira || "1 porção",
          energia_kcal: Number(taco.energia_kcal) * ratio,
          proteina_g: Number(taco.proteina_g) * ratio,
          carboidrato_g: Number(taco.carboidrato_g) * ratio,
          lipidio_g: Number(taco.lipidio_g) * ratio,
          fibra_g: Number(taco.fibra_g) * ratio,
          alimento_taco_id: taco.id,
          precisa_revisao: !!a.precisa_revisao,
        };
      }
      return {
        nome_alimento: a.nome,
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
        // Build per-base substitution map keyed by normalized base name
        const subsMap = new Map<string, AlimentoExtraido[]>();
        for (const s of op.substituicoes_por_item || []) {
          const key = normalize(s.alimento_base);
          if (!key) continue;
          subsMap.set(key, s.alternativas || []);
        }
        // Attach substituicoes structured to each food
        const alimentosComSubs = alimentos.map((a, idx) => {
          // try direct match by normalized name OR by first token
          const aNorm = normalize(a.nome_alimento);
          let alts: AlimentoExtraido[] | undefined = subsMap.get(aNorm);
          if (!alts) {
            const baseToken = aNorm.split(" ")[0];
            for (const [k, v] of subsMap.entries()) {
              if (k.includes(baseToken) || baseToken.includes(k.split(" ")[0])) {
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
        return { letra: op.letra || String.fromCharCode(65 + j), alimentos: alimentosComSubs };
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
