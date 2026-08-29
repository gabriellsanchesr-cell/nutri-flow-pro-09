import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  createDoc, addHeader, addFooter, addWatermark, addCoverPage,
  sectionTitle, autoTable, BRAND, MARGINS, CONTENT_WIDTH,
  checkNewPage, addInfoBlock, PdfConfig,
  statCards, lineChart, legendBlock, signatureBlock, type StatCard,
} from "./pdfBrand";

// Format YYYY-MM-DD as DD/MM/YYYY without timezone shifting
const formatLocalDateBR = (s: string | null | undefined): string => {
  if (!s) return "—";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(s).toLocaleDateString("pt-BR");
};

const shortDate = (s: string | null | undefined): string => {
  const f = formatLocalDateBR(s);
  return f === "—" ? f : f.slice(0, 5);
};

export interface AvaliacaoExportOptions {
  incluirDobras: boolean;
  incluirCircunferencias: boolean;
  incluirBioimpedancia: boolean;
  incluirComparativo: boolean;
  incluirGraficos: boolean;
  incluirFotos: boolean;
  incluirCapa: boolean;
  incluirDiametros?: boolean;
  incluirLegendas?: boolean;
}

// ─── Field dictionaries (single source of truth for labels/units) ───
const BILATERAL: [string, string, string][] = [
  ["Braço relaxado", "circ_braco_esq", "circ_braco_dir"],
  ["Braço contraído", "circ_braco_contraido_esq", "circ_braco_contraido_dir"],
  ["Antebraço", "circ_antebraco_esq", "circ_antebraco_dir"],
  ["Coxa proximal", "circ_coxa_proximal_esq", "circ_coxa_proximal_dir"],
  ["Coxa medial", "circ_coxa_medial_esq", "circ_coxa_medial_dir"],
  ["Coxa distal", "circ_coxa_distal_esq", "circ_coxa_distal_dir"],
  ["Panturrilha", "circ_panturrilha_esq", "circ_panturrilha_dir"],
];

const CIRC_CENTRAIS: [string, string][] = [
  ["Pescoço", "circ_pescoco"],
  ["Ombro", "circ_ombro"],
  ["Tórax", "circ_torax"],
  ["Cintura", "circ_cintura"],
  ["Abdômen", "circ_abdomen"],
  ["Quadril", "circ_quadril"],
  // legacy single-side fields, mantidos para avaliações antigas
  ["Coxa (legado)", "circ_coxa_dir"],
  ["Coxa E (legado)", "circ_coxa_esq"],
  ["Panturrilha (legado)", "circ_panturrilha"],
];

const DOBRAS: [string, string][] = [
  ["Tricipital", "dobra_triceps"],
  ["Bicipital", "dobra_biceps"],
  ["Peitoral", "dobra_peitoral"],
  ["Subescapular", "dobra_subescapular"],
  ["Axilar média", "dobra_axilar_media"],
  ["Torácica", "dobra_toracica"],
  ["Abdominal", "dobra_abdominal"],
  ["Suprailíaca", "dobra_suprailiaca"],
  ["Supraespinhal", "dobra_supraespinhal"],
  ["Coxa", "dobra_coxa"],
  ["Panturrilha", "dobra_panturrilha"],
];

const BIO: [string, string, string][] = [
  ["% Gordura", "bio_percentual_gordura", "%"],
  ["% Ideal de gordura", "bio_percentual_ideal", "%"],
  ["Massa de gordura", "bio_massa_gorda", "kg"],
  ["% Massa muscular", "bio_percentual_massa_muscular", "%"],
  ["Massa muscular", "bio_massa_muscular", "kg"],
  ["Massa livre de gordura", "bio_massa_livre_gordura", "kg"],
  ["Água corporal total", "bio_agua_corporal", "%"],
  ["Peso ósseo", "bio_peso_osseo", "kg"],
  ["Gordura visceral", "bio_gordura_visceral", ""],
  ["Idade metabólica", "bio_idade_metabolica", "anos"],
  ["Metabolismo basal", "bio_metabolismo_basal", "kcal"],
];

