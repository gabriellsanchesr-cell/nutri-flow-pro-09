

# Plan: Painel 1 (Cálculo Energético) + Painel 2 (Avaliação Antropométrica) — Redesign Completo

## Overview

Rewrite both `CalculoEnergetico.tsx` and `AvaliacoesFisicasSection.tsx` from scratch with the professional two-column layout specified. Both panels follow the same pattern: left column (60%) with input blocks, right column (40%) with real-time analytics. Database needs a new table for saving energy calculations.

## Database Migration

New table `calculos_energeticos` to persist calculation history:
- `id`, `paciente_id`, `user_id`, `created_at`
- `peso`, `altura`, `idade`, `sexo`, `massa_magra`
- `formula` (harris_benedict, harris_revisada, mifflin, fao_oms, cunningham, owen, tinsley)
- `fator_atividade`, `fator_injuria`
- `adicional_met`, `adicional_gestante`, `trimestre_gestante`
- `objetivo` (deficit/manutencao/superavit), `percentual_ajuste`
- `tmb`, `get`, `meta_calorica`
- `proteina_g`, `proteina_pct`, `carboidrato_g`, `carboidrato_pct`, `gordura_g`, `gordura_pct`
- `distribuicao_refeicoes` (jsonb)
- RLS: nutri can CRUD own records

Also add columns to `avaliacoes_fisicas` for the expanded fields:
- `circ_pescoco`, `circ_ombro`, `circ_abdomen`, `circ_antebraco`, `circ_braco_contraido`, `circ_coxa_proximal`, `circ_coxa_medial`, `circ_coxa_distal`
- `dobra_axilar_media`, `dobra_toracica`, `dobra_panturrilha`, `dobra_supraespinhal`
- `diam_punho`, `diam_femur`, `diam_biacromial`, `diam_bicrista`
- `bio_percentual_ideal`, `bio_percentual_massa_muscular`, `bio_peso_osseo`, `bio_massa_livre_gordura`, `bio_gordura_visceral`
- `altura_sentado`, `altura_joelho`, `envergadura`

## Painel 1 — CalculoEnergetico.tsx (complete rewrite)

**Structure**: Two-column layout with 4 numbered input blocks on left, 3 result sections on right.

**Left Column (60%)**:
- **Block 1 - Dados Antropométricos**: peso, altura, MLG, idade (auto-calc from DOB), sexo. "Importar de antropometria" button fetches latest `avaliacoes_fisicas`.
- **Block 2 - Fórmulas Padronizadas**: Formula dropdown (7 formulas including Cunningham/Owen/Tinsley/FAO), activity factor dropdown (5 levels with descriptions), injury factor dropdown (7 options). All formulas implemented with correct equations. "Ver referências" modal.
- **Block 3 - Ajustes Refinados**: MET additional kcal, gestante toggle with trimester selector (OMS additions: +85/+285/+475), deficit/surplus slider (-30% to +30%) with kcal display.
- **Block 4 - Distribuição de Macronutrientes**: Protein in g/kg or % toggle, carb in % or g, fat auto-calculated. 100% validation with red alert. Colored bars.

**Right Column (40%)** — sticky, real-time:
- **Section 1 - Resultados Principais**: TMB, GET, Meta Calórica, formula used, activity factor — in a clean table with result rows.
- **Section 2 - Macros Table + Donut Chart**: Grams, %, kcal per macro. Recharts PieChart donut beside table.
- **Section 3 - Distribuição por Refeições**: Optional toggle, 6 meals with editable % that sum to 100%, showing kcal per meal.

**Actions**: "Salvar cálculo" (persists to DB), "Aplicar ao plano ativo", "Exportar PDF", "Ver histórico" modal.

**Header**: Title + patient name/age subtitle + "Importar dados antropométricos" + "Ver histórico" + "Salvar" buttons.

## Painel 2 — AvaliacoesFisicasSection.tsx (major rewrite)

**List view**: Keep existing but improve styling to match brand.

**Form view**: Replace tabs with two-column layout:

**Left Column (60%)** — Accordion sections:
- **Section 1 - Dados Básicos** (open by default): peso, altura, altura sentado, altura joelho, envergadura
- **Section 2 - Dobras Cutâneas**: Formula selector (Pollock 3/7, Petroski, Guedes, Durnin, Faulkner). 10 fold fields in 2-col grid. Highlight which folds are used by selected formula.
- **Section 3 - Circunferências**: 13 fields in 2-col grid. Toggle for bilateral.
- **Section 4 - Diâmetro Ósseo**: 4 fields
- **Section 5 - Bioimpedância**: 11 fields (expanded from current 6)
- **Section 6 - Evolução Fotográfica**: Upload with angle tags, comparison with previous

**Right Column (40%)** — Sticky results panel:
- **Section 1 - Pesos e Medidas**: IMC, classification (color-coded), ideal weight range, RCQ, metabolic risk, CMB, waist/height ratio
- **Section 2 - Dobras e Diâmetro**: % fat, ideal %, classification, fat mass, bone mass, muscle mass, residual mass, MLG, sum of folds, body density, reference
- **Section 3 - Bioimpedância**: All bio results
- **Section 4 - Comparativo**: Auto-comparison table with previous assessment, colored delta badges

**Modals**: Evolution charts modal (existing, enhanced with period filters and multi-metric), Previous assessments list modal.

**Additional formulas**: Add Petroski, Guedes, Faulkner protocols. Add CMB calculation (circ_braco - π × dobra_triceps). Add ideal weight range from IMC. Add metabolic risk classification from RCQ.

## Visual Identity

Apply consistently across both panels:
- Primary `#2B3990`, highlight `#5B6EC7`, background `#F4F5FA`
- Cards white with 14px radius, shadow `0 2px 12px rgba(0,0,0,0.06)`
- Input height 44px, radius 8px, bg `#F4F5FA`
- Right column: white bg, subtle left border `#E2E5F0`
- Result rows: 12px padding, bottom border `#F0F2F8`, hover blue tint
- Action buttons: bg `#3D4F6E` text white radius 8px
- Save button: bg `#2B3990` text white full-width radius 10px height 52px
- Classifications: green `#22C55E`, yellow `#F59E0B`, red `#EF4444`

## Files to Create/Modify

1. **Migration SQL** — new `calculos_energeticos` table + expanded `avaliacoes_fisicas` columns
2. **`src/components/paciente/CalculoEnergetico.tsx`** — complete rewrite (~600-800 lines)
3. **`src/components/paciente/AvaliacoesFisicasSection.tsx`** — complete rewrite (~900-1100 lines)
4. **`src/integrations/supabase/types.ts`** — auto-updated after migration

## Implementation Order

1. Database migration (both tables in one migration)
2. CalculoEnergetico.tsx rewrite
3. AvaliacoesFisicasSection.tsx rewrite

No changes needed to routing or sidebar — both components are already wired in `PacienteDetalhe.tsx`.

