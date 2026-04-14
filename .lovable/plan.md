

# Plan: Upgrade TACO Database & Auto-Sync Substitutions

## Overview
The current food database has only 75 items. The uploaded SQL file contains 130 well-organized items with complete nutritional data. We'll also add a search keyword system and auto-populate the substitution library so each food group already has common swaps ready.

## Changes

### 1. Populate TACO database with uploaded data
- Run the uploaded `taco_data.sql` via migration to upsert 130 foods (uses `ON CONFLICT DO NOTHING`)
- This expands the database from 75 to ~130 items covering all food groups

### 2. Add search keywords column to `alimentos_taco`
- Add `palavras_chave text[]` column to enable synonym-based search (e.g. searching "batata" also finds "batata-doce", "batata inglesa")
- Populate keywords for common foods (abbreviations, alternate names)

### 3. Improve food search in `PlanoAlimentarEditor.tsx`
- Search by `nome` OR `palavras_chave` using `or` filter
- Show food group badge in search results for easier identification
- Show fiber info in search results alongside macros

### 4. Auto-populate substitution library
- Create a migration that inserts ~50+ common substitutions organized by food group (cereais, frutas, carnes, leites, etc.)
- Each substitution maps an original food to its substitute with optional notes
- These are seeded per-user on first access or via a "popular substituicoes" button

### 5. Auto-fill substitution suggestions in meal plan editor
- When adding a food to a meal, auto-query the `substituicoes` table for foods in the same group
- Auto-populate the "Substituicoes Sugeridas" textarea with matching substitutions from the library
- Add a button "Sugerir Substituicoes" next to the textarea that fetches from the library

## Files to modify
1. **Migration SQL** — insert TACO data + add `palavras_chave` column + seed default substitutions
2. `src/components/paciente/PlanoAlimentarEditor.tsx` — improved search + auto-fill substitutions
3. `src/pages/Biblioteca.tsx` — add "Popular com padrões" button to seed default substitutions

## Technical details
- The TACO SQL uses `ON CONFLICT DO NOTHING` so existing data is preserved
- Default substitutions will be inserted with the current user's `user_id` so RLS works correctly
- The substitution auto-fill queries `substituicoes` by matching the food's `grupo` field from `alimentos_taco`

