import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, Sparkles, ArrowLeft, Save, FileText } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pacienteId: string;
  /** Called after a successful batch save to let the parent refresh its list. */
  onImported: () => void;
}

type Avaliacao = Record<string, any>;

// Grupos de campos exibidos na tela de revisão (mesma ordem da seção)
const GROUPS: { label: string; fields: { key: string; label: string; unit?: string }[] }[] = [
  {
    label: "Básico",
    fields: [
      { key: "peso", label: "Peso", unit: "kg" },
      { key: "altura", label: "Altura", unit: "cm" },
      { key: "imc", label: "IMC" },
      { key: "relacao_cintura_quadril", label: "RCQ" },
      { key: "percentual_gordura_dobras", label: "% Gordura (dobras)", unit: "%" },
      { key: "massa_gorda_kg", label: "Massa gorda", unit: "kg" },
      { key: "massa_magra_kg", label: "Massa magra", unit: "kg" },
    ],
  },
  {
    label: "Dobras (mm)",
    fields: [
      { key: "dobra_triceps", label: "Tricipital" },
      { key: "dobra_biceps", label: "Bicipital" },
      { key: "dobra_abdominal", label: "Abdominal" },
      { key: "dobra_subescapular", label: "Subescapular" },
      { key: "dobra_axilar_media", label: "Axilar média" },
      { key: "dobra_coxa", label: "Coxa" },
      { key: "dobra_toracica", label: "Torácica" },
      { key: "dobra_suprailiaca", label: "Suprailíaca" },
      { key: "dobra_panturrilha", label: "Panturrilha" },
      { key: "dobra_supraespinhal", label: "Supraespinhal" },
      { key: "dobra_peitoral", label: "Peitoral" },
    ],
  },
  {
    label: "Circunferências (cm)",
    fields: [
      { key: "circ_pescoco", label: "Pescoço" },
      { key: "circ_torax", label: "Tórax" },
      { key: "circ_ombro", label: "Ombro" },
      { key: "circ_cintura", label: "Cintura" },
      { key: "circ_quadril", label: "Quadril" },
      { key: "circ_abdomen", label: "Abdômen" },
      { key: "circ_braco_dir", label: "Braço relax. D" },
      { key: "circ_braco_esq", label: "Braço relax. E" },
      { key: "circ_braco_contraido", label: "Braço contraído" },
      { key: "circ_antebraco", label: "Antebraço" },
      { key: "circ_coxa_proximal", label: "Coxa proximal" },
      { key: "circ_coxa_medial", label: "Coxa medial" },
      { key: "circ_coxa_distal", label: "Coxa distal" },
      { key: "circ_coxa_dir", label: "Coxa D" },
      { key: "circ_coxa_esq", label: "Coxa E" },
      { key: "circ_panturrilha", label: "Panturrilha" },
    ],
  },
  {
    label: "Bioimpedância",
    fields: [
      { key: "bio_percentual_gordura", label: "% Gordura", unit: "%" },
      { key: "bio_massa_gorda", label: "Massa gorda", unit: "kg" },
      { key: "bio_massa_muscular", label: "Massa muscular", unit: "kg" },
      { key: "bio_percentual_massa_muscular", label: "% Massa musc.", unit: "%" },
      { key: "bio_agua_corporal", label: "Água corporal", unit: "kg" },
      { key: "bio_peso_osseo", label: "Massa óssea", unit: "kg" },
      { key: "bio_massa_livre_gordura", label: "Massa livre gord.", unit: "kg" },
      { key: "bio_gordura_visceral", label: "Gord. visceral" },
      { key: "bio_idade_metabolica", label: "Idade metab.", unit: "anos" },
      { key: "bio_metabolismo_basal", label: "TMB", unit: "kcal" },
    ],
  },
];

