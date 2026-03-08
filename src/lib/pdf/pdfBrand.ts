import jsPDF from "jspdf";
import "jspdf-autotable";

export interface PdfConfig {
  crn?: string;
  telefone?: string;
  site?: string;
  cor_primaria?: string;
  incluir_capa?: boolean;
  marca_dagua?: boolean;
  nome_nutricionista?: string;
}

export const BRAND = {
  primary: [43, 57, 144] as [number, number, number],     // #2B3990
  accent: [91, 110, 199] as [number, number, number],     // #5B6EC7
  text: [26, 31, 60] as [number, number, number],         // #1A1F3C
  textBody: [44, 44, 44] as [number, number, number],     // #2C2C2C
  textLabel: [107, 112, 128] as [number, number, number], // #6B7080
  tableLine: [226, 229, 240] as [number, number, number], // #E2E5F0
  tableHeader: [244, 245, 250] as [number, number, number], // #F4F5FA
  white: [255, 255, 255] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
};

export const MARGINS = { top: 20, bottom: 25, left: 20, right: 20 };
export const PAGE_WIDTH = 210;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

export function createDoc(): jsPDF {
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
}

export function addHeader(doc: jsPDF, title: string, _config?: PdfConfig) {
  const pageW = doc.internal.pageSize.getWidth();
  // Logo text (left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.primary);
  doc.text("Gabriel Sanches", MARGINS.left, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.textLabel);
  doc.text("Nutrição Individualizada", MARGINS.left, 16);

  // Title (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  doc.text(title, pageW - MARGINS.right, 12, { align: "right" });

  // Separator line
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.5);
  doc.line(MARGINS.left, 19, pageW - MARGINS.right, 19);
}

export function addFooter(doc: jsPDF, config?: PdfConfig) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    const y = pageH - 12;

    // Separator
    doc.setDrawColor(...BRAND.tableLine);
    doc.setLineWidth(0.3);
    doc.line(MARGINS.left, y - 3, pageW - MARGINS.right, y - 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.textLabel);

    const site = config?.site || "gabrielnutri.com.br";
    const crn = config?.crn ? ` | CRN ${config.crn}` : "";
    doc.text(`Gabriel Sanches — Nutrição Individualizada | ${site}${crn}`, MARGINS.left, y);
    doc.text(`Página ${i} de ${totalPages}`, pageW - MARGINS.right, y, { align: "right" });
  }
}

export function addWatermark(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(200, 200, 200);
    doc.text("CONFIDENCIAL", pageW / 2, pageH / 2, {
      align: "center",
      angle: 45,
    });
  }
}

export function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.primary);
  doc.text(text, MARGINS.left, y);
  return y + 8;
}

export function subTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.text);
  doc.text(text, MARGINS.left, y);
  return y + 6;
}

export function bodyText(doc: jsPDF, y: number, text: string, maxWidth?: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.textBody);
  const lines = doc.splitTextToSize(text, maxWidth || CONTENT_WIDTH);
  doc.text(lines, MARGINS.left, y);
  return y + lines.length * 4.5;
}

export function labelText(doc: jsPDF, y: number, label: string, value: string, x?: number): number {
  const startX = x || MARGINS.left;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.textLabel);
  doc.text(label, startX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.textBody);
  doc.text(value, startX + doc.getTextWidth(label) + 2, y);
  return y + 5;
}

export function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - MARGINS.bottom) {
    doc.addPage();
    addHeader(doc, "");
    return MARGINS.top + 10;
  }
  return y;
}

export function addCoverPage(
  doc: jsPDF,
  title: string,
  pacienteNome: string,
  config?: PdfConfig,
  extra?: { periodo?: string; dataEmissao?: string }
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  // Blue accent line at top
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageW, 4, "F");

  // Logo area
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND.primary);
  doc.text("Gabriel Sanches", cx, 60, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.textLabel);
  doc.text("Nutrição Individualizada", cx, 70, { align: "center" });

  // Separator
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.8);
  doc.line(cx - 30, 80, cx + 30, 80);

  // Document title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.text);
  doc.text(title, cx, 100, { align: "center" });

  // Patient name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.textBody);
  doc.text(pacienteNome, cx, 115, { align: "center" });

  let infoY = 135;
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.textLabel);

  if (extra?.periodo) {
    doc.text(extra.periodo, cx, infoY, { align: "center" });
    infoY += 8;
  }

  const dataEmissao = extra?.dataEmissao || new Date().toLocaleDateString("pt-BR");
  doc.text(`Data de emissão: ${dataEmissao}`, cx, infoY, { align: "center" });
  infoY += 8;

  const nutri = config?.nome_nutricionista || "Gabriel Sanches";
  const crn = config?.crn ? ` | CRN ${config.crn}` : "";
  doc.text(`${nutri}${crn}`, cx, infoY, { align: "center" });

  // Bottom line
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, pageH - 4, pageW, 4, "F");

  doc.addPage();
}

export function addInfoBlock(doc: jsPDF, y: number, fields: { label: string; value: string }[]): number {
  const blockY = y;
  doc.setFillColor(...BRAND.tableHeader);
  doc.roundedRect(MARGINS.left, blockY - 4, CONTENT_WIDTH, fields.length * 6 + 6, 2, 2, "F");

  let currentY = blockY + 2;
  for (const field of fields) {
    currentY = labelText(doc, currentY, `${field.label}: `, field.value, MARGINS.left + 4);
  }
  return currentY + 4;
}

export function autoTable(
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: (string | number)[][],
  options?: any
): number {
  (doc as any).autoTable({
    startY,
    head,
    body,
    margin: { left: MARGINS.left, right: MARGINS.right },
    headStyles: {
      fillColor: BRAND.tableHeader,
      textColor: BRAND.text,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: BRAND.textBody,
      fontSize: 9,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: [250, 251, 255] },
    styles: { lineColor: BRAND.tableLine, lineWidth: 0.2 },
    ...options,
  });
  return (doc as any).lastAutoTable.finalY + 6;
}

export async function loadPdfConfig(userId: string): Promise<PdfConfig> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("configuracoes_clinica")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return {
      crn: (data as any).crn || undefined,
      telefone: (data as any).telefone || undefined,
      site: (data as any).site || "gabrielnutri.com.br",
      cor_primaria: (data as any).cor_primaria || "#2B3990",
      incluir_capa: (data as any).incluir_capa ?? true,
      marca_dagua: (data as any).marca_dagua ?? false,
    };
  }

  // Try from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("crn, nome_completo")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    crn: profile?.crn || undefined,
    nome_nutricionista: profile?.nome_completo || "Gabriel Sanches",
    site: "gabrielnutri.com.br",
    incluir_capa: true,
    marca_dagua: false,
  };
}