const DIAMETROS: [string, string, string][] = [
  ["Punho", "diam_punho", "cm"],
  ["Fêmur", "diam_femur", "cm"],
  ["Biacromial", "diam_biacromial", "cm"],
  ["Bicrista", "diam_bicrista", "cm"],
  ["Altura sentado", "altura_sentado", "cm"],
  ["Altura do joelho", "altura_joelho", "cm"],
  ["Envergadura", "envergadura", "cm"],
];

// Histórico agrupado: [label, key, unit, lowerIsBetter]
type HistField = [string, string, string, boolean];

const HIST_COMPOSICAO: HistField[] = [
  ["Peso", "peso", "kg", true],
  ["IMC", "imc", "", true],
  ["% Gordura", "__pct_gordura", "%", true],
  ["Massa gorda", "__massa_gorda", "kg", true],
  ["Massa magra", "massa_magra_kg", "kg", false],
  ["RCQ", "relacao_cintura_quadril", "", true],
];

const HIST_CIRC: HistField[] = [
  ...CIRC_CENTRAIS.filter(([l]) => !l.includes("legado")).map(([l, k]) => [l, k, "cm", true] as HistField),
  ...BILATERAL.flatMap(([l, e, d]) => ([
    [`${l} E`, e, "cm", false],
    [`${l} D`, d, "cm", false],
  ] as HistField[])),
];

const HIST_DOBRAS: HistField[] = DOBRAS.map(([l, k]) => [l, k, "mm", true] as HistField);
const HIST_BIO: HistField[] = BIO.map(([l, k, u]) => [l, k, u, l.includes("Gordura") || l.includes("gordura") || l.includes("Idade")] as HistField);

// ─── Value helpers ──────────────────────────────────────────────────
const num = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function getVal(row: any, key: string): number | null {
  if (!row) return null;
  if (key === "__pct_gordura") return num(row.percentual_gordura_dobras) ?? num(row.bio_percentual_gordura);
  if (key === "__massa_gorda") return num(row.massa_gorda_kg) ?? num(row.bio_massa_gorda);
  return num(row[key]);
}

const fmt = (v: number | null, unit: string): string =>
  v == null ? "—" : `${Math.round(v * 100) / 100}${unit ? " " + unit : ""}`;

function deltaText(curr: number | null, prev: number | null, unit: string, lowerIsBetter: boolean): { text: string; tone: "good" | "bad" | "neutral" } {
  if (curr == null || prev == null) return { text: "—", tone: "neutral" as const };
  const diff = Math.round((curr - prev) * 100) / 100;
  const pct = prev !== 0 ? Math.round((diff / prev) * 1000) / 10 : null;
  const arrow = diff < 0 ? "-" : diff > 0 ? "+" : "=";
  const tone = diff === 0 ? "neutral" : (lowerIsBetter ? diff < 0 : diff > 0) ? "good" : "bad";
  const pctStr = pct != null && pct !== 0 ? ` (${pct > 0 ? "+" : ""}${pct}%)` : "";
  return { text: `${arrow}${Math.abs(diff)}${unit ? " " + unit : ""}${pctStr}`, tone };
}

function imcClass(imc: number | null): string {
  if (imc == null) return "—";
  if (imc < 18.5) return "Baixo peso";
  if (imc < 25) return "Eutrofia";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade I";
  if (imc < 40) return "Obesidade II";
  return "Obesidade III";
}

function fatClass(pct: number | null, sexo?: string): string {
  if (pct == null) return "—";
  const male = sexo === "M" || sexo === "masculino";
  if (male) {
    if (pct < 6) return "Muito baixo";
    if (pct < 14) return "Excelente";
    if (pct < 18) return "Bom";
    if (pct < 25) return "Acima da média";
    return "Elevado";
  }
  if (pct < 14) return "Muito baixo";
  if (pct < 21) return "Excelente";
  if (pct < 25) return "Bom";
  if (pct < 32) return "Acima da média";
  return "Elevado";
}

function rcqRisk(rcq: number | null, sexo?: string): string {
  if (rcq == null) return "—";
  const male = sexo === "M" || sexo === "masculino";
  if (male) return rcq > 0.90 ? "Risco elevado" : rcq > 0.85 ? "Risco moderado" : "Risco baixo";
  return rcq > 0.85 ? "Risco elevado" : rcq > 0.80 ? "Risco moderado" : "Risco baixo";
}