export function ImportarAvaliacaoModal({ open, onOpenChange, pacienteId, onImported }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const reset = () => {
    setStep("upload");
    setFile(null);
    setAvaliacoes([]);
    setSelected({});
    setLoading(false);
    setSaving(false);
  };

  const handleClose = (o: boolean) => {
    if (loading || saving) return;
    if (!o) reset();
    onOpenChange(o);
  };

  // ─── PASSO 1: Upload + IA ──────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) {
      toast({ title: "Selecione um arquivo", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 15 MB", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const r = reader.result as string;
          resolve(r.split(",")[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("parse-avaliacao-fisica", {
        body: { fileBase64: base64, mimeType: file.type || "application/octet-stream" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const list = (data?.avaliacoes || []) as Avaliacao[];
      if (list.length === 0) {
        toast({ title: "Nenhuma avaliação detectada", description: "Tente outro arquivo ou cadastre manualmente.", variant: "destructive" });
        return;
      }

      // ordena por data crescente
      list.sort((a, b) => String(a.data_avaliacao).localeCompare(String(b.data_avaliacao)));
      setAvaliacoes(list);
      const sel: Record<number, boolean> = {};
      list.forEach((_, i) => (sel[i] = true));
      setSelected(sel);
      setStep("review");
      toast({ title: `${list.length} avaliação(ões) detectadas`, description: "Revise os dados antes de salvar." });
    } catch (e: any) {
      toast({ title: "Erro ao processar", description: e?.message || "Tente novamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── PASSO 2: Edição inline ────────────────────────────────────────
  const updateCell = (idx: number, key: string, raw: string) => {
    setAvaliacoes((prev) => {
      const next = [...prev];
      const av = { ...next[idx] };
      if (raw === "") {
        delete av[key];
      } else if (key === "data_avaliacao") {
        av[key] = raw;
      } else {
        const n = parseFloat(raw.replace(",", "."));
        if (!isNaN(n)) av[key] = n;
      }
      next[idx] = av;
      return next;
    });
  };

  const toggleColumn = (idx: number) => setSelected((s) => ({ ...s, [idx]: !s[idx] }));

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  // ─── SALVAR EM LOTE ────────────────────────────────────────────────
  const saveAll = async () => {
    if (!user || selectedCount === 0) return;
    setSaving(true);
    try {
      // 1) Upload do PDF original (se houver)
      let pdf_origem_url: string | null = null;
      let pdf_origem_nome: string | null = null;
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `avaliacoes-importadas/${pacienteId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("documentos-pdf")
          .upload(path, file, { contentType: file.type || "application/pdf", upsert: false });
        if (upErr) {
          console.warn("Falha ao anexar PDF:", upErr.message);
        } else {
          pdf_origem_url = path;
          pdf_origem_nome = file.name;
        }
      }

      // 2) Inserir avaliações selecionadas
      const rows = avaliacoes
        .map((av, idx) => ({ av, idx }))
        .filter(({ idx }) => selected[idx])
        .map(({ av }) => {
          const row: Record<string, any> = {
            ...av,
            paciente_id: pacienteId,
            user_id: user.id,
            origem: "importado_ia",
          };
          if (pdf_origem_url) {
            row.pdf_origem_url = pdf_origem_url;
            row.pdf_origem_nome = pdf_origem_nome;
          }
          // remove campos que não existem na tabela
          delete row.id;
          delete row.created_at;
          delete row.updated_at;
          return row;
        });

      const { error } = await supabase.from("avaliacoes_fisicas").insert(rows as any);
      if (error) throw error;

      toast({
        title: `${rows.length} avaliação(ões) importadas!`,
        description: pdf_origem_url ? "PDF original anexado." : undefined,
      });
      onImported();
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === "review" ? "max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === "upload" ? "Importar histórico de avaliações" : "Revisar avaliações detectadas"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Envie o PDF/imagem de relatórios de evolução (WebDiet, Dietbox, InBody, Tanita, planilhas). A IA detecta TODAS as datas e medidas presentes."
              : `${selectedCount} de ${avaliacoes.length} avaliações selecionadas. Edite qualquer célula antes de salvar.`}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Arquivo (PDF ou imagem)</Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
              {file && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <Button onClick={handleAnalyze} disabled={loading || !file} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lendo documento com IA…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Analisar documento</>
              )}
            </Button>
          </div>
        )}

        {step === "review" && (
          <>
            <div className="flex-1 overflow-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold border-b border-border w-48">Medida</th>
                    {avaliacoes.map((av, idx) => (
                      <th key={idx} className="px-2 py-2 border-b border-border min-w-[130px]">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={!!selected[idx]}
                            onCheckedChange={() => toggleColumn(idx)}
                          />
                          <Input
                            type="date"
                            value={av.data_avaliacao || ""}
                            onChange={(e) => updateCell(idx, "data_avaliacao", e.target.value)}
                            className="h-7 text-xs"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {av.data_avaliacao ? format(new Date(av.data_avaliacao + "T12:00"), "dd/MM/yyyy") : "—"}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map((group) => {
                    // só mostra o grupo se algum campo tiver valor em qualquer avaliação
                    const hasAny = group.fields.some((f) => avaliacoes.some((av) => av[f.key] != null));
                    if (!hasAny) return null;
                    return (
                      <>
                        <tr key={`g-${group.label}`} className="bg-muted/40">
                          <td colSpan={avaliacoes.length + 1} className="px-3 py-1.5 font-semibold text-[11px] uppercase text-muted-foreground">
                            {group.label}
                          </td>
                        </tr>
                        {group.fields.map((f) => {
                          const rowHasAny = avaliacoes.some((av) => av[f.key] != null);
                          if (!rowHasAny) return null;
                          return (
                            <tr key={f.key} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-1.5 text-foreground">
                                {f.label} {f.unit && <span className="text-muted-foreground">({f.unit})</span>}
                              </td>
                              {avaliacoes.map((av, idx) => (
                                <td key={idx} className="px-1 py-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={av[f.key] ?? ""}
                                    onChange={(e) => updateCell(idx, f.key, e.target.value)}
                                    className="h-7 text-xs text-center"
                                    disabled={!selected[idx]}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                  {/* Observações */}
                  {avaliacoes.some((av) => av.observacoes) && (
                    <>
                      <tr className="bg-muted/40">
                        <td colSpan={avaliacoes.length + 1} className="px-3 py-1.5 font-semibold text-[11px] uppercase text-muted-foreground">
                          Observações
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 align-top text-foreground">Observações</td>
                        {avaliacoes.map((av, idx) => (
                          <td key={idx} className="px-1 py-1">
                            <textarea
                              value={av.observacoes || ""}
                              onChange={(e) =>
                                setAvaliacoes((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], observacoes: e.target.value };
                                  return next;
                                })
                              }
                              className="w-full text-xs border border-input rounded p-1 min-h-[60px] bg-background"
                              disabled={!selected[idx]}
                            />
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setStep("upload")} disabled={saving}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={saveAll} disabled={saving || selectedCount === 0}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando…</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Salvar {selectedCount} avaliação(ões)</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
