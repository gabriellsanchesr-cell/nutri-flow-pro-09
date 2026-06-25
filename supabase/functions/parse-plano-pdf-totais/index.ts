// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileBase64, mimeType } = await req.json();
    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'fileBase64 obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataUrl = `data:${mimeType || 'application/pdf'};base64,${fileBase64}`;

    const systemPrompt = `Você lê PDFs de planos alimentares e extrai APENAS os totais nutricionais do dia (1 dia inteiro do plano).

Retorne SOMENTE JSON válido neste formato exato:
{
  "kcal": number | null,
  "proteina_g": number | null,
  "carboidrato_g": number | null,
  "gordura_g": number | null,
  "fibra_g": number | null,
  "refeicoes_estimadas": number | null,
  "observacoes": string | null
}

REGRAS:
- Procure por linhas/tabelas com totais diários (ex: "Total do dia", "Totais", "Resumo nutricional", "VET", "Valor Energético Total").
- Se houver várias opções (A/B/C) por refeição, considere apenas a OPÇÃO A para calcular o total — se o documento já trouxer um total único, use-o.
- NÃO invente valores. Se algum campo não existir no PDF, retorne null naquele campo.
- Unidades: kcal em kcal, macros em gramas. Converta vírgula para ponto.
- "refeicoes_estimadas" = quantas refeições (café, lanche, almoço, etc) o plano tem.
- "observacoes": curta nota (até 200 chars) explicando de onde extraiu (ex: "Totais retirados da seção 'Resumo Nutricional' na última página"). Use null se nada notável.`;

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
          { role: 'user', content: [
            { type: 'text', text: 'Extraia os totais nutricionais diários deste plano alimentar.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ] },
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
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), {
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
    } catch {
      parsed = {};
    }

    const num = (v: any) => {
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const totals = {
      kcal: num(parsed.kcal),
      proteina_g: num(parsed.proteina_g),
      carboidrato_g: num(parsed.carboidrato_g),
      gordura_g: num(parsed.gordura_g),
      fibra_g: num(parsed.fibra_g),
      refeicoes_estimadas: num(parsed.refeicoes_estimadas),
      observacoes: typeof parsed.observacoes === 'string' ? parsed.observacoes.slice(0, 240) : null,
    };

    return new Response(JSON.stringify(totals), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('parse-plano-pdf-totais error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Erro inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
