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

const SYSTEM_PROMPT = `Você é um assistente que extrai planos alimentares estruturados a partir de texto bruto de PDFs feitos por nutricionistas (em português brasileiro).

Sua tarefa: ler o conteúdo e devolver um JSON com as refeições, alimentos, quantidades em gramas e medidas caseiras.

Regras:
- Tipos de refeição válidos (use exatamente estes valores): cafe_da_manha, lanche_da_manha, almoco, lanche_da_tarde, jantar, ceia.
- Mapeie variações ("café", "desjejum" -> cafe_da_manha; "colação", "lanche manhã" -> lanche_da_manha; "almoço" -> almoco; "lanche tarde", "merenda" -> lanche_da_tarde; "jantar", "janta" -> jantar; "ceia", "antes de dormir" -> ceia).
- Para cada alimento extraia: nome (sem marca, em singular minúsculo), quantidade_g (número em gramas/ml — converta unidades como "1 fatia"≈30g, "1 col sopa"≈15g, "1 xícara"≈200ml, "1 unidade média maçã"≈130g), medida_caseira (texto original como aparece, ex: "1 fatia", "2 col sopa").
- Se a quantidade não estiver clara, faça uma estimativa razoável e marque "precisa_revisao": true para esse alimento.
- Substituições/alternativas vão em "substituicoes" como texto da refeição.
- Observações da refeição vão em "observacoes". Observações gerais do plano vão na raiz.
- Não invente refeições que não existem no PDF. Não duplique alimentos.
- Devolva APENAS JSON válido conforme o schema da tool.`;

interface AlimentoExtraido {
  nome: string;
  quantidade_g: number;
  medida_caseira: string;
  precisa_revisao?: boolean;
}

interface RefeicaoExtraida {
  tipo: string;
  ordem: number;
  observacoes?: string;
  substituicoes?: string;
  alimentos: AlimentoExtraido[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return json({ error: "Não autenticado" }, 401);
    }

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
    const mode: string = body?.mode || "paciente"; // "paciente" | "template"
    if (!pdfBase64) {
      return json({ error: "pdf_base64 é obrigatório" }, 400);
    }
    if (mode === "paciente" && !pacienteId) {
      return json({ error: "paciente_id é obrigatório no modo paciente" }, 400);
    }

    // Decode PDF
    const binaryStr = atob(pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    // Extract text (texto selecionável)
    let pdfText = "";
    try {
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      pdfText = (Array.isArray(text) ? text.join("\n") : text).trim();
    } catch (e) {
      console.warn("PDF text parse failed, will try OCR:", e);
    }

    // Truncate if too large
    const MAX_CHARS = 40000;
    if (pdfText.length > MAX_CHARS) pdfText = pdfText.slice(0, MAX_CHARS);

    const useOcr = pdfText.length < 30;
    if (useOcr) {
      console.log("PDF sem texto selecionável — enviando para OCR multimodal");
    }

    // Tamanho do PDF para OCR (limite ~15MB base64)
    if (useOcr && pdfBase64.length > 15 * 1024 * 1024) {
      return json({ error: "PDF muito grande para OCR (máx ~10 MB). Tente reduzir o arquivo." }, 413);
    }

    const userMessage: any = useOcr
      ? {
          role: "user",
          content: [
            { type: "text", text: "Este PDF é um plano alimentar (provavelmente escaneado/imagem). Faça OCR e extraia a estrutura conforme o schema da tool." },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
          ],
        }
      : { role: "user", content: `Conteúdo do PDF:\n\n${pdfText}` };

    // Call AI gateway with tool calling for structured output
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
                        tipo: { type: "string", enum: TIPOS_VALIDOS },
                        ordem: { type: "number" },
                        observacoes: { type: "string" },
                        substituicoes: { type: "string" },
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
                      },
                      required: ["tipo", "ordem", "alimentos"],
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

    // Match with TACO database
    const admin = createClient(supabaseUrl, supabaseService);
    const { data: tacoAll } = await admin
      .from("alimentos_taco")
      .select("id, nome, energia_kcal, proteina_g, carboidrato_g, lipidio_g, fibra_g");

    const normalize = (s: string) =>
      s.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const tacoIndex = (tacoAll || []).map((t) => ({
      ...t,
      norm: normalize(t.nome),
    }));

    function findTaco(nome: string) {
      const n = normalize(nome);
      if (!n) return null;
      // exact
      let m = tacoIndex.find((t) => t.norm === n);
      if (m) return m;
      // starts-with
      m = tacoIndex.find((t) => t.norm.startsWith(n) || n.startsWith(t.norm));
      if (m) return m;
      // token overlap: all words of query present in candidate
      const tokens = n.split(" ").filter((w) => w.length >= 3);
      if (tokens.length === 0) return null;
      const candidates = tacoIndex.filter((t) =>
        tokens.every((tok) => t.norm.includes(tok))
      );
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.norm.length - b.norm.length);
        return candidates[0];
      }
      // first token match (loose)
      m = tacoIndex.find((t) => t.norm.includes(tokens[0]));
      return m || null;
    }

    // Enrich
    const refeicoesEnriquecidas = parsed.refeicoes
      .filter((r) => TIPOS_VALIDOS.includes(r.tipo))
      .map((r, i) => ({
        tipo: r.tipo,
        ordem: r.ordem || i + 1,
        observacoes: r.observacoes || "",
        substituicoes_sugeridas: r.substituicoes || "",
        alimentos: (r.alimentos || []).map((a) => {
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
            energia_kcal: 0,
            proteina_g: 0,
            carboidrato_g: 0,
            lipidio_g: 0,
            fibra_g: 0,
            alimento_taco_id: null,
            precisa_revisao: true,
          };
        }),
      }));

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