// ─── Table renderers ────────────────────────────────────────────────
function measureTable(doc: jsPDF, y: number, head: string[], body: (string | number)[][], columnStyles?: any): number {
  return autoTable(doc, y, [head], body, {
    columnStyles,
    styles: { lineColor: BRAND.tableLine, lineWidth: 0.2, overflow: "linebreak" },
  });
}

function twoColumnTable(doc: jsPDF, y: number, rows: [string, string][]): number {
  // splits rows across two side-by-side tables to save vertical space
  const half = Math.ceil(rows.length / 2);
  const left = rows.slice(0, half);
  const right = rows.slice(half);
  const halfW = CONTENT_WIDTH / 2 - 2;

  (doc as any).autoTable({
    startY: y,
    head: [["Medida", "Valor"]],
    body: left,
    tableWidth: halfW,
    margin: { left: MARGINS.left, right: MARGINS.right },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: "bold", fontSize: 8.5, cellPadding: 1.8 },
    bodyStyles: { textColor: BRAND.textBody, fontSize: 8.5, cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [250, 251, 255] },
    styles: { lineColor: BRAND.tableLine, lineWidth: 0.2 },
  });
  const leftEnd = (doc as any).lastAutoTable.finalY;

  let rightEnd = leftEnd;
  if (right.length) {
    (doc as any).autoTable({
      startY: y,
      head: [["Medida", "Valor"]],
      body: right,
      tableWidth: halfW,
      margin: { left: MARGINS.left + halfW + 4, right: MARGINS.right },
      headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: "bold", fontSize: 8.5, cellPadding: 1.8 },
      bodyStyles: { textColor: BRAND.textBody, fontSize: 8.5, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [250, 251, 255] },
      styles: { lineColor: BRAND.tableLine, lineWidth: 0.2 },
    });
    rightEnd = (doc as any).lastAutoTable.finalY;
  }
  return Math.max(leftEnd, rightEnd) + 6;
}

