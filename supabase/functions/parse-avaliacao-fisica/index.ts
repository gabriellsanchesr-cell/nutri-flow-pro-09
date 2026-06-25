// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const FIELD_SPEC = `
CAMPOS ACEITOS (use null se ausente; unidades: peso/massas em kg, altura em cm, dobras em mm, circunferências em cm, percentuais em %).

Básicos: peso, altura, imc, classificacao_imc, relacao_cintura_quadril
Dobras (mm): dobra_triceps, dobra_biceps, dobra_abdominal, dobra_subescapular, dobra_axilar_media, dobra_coxa, dobra_toracica, dobra_suprailiaca, dobra_panturrilha, dobra_supraespinhal, dobra_peitoral
Circunferências (cm): circ_pescoco, circ_torax, circ_ombro, circ_cintura, circ_quadril, circ_abdomen, circ_braco_dir, circ_braco_esq, circ_braco_contraido, circ_antebraco, circ_coxa_dir, circ_coxa_esq, circ_coxa_proximal, circ_coxa_medial, circ_coxa_distal, circ_panturrilha
Bioimpedância: bio_percentual_gordura, bio_percentual_ideal, bio_massa_gorda, bio_percentual_massa_muscular, bio_massa_muscular, bio_agua_corporal, bio_peso_osseo, bio_massa_livre_gordura, bio_gordura_visceral, bio_idade_metabolica, bio_metabolismo_basal
Composição corporal calculada: percentual_gordura_dobras, massa_gorda_kg, massa_magra_kg, protocolo_dobras (um de: pollock3, pollock7, petroski, guedes, durnin, faulkner)
Outros: observacoes (texto livre com classificações, somatório de dobras, densidade corporal, risco metabólico, software de origem, etc — máx 600 chars)

MAPEAMENTO de termos comuns:
- "Circ. Musc. do Braço" / "CMB" → ignorar (é calculado)
- "Circunf. do Braço Relaxado" → circ_braco_dir
- "Circunf. do Braço Contraído" → circ_braco_contraido
- "Circ. Proximal/Medial/Distal da Coxa" → circ_coxa_proximal/medial/distal
- "Dobra Tricipital" → dobra_triceps; "Bicipital" → dobra_biceps
- "Massa Muscular (Kg)" (bioimpedância) → bio_massa_muscular
- "Água Corporal Total" → bio_agua_corporal (em kg, manter o valor)
- "Massa Óssea" → bio_peso_osseo
- "Idade Metabólica" → bio_idade_metabolica
- "Índice de Gordura Visceral" → bio_gordura_visceral
- "Massa livre de gordura" da bioimpedância → bio_massa_livre_gordura
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

    const systemPrompt = `Você é um assistente que extrai HISTÓRICO de avaliações físicas/antropométricas de documentos (PDF, imagens) gerados por softwares como WebDiet, Dietbox, InBody, Tanita, Body Metrix, planilhas, etc.

Documentos de EVOLUÇÃO geralmente têm UMA TABELA com VÁRIAS COLUNAS DE DATA — cada coluna é uma avaliação diferente. Sua tarefa é detectar TODAS as datas e retornar UMA avaliação por data.

Retorne APENAS um JSON válido no formato:
{
  "avaliacoes": [
    { "data_avaliacao": "YYYY-MM-DD", ...campos },
    ...
  ]
}

REGRAS:
- Converta datas de qualquer formato (dd/MM/yyyy, "20 dez 2025", etc) para YYYY-MM-DD.
- Para cada célula numérica, pegue APENAS o número — ignore setas ↑↓, variações entre parênteses como "(+2.1)", classificações textuais como "Adequado".
- As classificações textuais ("Sobrepeso", "Alta II", "Muito alto", "Adequado") devem ir para "observacoes" daquela coluna, formatadas como "Classif. IMC: Sobrepeso; Class. %GC: Alta II".
- Coluna de BIOIMPEDÂNCIA sem data explícita: associe à data mais próxima (geralmente a primeira). Se não houver datas, crie uma avaliação única.
- Se o mesmo campo aparece em duas seções (ex: "% Gordura" em dobras e em bioimpedância), use percentual_gordura_dobras para dobras e bio_percentual_gordura para bioimpedância.
- Omita campos sem valor (não inclua null no JSON).
- Se a coluna não tiver NENHUM dado numérico além da data, NÃO inclua essa avaliação.
- Converta unidades quando necessário (lb→kg, in→cm).
- Inclua no observacoes: nome do software/equipamento se detectado, somatório de dobras, densidade corporal, qualquer dado relevante.

${FIELD_SPEC}`;

    const userContent: any[] = [
      { type: 'text', text: 'Extraia TODAS as avaliações deste documento (uma por coluna de data detectada) e retorne o JSON solicitado.' },
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
    let parsed: any = {};
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      console.error('JSON parse error', e, content);
      parsed = {};
    }

    let avaliacoesRaw: any[] = [];
    if (Array.isArray(parsed?.avaliacoes)) {
      avaliacoesRaw = parsed.avaliacoes;
    } else if (parsed && typeof parsed === 'object') {
      // fallback: single avaliação
      avaliacoesRaw = [parsed];
    }

    const NUM_KEYS = new Set([
      'peso','altura','imc','relacao_cintura_quadril',
      'dobra_triceps','dobra_biceps','dobra_abdominal','dobra_subescapular','dobra_axilar_media','dobra_coxa','dobra_toracica','dobra_suprailiaca','dobra_panturrilha','dobra_supraespinhal','dobra_peitoral',
      'circ_pescoco','circ_torax','circ_ombro','circ_cintura','circ_quadril','circ_abdomen','circ_braco_dir','circ_braco_esq','circ_braco_contraido','circ_antebraco','circ_coxa_dir','circ_coxa_esq','circ_coxa_proximal','circ_coxa_medial','circ_coxa_distal','circ_panturrilha',
      'bio_percentual_gordura','bio_percentual_ideal','bio_massa_gorda','bio_percentual_massa_muscular','bio_massa_muscular','bio_agua_corporal','bio_peso_osseo','bio_massa_livre_gordura','bio_gordura_visceral','bio_idade_metabolica','bio_metabolismo_basal',
      'percentual_gordura_dobras','massa_gorda_kg','massa_magra_kg',
    ]);

    const avaliacoes = avaliacoesRaw
      .map((av) => {
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(av || {})) {
          if (v === null || v === undefined || v === '' || v === '-') continue;
          if (NUM_KEYS.has(k)) {
            const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
            if (!isNaN(n)) clean[k] = n;
          } else {
            clean[k] = v;
          }
        }
        return clean;
      })
      .filter((av) => {
        // must have a date and at least one numeric field
        if (!av.data_avaliacao) return false;
        const hasData = Object.keys(av).some((k) => NUM_KEYS.has(k));
        return hasData;
      });

    return new Response(JSON.stringify({ avaliacoes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('parse-avaliacao-fisica error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Erro inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
