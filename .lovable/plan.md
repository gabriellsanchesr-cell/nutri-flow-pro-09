

# Plan: Módulo de Relatórios e Indicadores

No new database tables are needed. All data exists across `pacientes`, `consultas`, `acompanhamentos`, `avaliacoes_fisicas`, `checklist_respostas`, `conteudo_visualizacoes`, and `diario_registros`.

## Implementation

### 1. New Page: `src/pages/Relatorios.tsx`
Single large component with 5 tabs (Tabs from shadcn), using Recharts for all charts. All data fetched client-side from existing tables.

**Tab 1 — Visao Geral**: Period filter (select). 8 KPI cards (total active patients, new patients, inactive, retention rate, check-in rate, consultations count, avg follow-up time, pending returns). 4 charts: portfolio growth (LineChart), consultations/month (BarChart), R.E.A.L. phase distribution (PieChart), placeholder for financial.

**Tab 2 — Pacientes**: Distribution charts (by objective, phase, sex, age range, follow-up time). Filterable/sortable table of all patients. Highlight lists (top evolution, top adherence, longest without contact).

**Tab 3 — Evolução Clínica**: Avg weight variation, avg abdominal circumference variation, goal achievement rate. Charts: weight variation histogram, monthly avg evolution, weekly adherence. Individual evolution table from `avaliacoes_fisicas`.

**Tab 4 — Engajamento**: Check-in rates, portal usage stats, R.E.A.L. content engagement, food diary usage. Charts: weekly check-in rate, weekly adherence avg, portal access. Engagement ranking and low-engagement alerts.

**Tab 5 — Exportações**: List of available report types. Each opens a modal with period selection and format toggles. PDF generation using existing `pdfBrand.ts` helpers (cover page, headers, footers). Excel export via CSV download (no extra library needed — we'll use simple CSV generation).

### 2. Routing & Navigation
- Add route `/relatorios` inside the admin layout in `App.tsx`
- Add "Relatórios" item to `AppSidebar.tsx` with `BarChart3` icon from lucide
- Visible for admin and equipe with permission

### 3. PDF Export
- New file `src/lib/pdf/relatorioConsultorioPdf.ts` using existing `pdfBrand.ts` utilities
- Generates A4 portrait PDF with cover page, KPI section, and summary tables

### 4. Key Technical Decisions
- All computation done client-side (queries to Supabase, then JS aggregation)
- Period filter shared across all tabs via state
- Recharts for all visualizations (already installed)
- CSV export for "Excel" format (universally compatible, no extra deps)
- No new database migrations required

