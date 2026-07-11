import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  createDoc, addHeader, addFooter, addWatermark, addCoverPage,
  sectionTitle, autoTable, BRAND, MARGINS, CONTENT_WIDTH,
  checkNewPage, addInfoBlock, PdfConfig,
} from "./pdfBrand";

// Format YYYY-MM-DD as DD/MM/YYYY without timezone shifting
const formatLocalDateBR = (s: string | null | undefined): string => {
  if (!s) return "—";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(s).toLocaleDateString("pt-BR");
};

export interface AvaliacaoExportOptions {
  incluirDobras: boolean;
  incluirCircunferencias: boolean;
  incluirBioimpedancia: boolean;
  incluirComparativo: boolean;
  incluirGraficos: boolean;
  incluirFotos: boolean;
  incluirCapa: boolean;
}

export function generateAvaliacaoPdf(
  avaliacao: any,
  historicoAvaliacoes: any[] | null,
  paciente: { nome_completo: string; data_nascimento?: string; sexo?: string },
  config: PdfConfig,
  options: AvaliacaoExportOptions,
): jsPDF {

  const doc = createDoc();

  if (options.incluirCapa) {
    addCoverPage(doc, "Avaliação Antropométrica", paciente.nome_completo, config, {
      dataEmissao: formatLocalDateBR(avaliacao.data_avaliacao),
    });
  }

  addHeader(doc, "Avaliação Antropométrica", config);
  let y = 28;

  // Section 1 — ID
  const idade = paciente.data_nascimento ? calcAge(paciente.data_nascimento) : null;
  y = addInfoBlock(doc, y, [
    { label: "Nome", value: paciente.nome_completo },
    ...(idade ? [{ label: "Idade", value: `${idade} anos` }] : []),
    ...(paciente.sexo ? [{ label: "Sexo", value: paciente.sexo === "M" ? "Masculino" : "Feminino" }] : []),
    { label: "Data da avaliação", value: formatLocalDateBR(avaliacao.data_avaliacao) },
    { label: "Nutricionista", value: `${config.nome_nutricionista || "Gabriel Sanches"}${config.crn ? ` | CRN ${config.crn}` : ""}` },
  ]);

  // Section 2 — Basic
  y = checkNewPage(doc, y, 40);
  y = sectionTitle(doc, y, "Dados Antropométricos Básicos");

  const leftData: [string, string][] = [
    ["Peso", v(avaliacao.peso, "kg")],
    ["Altura", v(avaliacao.altura, "cm")],
    ["IMC", v(avaliacao.imc, "kg/m²")],
    ["Classificação", avaliacao.classificacao_imc || "—"],
  ];
  const rightData: [string, string][] = [
    ["% Gordura", v(avaliacao.percentual_gordura_dobras || avaliacao.bio_percentual_gordura, "%")],
    ["Massa gorda", v(avaliacao.massa_gorda_kg || avaliacao.bio_massa_gorda, "kg")],
    ["Massa magra", v(avaliacao.massa_magra_kg, "kg")],
    ["RCQ", v(avaliacao.relacao_cintura_quadril, "")],
  ];

  const halfW = CONTENT_WIDTH / 2 - 2;
  y = autoTable(doc, y, [["Medida", "Valor"]], leftData, {
    tableWidth: halfW,
    margin: { left: MARGINS.left },
  });

  const rightY = (doc as any).lastAutoTable.finalY - (leftData.length * 7 + 14);
  (doc as any).autoTable({
    startY: rightY,
    head: [["Indicador", "Valor"]],
    body: rightData,
    tableWidth: halfW,
    margin: { left: MARGINS.left + halfW + 4, right: MARGINS.right },
    headStyles: { fillColor: BRAND.tableHeader, textColor: BRAND.text, fontStyle: "bold", fontSize: 9, cellPadding: 2 },
    bodyStyles: { textColor: BRAND.textBody, fontSize: 9, cellPadding: 2 },
    alternateRowStyles: { fillColor: [250, 251, 255] },
    styles: { lineColor: BRAND.tableLine, lineWidth: 0.2 },
  });
  y = Math.max((doc as any).lastAutoTable.finalY + 6, y);

  // Section 3 — Circumferences
  if (options.incluirCircunferencias) {
    const circFields = [
      ["Cintura", "circ_cintura"], ["Quadril", "circ_quadril"], ["Abdômen", "circ_abdomen"],
      ["Braço D", "circ_braco_dir"], ["Braço E", "circ_braco_esq"], ["Coxa D", "circ_coxa_dir"],
      ["Coxa E", "circ_coxa_esq"], ["Panturrilha", "circ_panturrilha"], ["Pescoço", "circ_pescoco"],
      ["Tórax", "circ_torax"], ["Ombro", "circ_ombro"],
    ];
    const circData = circFields
      .filter(([, key]) => avaliacao[key] != null)
      .map(([label, key]) => [label, `${avaliacao[key]} cm`]);

    if (circData.length > 0) {
      y = checkNewPage(doc, y, 30);
      y = sectionTitle(doc, y, "Circunferências Corporais");
      y = autoTable(doc, y, [["Medida", "Valor (cm)"]], circData);
    }
  }

  // Section 4 — Skinfolds
  if (options.incluirDobras) {
    const foldFields = [
      ["Tríceps", "dobra_triceps"], ["Bíceps", "dobra_biceps"], ["Abdominal", "dobra_abdominal"],
      ["Subescapular", "dobra_subescapular"], ["Axilar média", "dobra_axilar_media"],
      ["Coxa", "dobra_coxa"], ["Suprailíaca", "dobra_suprailiaca"],
      ["Peitoral", "dobra_peitoral"], ["Panturrilha", "dobra_panturrilha"],
    ];
    const foldData = foldFields
      .filter(([, key]) => avaliacao[key] != null)
      .map(([label, key]) => [label, `${avaliacao[key]} mm`]);

    if (foldData.length > 0) {
      y = checkNewPage(doc, y, 30);
      y = sectionTitle(doc, y, "Dobras Cutâneas");
      if (avaliacao.protocolo_dobras) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.textLabel);
        doc.text(`Protocolo: ${avaliacao.protocolo_dobras}`, MARGINS.left, y);
        y += 5;
      }
      y = autoTable(doc, y, [["Dobra", "Valor (mm)"]], foldData);

      if (avaliacao.percentual_gordura_dobras != null) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...BRAND.text);
        doc.text(`% Gordura (dobras): ${avaliacao.percentual_gordura_dobras}%`, MARGINS.left, y);
        y += 8;
      }
    }
  }

  // Section 5 — Bioimpedance
  if (options.incluirBioimpedancia) {
    const bioFields = [
      ["% Gordura", "bio_percentual_gordura", "%"], ["Massa gorda", "bio_massa_gorda", "kg"],
      ["Massa muscular", "bio_massa_muscular", "kg"], ["Água corporal", "bio_agua_corporal", "%"],
      ["Metabolismo basal", "bio_metabolismo_basal", "kcal"], ["Idade metabólica", "bio_idade_metabolica", "anos"],
      ["Gordura visceral", "bio_gordura_visceral", ""], ["Massa óssea", "bio_peso_osseo", "kg"],
    ];
    const bioData = bioFields
      .filter(([, key]) => avaliacao[key] != null)
      .map(([label, key, unit]) => [label, `${avaliacao[key]} ${unit}`]);

    if (bioData.length > 0) {
      y = checkNewPage(doc, y, 30);
      y = sectionTitle(doc, y, "Bioimpedância");
      y = autoTable(doc, y, [["Indicador", "Valor"]], bioData);
    }
  }

  // Section 6 — Historical evolution comparison
  const historyAll = (historicoAvaliacoes || [])
    .filter(a => a && a.data_avaliacao)
    .slice()
    .sort((a, b) => String(a.data_avaliacao).localeCompare(String(b.data_avaliacao)));

  if (options.incluirComparativo && historyAll.length >= 2) {
    y = checkNewPage(doc, y, 30);
    y = sectionTitle(doc, y, "Evolução — Comparativo Histórico");

    const compFields: [string, string, string, boolean][] = [
      ["Peso", "peso", "kg", true],
      ["IMC", "imc", "", true],
      ["% Gordura", "percentual_gordura_dobras", "%", true],
      ["Massa magra", "massa_magra_kg", "kg", false],
      ["Cintura", "circ_cintura", "cm", true],
      ["Quadril", "circ_quadril", "cm", true],
      ["Abdômen", "circ_abdomen", "cm", true],
      ["RCQ", "relacao_cintura_quadril", "", true],
    ];

    // Fallback for % Gordura when only bio value exists
    const getVal = (row: any, key: string) => {
      const v = row?.[key];
      if (v != null && v !== "") return Number(v);
      if (key === "percentual_gordura_dobras" && row?.bio_percentual_gordura != null && row.bio_percentual_gordura !== "") {
        return Number(row.bio_percentual_gordura);
      }
      return null;
    };

    // Filter fields with at least one value across the history
    const rows = compFields.filter(([, key]) => historyAll.some(a => getVal(a, key) != null));

    if (rows.length > 0) {
      // Split dates into blocks so the table always fits the page
      const MAX_PER_BLOCK = 6;
      const blocks: any[][] = [];
      for (let i = 0; i < historyAll.length; i += MAX_PER_BLOCK) {
        blocks.push(historyAll.slice(i, i + MAX_PER_BLOCK));
      }

      blocks.forEach((block, blockIdx) => {
        const isLast = blockIdx === blocks.length - 1;
        const dateHeaders = block.map(a => formatLocalDateBR(a.data_avaliacao));
        const head = ["Medida", ...dateHeaders, ...(isLast ? ["Variação total"] : [])];

        const body = rows.map(([label, key, unit, lowerBetter]) => {
          const cells = block.map(a => {
            const v = getVal(a, key);
            return v != null ? `${v}${unit ? " " + unit : ""}` : "—";
          });
          if (!isLast) return [label, ...cells];

          // Compute total variation using first and last non-null values across full history
          const first = historyAll.map(a => getVal(a, key)).find(v => v != null) ?? null;
          const lastVals = historyAll.map(a => getVal(a, key)).filter(v => v != null);
          const last = lastVals.length ? lastVals[lastVals.length - 1] : null;
          let variation = "—";
          if (first != null && last != null) {
            const diff = Math.round((last - first) * 100) / 100;
            const arrow = diff < 0 ? "↓" : diff > 0 ? "↑" : "=";
            const good = lowerBetter ? diff <= 0 : diff >= 0;
            variation = `${arrow} ${Math.abs(diff)}${unit ? " " + unit : ""} ${good ? "✓" : "✗"}`;
          }
          return [label, ...cells, variation];
        });

        y = checkNewPage(doc, y, 30);
        const fontSize = head.length > 5 ? 8 : 9;
        (doc as any).autoTable({
          startY: y,
          head: [head],
          body,
          margin: { left: MARGINS.left, right: MARGINS.right },
          headStyles: { fillColor: BRAND.tableHeader, textColor: BRAND.text, fontStyle: "bold", fontSize, cellPadding: 2 },
          bodyStyles: { textColor: BRAND.textBody, fontSize, cellPadding: 2 },
          alternateRowStyles: { fillColor: [250, 251, 255] },
          styles: { lineColor: BRAND.tableLine, lineWidth: 0.2, overflow: "linebreak" },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      });
    }
  }


  // Observations
  if (avaliacao.observacoes) {
    y = checkNewPage(doc, y, 15);
    y = sectionTitle(doc, y, "Observações");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.textBody);
    const lines = doc.splitTextToSize(avaliacao.observacoes, CONTENT_WIDTH);
    doc.text(lines, MARGINS.left, y);
    y += lines.length * 4.5 + 6;
  }

  addFooter(doc, config);
  if (config.marca_dagua) addWatermark(doc);
  return doc;
}

function v(val: any, unit: string): string {
  return val != null ? `${val} ${unit}` : "—";
}

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}
