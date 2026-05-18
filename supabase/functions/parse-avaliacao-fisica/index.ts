// @ts-nocheck
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const FIELD_SPEC = `
Campos a extrair (use null se ausente). Unidades: peso/massas em kg, altura em cm, dobras em mm, circunferências em cm, percentuais em %.

Básicos: peso, altura, imc
Dobras (mm): dobra_triceps, dobra_biceps, dobra_abdominal, dobra_subescapular, dobra_axilar_media, dobra_coxa, dobra_toracica, dobra_suprailiaca, dobra_panturrilha, dobra_supraespinhal, dobra_peitoral
Circunferências (cm): circ_pescoco, circ_torax, circ_ombro, circ_cintura, circ_quadril, circ_abdomen, circ_braco_dir, circ_braco_esq, circ_braco_contraido, circ_antebraco, circ_coxa_dir, circ_coxa_esq, circ_panturrilha
Bioimpedância: bio_percentual_gordura, bio_percentual_ideal, bio_massa_gorda, bio_percentual_massa_muscular, bio_massa_muscular, bio_agua_corporal, bio_peso_osseo, bio_massa_livre_gordura, bio_gordura_visceral, bio_idade_metabolica, bio_metabolismo_basal
Outros: protocolo_dobras (um destes ou null: pollock3, pollock7, petroski, guedes, durnin, faulkner), percentual_gordura_dobras, massa_gorda_kg, massa_magra_kg, observacoes (resumo textual de qualquer informação relevante encontrada que não se encaixa nos campos acima, máx 500 chars)
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileBase64, mimeType } = await req.json();
    if (!fileBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'fileBase64 e mimeType são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataUrl = `data:${mimeType};base64,${fileBase64}`;

    const systemPrompt = `Você é um assistente que extrai dados de avaliações físicas/antropométricas de documentos (PDF, imagens) gerados por diversos softwares e bioimpedâncias (InBody, Tanita, Body Metrix, planilhas manuais, etc).

Sua tarefa: ler o documento e retornar APENAS um JSON válido com os campos abaixo. Não escreva explicações fora do JSON.

${FIELD_SPEC}

Regras:
- Se um campo não estiver presente, retorne null (não invente valores).
- Converta unidades quando necessário (libras→kg, polegadas→cm).
- Para dobras cutâneas, use mm.
- Para protocolo_dobras, identifique pelo nome ou pelas dobras coletadas.
- Em "observacoes" inclua: nome do software/equipamento, qualquer dado adicional (TMB, classificações, recomendações curtas).`;

    const userContent: any[] = [
      { type: 'text', text: 'Extraia os dados desta avaliação física e retorne o JSON solicitado.' },
      { type: 'image_url', image_url: { url: dataUrl } },
    ];

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de uso da IA atingido. Tente novamente em instantes.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos para continuar.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error('AI gateway error', aiRes.status, txt);
      return new Response(JSON.stringify({ error: 'Falha ao processar com IA', detail: txt }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? '{}';
    let extracted: Record<string, any> = {};
    try {
      extracted = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      console.error('JSON parse error', e, content);
      extracted = {};
    }

    // Sanitize: remove null/undefined keys, coerce numbers
    const NUM_KEYS = new Set([
      'peso','altura','imc',
      'dobra_triceps','dobra_biceps','dobra_abdominal','dobra_subescapular','dobra_axilar_media','dobra_coxa','dobra_toracica','dobra_suprailiaca','dobra_panturrilha','dobra_supraespinhal','dobra_peitoral',
      'circ_pescoco','circ_torax','circ_ombro','circ_cintura','circ_quadril','circ_abdomen','circ_braco_dir','circ_braco_esq','circ_braco_contraido','circ_antebraco','circ_coxa_dir','circ_coxa_esq','circ_panturrilha',
      'bio_percentual_gordura','bio_percentual_ideal','bio_massa_gorda','bio_percentual_massa_muscular','bio_massa_muscular','bio_agua_corporal','bio_peso_osseo','bio_massa_livre_gordura','bio_gordura_visceral','bio_idade_metabolica','bio_metabolismo_basal',
      'percentual_gordura_dobras','massa_gorda_kg','massa_magra_kg',
    ]);
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(extracted)) {
      if (v === null || v === undefined || v === '') continue;
      if (NUM_KEYS.has(k)) {
        const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
        if (!isNaN(n)) clean[k] = n;
      } else {
        clean[k] = v;
      }
    }

    return new Response(JSON.stringify({ extracted: clean }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('parse-avaliacao-fisica error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Erro inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
