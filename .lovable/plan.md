

# Plan: Sistema de Exportação em PDF

## Approach

Given the constraints (no backend PDF libraries like Puppeteer in Edge Functions, and browser-based generation is the pragmatic path for Lovable), I'll use **client-side PDF generation with jsPDF + jsPDF-AutoTable**. This is the most reliable approach for this stack. For charts, I'll capture Recharts as canvas images using html2canvas before embedding.

The system will have:
1. A shared PDF utility module with brand styling helpers
2. An Edge Function approach is not viable for complex HTML-to-PDF — instead, client-side jsPDF with professional layout
3. A `documentos_gerados` table to track generated PDFs (metadata only, PDFs downloaded directly)
4. Export modals with toggle options for each document type
5. A storage bucket `documentos-pdf` for optional server-side storage

## Database Migration

**New table: `documentos_gerados`**
- `id` uuid PK
- `paciente_id` uuid
- `user_id` uuid  
- `tipo` text (plano_alimentar, avaliacao, relatorio_mensal, receita)
- `nome` text
- `created_at` timestamptz default now()
- `arquivo_path` text nullable (storage path if saved)
- `expires_at` timestamptz (90 days from creation)
- RLS: nutri CRUD own, paciente can view own

**New table: `configuracoes_pdf`**
- `id` uuid PK
- `user_id` uuid UNIQUE
- `crn` text
- `telefone` text
- `site` text default 'gabrielnutri.com.br'
- `logo_url` text nullable
- `cor_primaria` text default '#2B3990'
- `incluir_capa` boolean default true
- `marca_dagua` boolean default false
- `created_at` / `updated_at`
- RLS: user CRUD own

**Storage bucket: `documentos-pdf`** (public: false)

## New Dependencies

- `jspdf` + `jspdf-autotable` for PDF generation

## Files to Create

### 1. `src/lib/pdf/pdfBrand.ts` (~200 lines)
Shared brand utilities:
- `addHeader(doc, title, config)` — logo, title, blue separator line
- `addFooter(doc, pageNum, totalPages, config)` — contact, CRN, page numbers
- `brandColors`, `fonts`, `margins` constants
- `addSectionTitle(doc, y, text)`, `addTable(doc, y, headers, rows)` helpers

### 2. `src/lib/pdf/planoAlimentarPdf.ts` (~250 lines)
Generates meal plan PDF:
- Cover page (optional), identification, daily macro summary bar
- Meal blocks with food tables (conditional macro columns)
- Substitutions and observations per meal
- General observations section

### 3. `src/lib/pdf/avaliacaoPdf.ts` (~250 lines)
Generates anthropometric assessment PDF:
- ID section, basic measurements + body composition side by side
- Circumferences table (conditional)
- Skinfolds with protocol reference (conditional)
- Bioimpedance (conditional)
- Comparison table with colored deltas (conditional)

### 4. `src/lib/pdf/relatorioMensalPdf.ts` (~200 lines)
Generates monthly evolution report:
- Cover, executive summary cards
- Weekly evolution table
- Check-in details (conditional)
- Consultations list, active plan summary
- Achievements text field

### 5. `src/lib/pdf/planoSimplificadoPdf.ts` (~150 lines)
Patient-friendly version:
- Larger fonts, no macro columns
- Meal + household measures only
- Substitutions highlighted
- Tips section

### 6. `src/components/pdf/ExportPdfModal.tsx` (~300 lines)
Reusable modal component with:
- `type` prop determining which toggles to show
- Toggle options per document type as specified
- "Gerar PDF" button with loading state
- Calls appropriate PDF generator function
- Option to save to `documentos_gerados`

### 7. `src/components/pdf/ConfiguracoesPdfSection.tsx` (~150 lines)
Settings panel for PDF brand config (CRN, phone, site, logo upload, toggles)

## Files to Modify

### `src/components/paciente/PlanoAlimentarSection.tsx`
- Add "Exportar PDF" button to plan list items
- Import and open ExportPdfModal with type="plano_alimentar"

### `src/components/paciente/PlanoAlimentarEditor.tsx`
- Add "Exportar PDF" button in header bar

### `src/components/paciente/AvaliacoesFisicasSection.tsx`
- Add "Exportar PDF" button in assessment form view

### `src/components/paciente/AcompanhamentoSection.tsx`
- Add "Gerar Relatório Mensal" button

### `src/pages/PortalPaciente.tsx`
- Add "Baixar meu plano" button in the plan view tab

### `src/pages/PacienteDetalhe.tsx`
- Add "Documentos" section option in sidebar (or within prontuario)

## Implementation Order

1. Database migration (tables + storage bucket)
2. Install jspdf + jspdf-autotable
3. `pdfBrand.ts` — shared brand utilities
4. `planoAlimentarPdf.ts` — meal plan generator
5. `avaliacaoPdf.ts` — assessment generator
6. `relatorioMensalPdf.ts` — monthly report generator
7. `planoSimplificadoPdf.ts` — simplified patient version
8. `ExportPdfModal.tsx` — reusable modal with toggles
9. Wire export buttons into existing sections
10. `ConfiguracoesPdfSection.tsx` — PDF settings (can be deferred)

## Key Technical Decisions

- **Client-side generation**: jsPDF is proven and avoids edge function complexity. Quality is good for table-heavy documents.
- **Charts as images**: For the monthly report charts, render a hidden Recharts component, use `html2canvas` to capture, then embed as image in PDF.
- **Logo**: Will use `/logo.png` from public folder as default. Configurable via settings.
- **No server storage by default**: PDFs are generated and downloaded directly. Optional "save" stores in bucket.

