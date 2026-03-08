import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  createDoc, addHeader, addFooter, addWatermark, addCoverPage,
  sectionTitle, autoTable, BRAND, MARGINS, CONTENT_WIDTH,
  checkNewPage, addInfoBlock, PdfConfig,
} from "./pdfBrand";

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
  avaliacaoAnterior: any | null,
  paciente: { nome_completo: string; data_nascimento?: string; sexo?: string },
  config: PdfConfig,
  options: AvaliacaoExportOptions,
): jsPDF {
  const doc = createDoc();

  if (options.incluirCapa) {
    addCoverPage(doc, "Avaliação Antropométrica", paciente.nome_completo, config, {
      dataEmissao: new Date(avaliacao.data_avaliacao).toLocaleDateString("pt-BR"),
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
    { label: "Data da avaliação", value: new Date(avaliacao.data_avaliacao).toLocaleDateString("pt-BR") },
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

  // Section 6 — Comparison
  if (options.incluirComparativo && avaliacaoAnterior) {
    y = checkNewPage(doc, y, 30);
    y = sectionTitle(doc, y, "Comparativo com Avaliação Anterior");

    const compFields = [
      ["Peso", "peso", "kg", true],
      ["Cintura", "circ_cintura", "cm", true],
      ["Quadril", "circ_quadril", "cm", true],
      ["% Gordura", "percentual_gordura_dobras", "%", true],
      ["Massa magra", "massa_magra_kg", "kg", false],
    ] as [string, string, string, boolean][];

    const dateA = new Date(avaliacaoAnterior.data_avaliacao).toLocaleDateString("pt-BR");
    const dateB = new Date(avaliacao.data_avaliacao).toLocaleDateString("pt-BR");

    const compBody = compFields
      .filter(([, key]) => avaliacao[key] != null || avaliacaoAnterior[key] != null)
      .map(([label, key, unit, lowerBetter]) => {
        const prev = avaliacaoAnterior[key];
        const curr = avaliacao[key];
        const diff = (curr != null && prev != null) ? Math.round((curr - prev) * 100) / 100 : null;
        let variation = "—";
        if (diff != null) {
          const arrow = diff < 0 ? "↓" : diff > 0 ? "↑" : "=";
          const good = lowerBetter ? diff <= 0 : diff >= 0;
          variation = `${arrow} ${Math.abs(diff)} ${unit} ${good ? "✓" : "✗"}`;
        }
        return [label, prev != null ? `${prev} ${unit}` : "—", curr != null ? `${curr} ${unit}` : "—", variation];
      });

    y = autoTable(doc, y, [["Medida", dateA, dateB, "Variação"]], compBody);
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