function historyBlock(
  doc: jsPDF,
  y: number,
  title: string,
  fields: HistField[],
  history: any[],
): number {
  const rows = fields.filter(([, key]) => history.some(a => getVal(a, key) != null));
  if (!rows.length) return y;

  y = checkNewPage(doc, y, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.text);
  doc.text(title, MARGINS.left, y);
  y += 5;

  const MAX_PER_BLOCK = 6;
  const blocks: any[][] = [];
  for (let i = 0; i < history.length; i += MAX_PER_BLOCK) blocks.push(history.slice(i, i + MAX_PER_BLOCK));

  blocks.forEach((block, bi) => {
    const isLast = bi === blocks.length - 1;
    const head = [
      "Medida",
      ...block.map(a => formatLocalDateBR(a.data_avaliacao)),
      ...(isLast ? ["Δ anterior", "Δ total"] : []),
    ];

    const body = rows.map(([label, key, unit, lower]) => {
      const cells = block.map(a => fmt(getVal(a, key), unit));
      if (!isLast) return [label, ...cells];
      const seq = history.map(a => getVal(a, key)).filter(v => v != null) as number[];
      const first = seq.length ? seq[0] : null;
      const last = seq.length ? seq[seq.length - 1] : null;
      const prev = seq.length > 1 ? seq[seq.length - 2] : null;
      return [
        label,
        ...cells,
        deltaText(last, prev, unit, lower).text,
        deltaText(last, first, unit, lower).text,
      ];
    });

    y = checkNewPage(doc, y, 30);
    const fontSize = head.length > 6 ? 7.2 : 8.2;
    (doc as any).autoTable({
      startY: y,
      head: [head],
      body,
      margin: { left: MARGINS.left, right: MARGINS.right },
      headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: "bold", fontSize, cellPadding: 1.6, halign: "center" },
      bodyStyles: { textColor: BRAND.textBody, fontSize, cellPadding: 1.6, halign: "center" },
      columnStyles: { 0: { halign: "left", fontStyle: "bold", cellWidth: 32, textColor: BRAND.text } },
      alternateRowStyles: { fillColor: [250, 251, 255] },
      styles: { lineColor: BRAND.tableLine, lineWidth: 0.2, overflow: "linebreak" },
      didParseCell: (data: any) => {
        if (data.section !== "body") return;
        const isDelta = isLast && data.column.index >= head.length - 2;
        if (!isDelta) return;
        const txt = String(data.cell.text?.[0] ?? "");
        const [, , unit, lower] = rows[data.row.index];
        const seq = history.map(a => getVal(a, rows[data.row.index][1])).filter(v => v != null) as number[];
        const last = seq.length ? seq[seq.length - 1] : null;
        const ref = data.column.index === head.length - 2
          ? (seq.length > 1 ? seq[seq.length - 2] : null)
          : (seq.length ? seq[0] : null);
        const tone = deltaText(last, ref, unit, lower).tone;
        if (txt !== "—") {
          data.cell.styles.textColor = tone === "good" ? [22, 163, 74] : tone === "bad" ? [220, 38, 38] : BRAND.textLabel;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  });

  return y + 2;
}

// ─── Main generator ─────────────────────────────────────────────────
export function generateAvaliacaoPdf(
  avaliacao: any,
  historicoAvaliacoes: any[] | null,
  paciente: { nome_completo: string; data_nascimento?: string; sexo?: string },
  config: PdfConfig,
  options: AvaliacaoExportOptions,
): jsPDF {
  const doc = createDoc();
  const TITLE = "Ficha de Avaliação Física";
  const sexo = paciente.sexo;

  if (options.incluirCapa) {
    addCoverPage(doc, TITLE, paciente.nome_completo, config, {
      dataEmissao: formatLocalDateBR(avaliacao.data_avaliacao),
    });
  }

  addHeader(doc, TITLE, config);
  let y = 28;

  const history = (historicoAvaliacoes || [])
    .filter(a => a && a.data_avaliacao)
    .slice()
    .sort((a, b) => String(a.data_avaliacao).localeCompare(String(b.data_avaliacao)));

  // previous assessment relative to the current one
  const currIdx = history.findIndex(a => String(a.data_avaliacao) === String(avaliacao.data_avaliacao));
  const previous = currIdx > 0 ? history[currIdx - 1] : (history.length > 1 ? history[history.length - 2] : null);

  const idade = paciente.data_nascimento ? calcAge(paciente.data_nascimento) : null;

  // 1 — Identification
  y = addInfoBlock(doc, y, [
    { label: "Paciente", value: paciente.nome_completo },
    ...(idade ? [{ label: "Idade", value: `${idade} anos` }] : []),
    ...(sexo ? [{ label: "Sexo", value: sexo === "M" || sexo === "masculino" ? "Masculino" : "Feminino" }] : []),
    { label: "Data da avaliação", value: formatLocalDateBR(avaliacao.data_avaliacao) },
    { label: "Avaliações registradas", value: String(history.length || 1) },
    { label: "Nutricionista", value: `${config.nome_nutricionista || "Gabriel Sanches"}${config.crn ? ` | CRN ${config.crn}` : ""}` },
  ]);

  // 2 — Highlights
  const peso = num(avaliacao.peso);
  const imc = num(avaliacao.imc);
  const pctG = getVal(avaliacao, "__pct_gordura");
  const magra = num(avaliacao.massa_magra_kg);
  const rcq = num(avaliacao.relacao_cintura_quadril);

  const card = (label: string, v: number | null, unit: string, sub: string, key: string, lower: boolean): StatCard => {
    const d = deltaText(v, getVal(previous, key), unit, lower);
    return { label, value: fmt(v, unit), sub, delta: previous ? `vs. ant.: ${d.text}` : undefined, deltaTone: d.tone };
  };

  y = checkNewPage(doc, y, 34);
  y = sectionTitle(doc, y, "Resumo da Avaliação");
  y = statCards(doc, y, [
    card("Peso", peso, "kg", "corporal total", "peso", true),
    card("IMC", imc, "", imcClass(imc), "imc", true),
    card("% Gordura", pctG, "%", fatClass(pctG, sexo), "__pct_gordura", true),
    card("Massa magra", magra, "kg", "massa livre de gordura", "massa_magra_kg", false),
    card("RCQ", rcq, "", rcqRisk(rcq, sexo), "relacao_cintura_quadril", true),
  ], 5);

  // 3 — Basic anthropometry
  y = checkNewPage(doc, y, 40);
  y = sectionTitle(doc, y, "Dados Antropométricos");
  y = twoColumnTable(doc, y, [
    ["Peso", fmt(peso, "kg")],
    ["Altura", fmt(num(avaliacao.altura), "cm")],
    ["IMC", fmt(imc, "kg/m²")],
    ["Classificação IMC", avaliacao.classificacao_imc || imcClass(imc)],
    ["% Gordura", fmt(pctG, "%")],
    ["Classificação % gordura", fatClass(pctG, sexo)],
    ["Massa gorda", fmt(getVal(avaliacao, "__massa_gorda"), "kg")],
    ["Massa magra", fmt(magra, "kg")],
    ["Cintura / Quadril (RCQ)", fmt(rcq, "")],
    ["Risco cardiometabólico", rcqRisk(rcq, sexo)],
  ]);

  // 4 — Circumferences
  if (options.incluirCircunferencias) {
    const centrais = CIRC_CENTRAIS.filter(([, k]) => num(avaliacao[k]) != null);
    const bilat = BILATERAL.filter(([, e, d]) => num(avaliacao[e]) != null || num(avaliacao[d]) != null);

    if (centrais.length || bilat.length) {
      y = checkNewPage(doc, y, 40);
      y = sectionTitle(doc, y, "Circunferências Corporais");

      if (centrais.length) {
        y = twoColumnTable(doc, y, centrais.map(([l, k]) => [l, fmt(num(avaliacao[k]), "cm")] as [string, string]));
      }

      if (bilat.length) {
        y = checkNewPage(doc, y, 30);
        const body = bilat.map(([label, ke, kd]) => {
          const e = num(avaliacao[ke]), d = num(avaliacao[kd]);
          const sim = e != null && d != null ? `${(Math.round((d - e) * 100) / 100) > 0 ? "+" : ""}${Math.round((d - e) * 100) / 100} cm` : "—";
          return [label, fmt(e, "cm"), fmt(d, "cm"), sim];
        });
        y = autoTable(doc, y, [["Segmento", "Esquerdo", "Direito", "Simetria (D-E)"]], body, {
          headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: "bold", fontSize: 8.5, cellPadding: 1.8, halign: "center" },
          bodyStyles: { textColor: BRAND.textBody, fontSize: 8.5, cellPadding: 1.8, halign: "center" },
          columnStyles: { 0: { halign: "left", fontStyle: "bold", textColor: BRAND.text } },
        });
      }
    }
  }

  // 5 — Skinfolds
  if (options.incluirDobras) {
    const dobras = DOBRAS.filter(([, k]) => num(avaliacao[k]) != null);
    if (dobras.length) {
      y = checkNewPage(doc, y, 40);
      y = sectionTitle(doc, y, "Dobras Cutâneas");

      const soma = dobras.reduce((s, [, k]) => s + (num(avaliacao[k]) || 0), 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...BRAND.textLabel);
      doc.text(
        `Protocolo: ${avaliacao.protocolo_dobras || "não informado"}   |   Somatório das dobras: ${Math.round(soma * 10) / 10} mm   |   % Gordura (dobras): ${fmt(num(avaliacao.percentual_gordura_dobras), "%")}`,
        MARGINS.left, y,
      );
      y += 5;
      y = twoColumnTable(doc, y, dobras.map(([l, k]) => [l, fmt(num(avaliacao[k]), "mm")] as [string, string]));
    }
  }

  // 6 — Bioimpedance
  if (options.incluirBioimpedancia) {
    const bio = BIO.filter(([, k]) => num(avaliacao[k]) != null);
    if (bio.length) {
      y = checkNewPage(doc, y, 40);
      y = sectionTitle(doc, y, "Bioimpedância");
      y = twoColumnTable(doc, y, bio.map(([l, k, u]) => [l, fmt(num(avaliacao[k]), u)] as [string, string]));
    }
  }

  // 7 — Bone diameters & complementary heights
  if (options.incluirDiametros !== false) {
    const dia = DIAMETROS.filter(([, k]) => num(avaliacao[k]) != null);
    if (dia.length) {
      y = checkNewPage(doc, y, 35);
      y = sectionTitle(doc, y, "Diâmetros Ósseos e Medidas Complementares");
      y = twoColumnTable(doc, y, dia.map(([l, k, u]) => [l, fmt(num(avaliacao[k]), u)] as [string, string]));
    }
  }

  // 8 — Full history
  if (options.incluirComparativo && history.length >= 2) {
    doc.addPage();
    addHeader(doc, TITLE, config);
    y = 28;
    y = sectionTitle(doc, y, "Histórico Completo de Avaliações");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.textLabel);
    doc.text(
      `${history.length} avaliações — de ${formatLocalDateBR(history[0].data_avaliacao)} a ${formatLocalDateBR(history[history.length - 1].data_avaliacao)}. "Δ anterior" compara as duas últimas medições; "Δ total" compara a primeira com a última.`,
      MARGINS.left, y, { maxWidth: CONTENT_WIDTH },
    );
    y += 9;

    y = historyBlock(doc, y, "Composição corporal", HIST_COMPOSICAO, history);
    if (options.incluirCircunferencias) y = historyBlock(doc, y, "Circunferências (cm)", HIST_CIRC, history);
    if (options.incluirDobras) y = historyBlock(doc, y, "Dobras cutâneas (mm)", HIST_DOBRAS, history);
    if (options.incluirBioimpedancia) y = historyBlock(doc, y, "Bioimpedância", HIST_BIO, history);
  }

  // 9 — Charts
  if (options.incluirGraficos && history.length >= 2) {
    doc.addPage();
    addHeader(doc, TITLE, config);
    y = 28;
    y = sectionTitle(doc, y, "Evolução Gráfica");

    const labels = history.map(a => shortDate(a.data_avaliacao));
    const charts: { title: string; key: string; unit: string }[] = [
      { title: "Peso (kg)", key: "peso", unit: "kg" },
      { title: "% Gordura", key: "__pct_gordura", unit: "%" },
      { title: "Massa magra (kg)", key: "massa_magra_kg", unit: "kg" },
      { title: "Cintura (cm)", key: "circ_cintura", unit: "cm" },
      { title: "IMC", key: "imc", unit: "" },
      { title: "Quadril (cm)", key: "circ_quadril", unit: "cm" },
    ].filter(c => history.some(a => getVal(a, c.key) != null));

    const w = CONTENT_WIDTH / 2 - 3;
    const h = 48;
    charts.forEach((c, i) => {
      const col = i % 2;
      if (col === 0) y = checkNewPage(doc, y, h + 6);
      const x = MARGINS.left + col * (w + 6);
      const endY = lineChart(doc, x, y, w, h, {
        title: c.title,
        labels,
        values: history.map(a => getVal(a, c.key)),
        unit: c.unit,
      });
      if (col === 1 || i === charts.length - 1) y = endY + 6;
    });
  }

  // 10 — Observations
  if (avaliacao.observacoes) {
    y = checkNewPage(doc, y, 25);
    y = sectionTitle(doc, y, "Observações do Nutricionista");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.textBody);
    const lines = doc.splitTextToSize(String(avaliacao.observacoes), CONTENT_WIDTH);
    doc.text(lines, MARGINS.left, y);
    y += lines.length * 4.5 + 6;
  }

  // 11 — Reference legend
  if (options.incluirLegendas !== false) {
    y = checkNewPage(doc, y, 34);
    y = legendBlock(doc, y, "Referências de interpretação", [
      "IMC (kg/m²): <18,5 baixo peso | 18,5–24,9 eutrofia | 25–29,9 sobrepeso | 30–34,9 obesidade I | 35–39,9 obesidade II | >=40 obesidade III",
      "% Gordura homens: <6 muito baixo | 6–13 excelente | 14–17 bom | 18–24 acima da média | >=25 elevado",
      "% Gordura mulheres: <14 muito baixo | 14–20 excelente | 21–24 bom | 25–31 acima da média | >=32 elevado",
      "RCQ: homens risco moderado >0,85 e elevado >0,90 | mulheres risco moderado >0,80 e elevado >0,85",
      "Δ em verde indica evolução favorável ao objetivo; em vermelho, desfavorável.",
    ]);
  }

  // 12 — Signature
  y = checkNewPage(doc, y, 22);
  y = signatureBlock(doc, y + 6, config);

  addFooter(doc, config);
  if (config.marca_dagua) addWatermark(doc);
  return doc;
}

function calcAge(birthDate: string): number {
  const today = new Date();
  const m = String(birthDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const birth = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}
