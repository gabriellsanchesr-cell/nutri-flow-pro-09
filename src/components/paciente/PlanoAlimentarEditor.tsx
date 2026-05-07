import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Save, ArrowLeft, Plus, Trash2, Search, Clock, ChevronDown, ChevronUp, FileDown, ArrowRightLeft, Sparkles,
} from "lucide-react";
import { ExportPdfModal } from "@/components/pdf/ExportPdfModal";

const REFEICAO_TIPOS = [
  { value: "cafe_da_manha", label: "Café da Manhã", ordem: 1 },
  { value: "lanche_da_manha", label: "Lanche da Manhã", ordem: 2 },
  { value: "almoco", label: "Almoço", ordem: 3 },
  { value: "lanche_da_tarde", label: "Lanche da Tarde", ordem: 4 },
  { value: "jantar", label: "Jantar", ordem: 5 },
  { value: "ceia", label: "Ceia", ordem: 6 },
] as const;

interface Alimento {
  id?: string;
  nome_alimento: string;
  quantidade: number;
  medida_caseira: string;
  energia_kcal: number;
  proteina_g: number;
  carboidrato_g: number;
  lipidio_g: number;
  fibra_g: number;
  alimento_taco_id: number | null;
  grupo?: string | null;
  // Valores base por 100g para recálculo automático
  base_energia_kcal?: number;
  base_proteina_g?: number;
  base_carboidrato_g?: number;
  base_lipidio_g?: number;
  base_fibra_g?: number;
}

interface Refeicao {
  id?: string;
  tipo: string;
  ordem: number;
  horario_sugerido: string;
  observacoes: string;
  substituicoes_sugeridas: string;
  alimentos: Alimento[];
  expanded: boolean;
}

interface PlanoData {
  id?: string;
  nome: string;
  observacoes: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  objetivo_template: string;
}

interface InitialDraft {
  nome?: string;
  observacoes?: string;
  refeicoes?: Array<{
    tipo: string;
    ordem?: number;
    observacoes?: string;
    substituicoes_sugeridas?: string;
    alimentos: Array<{
      nome_alimento: string;
      quantidade: number;
      medida_caseira: string;
      energia_kcal: number;
      proteina_g: number;
      carboidrato_g: number;
      lipidio_g: number;
      fibra_g: number;
      alimento_taco_id: number | null;
      precisa_revisao?: boolean;
    }>;
  }>;
}

interface Props {
  pacienteId?: string;
  planoId?: string;
  onBack: () => void;
  paciente?: any;
  initialData?: InitialDraft | null;
  isTemplate?: boolean;
}

export function PlanoAlimentarEditor({ pacienteId, planoId, onBack, paciente, initialData, isTemplate = false }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importedBanner, setImportedBanner] = useState(!!initialData);
  const [plano, setPlano] = useState<PlanoData>({
    nome: initialData?.nome || "Plano Alimentar",
    observacoes: initialData?.observacoes || "",
    status: "rascunho",
    data_inicio: "", data_fim: "", objetivo_template: "",
  });
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(() => {
    // Build base 6 refeicoes
    const base = REFEICAO_TIPOS.map(r => ({
      tipo: r.value, ordem: r.ordem, horario_sugerido: "", observacoes: "",
      substituicoes_sugeridas: "", alimentos: [] as Alimento[], expanded: true,
    }));
    if (initialData?.refeicoes?.length) {
      initialData.refeicoes.forEach((imp) => {
        const idx = base.findIndex((b) => b.tipo === imp.tipo);
        if (idx >= 0) {
          base[idx].observacoes = imp.observacoes || "";
          base[idx].substituicoes_sugeridas = imp.substituicoes_sugeridas || "";
          base[idx].alimentos = imp.alimentos.map((a) => {
            const baseRatio = a.alimento_taco_id && a.quantidade > 0 ? 100 / a.quantidade : null;
            return {
              nome_alimento: a.nome_alimento,
              quantidade: a.quantidade,
              medida_caseira: a.medida_caseira,
              energia_kcal: a.energia_kcal,
              proteina_g: a.proteina_g,
              carboidrato_g: a.carboidrato_g,
              lipidio_g: a.lipidio_g,
              fibra_g: a.fibra_g,
              alimento_taco_id: a.alimento_taco_id,
              base_energia_kcal: baseRatio ? a.energia_kcal * baseRatio : undefined,
              base_proteina_g: baseRatio ? a.proteina_g * baseRatio : undefined,
              base_carboidrato_g: baseRatio ? a.carboidrato_g * baseRatio : undefined,
              base_lipidio_g: baseRatio ? a.lipidio_g * baseRatio : undefined,
              base_fibra_g: baseRatio ? a.fibra_g * baseRatio : undefined,
            };
          });
        }
      });
    }
    return base;
  });

  useEffect(() => {
    if (planoId) loadPlano();
  }, [planoId]);

  const loadPlano = async () => {
    const { data: p } = await supabase
      .from("planos_alimentares")
      .select("*")
      .eq("id", planoId)
      .single();
    if (p) {
      setPlano({
        id: p.id, nome: p.nome, observacoes: p.observacoes || "",
        status: (p as any).status || "rascunho",
        data_inicio: (p as any).data_inicio || "",
        data_fim: (p as any).data_fim || "",
        objetivo_template: p.objetivo_template || "",
      });
    }
    const { data: refs } = await supabase
      .from("refeicoes")
      .select("*, alimentos_plano(*)")
      .eq("plano_id", planoId!)
      .order("ordem", { ascending: true });
    if (refs && refs.length > 0) {
      setRefeicoes(refs.map(r => ({
        id: r.id, tipo: r.tipo, ordem: r.ordem || 0,
        horario_sugerido: (r as any).horario_sugerido || "",
        observacoes: r.observacoes || "",
        substituicoes_sugeridas: r.substituicoes_sugeridas || "",
        alimentos: (r.alimentos_plano || []).map((a: any) => ({
          id: a.id, nome_alimento: a.nome_alimento, quantidade: a.quantidade || 100,
          medida_caseira: a.medida_caseira || "1 porção",
          energia_kcal: a.energia_kcal || 0, proteina_g: a.proteina_g || 0,
          carboidrato_g: a.carboidrato_g || 0, lipidio_g: a.lipidio_g || 0,
          fibra_g: a.fibra_g || 0, alimento_taco_id: a.alimento_taco_id,
          // Para alimentos já salvos sem base, calcular a partir dos valores atuais
          base_energia_kcal: a.alimento_taco_id ? (a.energia_kcal * 100 / (a.quantidade || 100)) : undefined,
          base_proteina_g: a.alimento_taco_id ? (a.proteina_g * 100 / (a.quantidade || 100)) : undefined,
          base_carboidrato_g: a.alimento_taco_id ? (a.carboidrato_g * 100 / (a.quantidade || 100)) : undefined,
          base_lipidio_g: a.alimento_taco_id ? (a.lipidio_g * 100 / (a.quantidade || 100)) : undefined,
          base_fibra_g: a.alimento_taco_id ? (a.fibra_g * 100 / (a.quantidade || 100)) : undefined,
        })),
        expanded: true,
      })));
    }
  };

  const totals = useMemo(() => {
    let kcal = 0, prot = 0, carb = 0, lip = 0, fib = 0;
    refeicoes.forEach(r => r.alimentos.forEach(a => {
      kcal += a.energia_kcal; prot += a.proteina_g; carb += a.carboidrato_g;
      lip += a.lipidio_g; fib += a.fibra_g;
    }));
    return { kcal: Math.round(kcal), prot: Math.round(prot), carb: Math.round(carb), lip: Math.round(lip), fib: Math.round(fib) };
  }, [refeicoes]);

  const handleSave = async (overrideStatus?: string) => {
    if (!user) return;
    setSaving(true);
    try {
      let savedPlanoId = plano.id;
      const finalStatus = overrideStatus || plano.status;
      const planoPayload: any = {
        nome: plano.nome, observacoes: plano.observacoes || null,
        status: finalStatus,
        data_inicio: isTemplate ? null : (plano.data_inicio || null),
        data_fim: isTemplate ? null : (plano.data_fim || null),
        objetivo_template: plano.objetivo_template || null,
        paciente_id: isTemplate ? null : pacienteId,
        user_id: user.id,
        is_template: isTemplate,
      };
      if (savedPlanoId) {
        const { error } = await supabase.from("planos_alimentares").update(planoPayload).eq("id", savedPlanoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("planos_alimentares").insert(planoPayload).select("id").single();
        if (error) throw error;
        savedPlanoId = data.id;
        setPlano(p => ({ ...p, id: savedPlanoId, status: finalStatus }));
      }

      // Delete existing refeicoes (cascade deletes alimentos_plano)
      if (planoId || savedPlanoId) {
        await supabase.from("refeicoes").delete().eq("plano_id", savedPlanoId!);
      }

      for (const ref of refeicoes) {
        const { data: savedRef, error: refErr } = await supabase.from("refeicoes").insert({
          plano_id: savedPlanoId!, tipo: ref.tipo as any, ordem: ref.ordem,
          horario_sugerido: ref.horario_sugerido || null,
          observacoes: ref.observacoes || null,
          substituicoes_sugeridas: ref.substituicoes_sugeridas || null,
        }).select("id").single();
        if (refErr) throw refErr;

        if (ref.alimentos.length > 0) {
          const { error: aliErr } = await supabase.from("alimentos_plano").insert(
            ref.alimentos.map(a => ({
              refeicao_id: savedRef.id, nome_alimento: a.nome_alimento,
              quantidade: a.quantidade, medida_caseira: a.medida_caseira,
              energia_kcal: a.energia_kcal, proteina_g: a.proteina_g,
              carboidrato_g: a.carboidrato_g, lipidio_g: a.lipidio_g,
              fibra_g: a.fibra_g, alimento_taco_id: a.alimento_taco_id,
            }))
          );
          if (aliErr) throw aliErr;
        }
      }

      if (overrideStatus === "ativo") {
        setPlano(p => ({ ...p, status: "ativo" }));
        setImportedBanner(false);
        toast({ title: "Plano ativado!", description: "O plano importado está ativo para o paciente." });
      } else {
        toast({ title: "Plano salvo com sucesso!" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const updateRefeicao = (idx: number, field: string, value: any) => {
    setRefeicoes(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addAlimento = (refIdx: number, alimento: Alimento) => {
    setRefeicoes(prev => prev.map((r, i) =>
      i === refIdx ? { ...r, alimentos: [...r.alimentos, alimento] } : r
    ));
  };

  const removeAlimento = (refIdx: number, aliIdx: number) => {
    setRefeicoes(prev => prev.map((r, i) =>
      i === refIdx ? { ...r, alimentos: r.alimentos.filter((_, j) => j !== aliIdx) } : r
    ));
  };

  const updateAlimento = (refIdx: number, aliIdx: number, field: string, value: any) => {
    setRefeicoes(prev => prev.map((r, i) =>
      i === refIdx ? {
        ...r, alimentos: r.alimentos.map((a, j) => j === aliIdx ? { ...a, [field]: value } : a)
      } : r
    ));
  };

  const macroTotal = (ref: Refeicao) => {
    let kcal = 0, p = 0, c = 0, l = 0;
    ref.alimentos.forEach(a => { kcal += a.energia_kcal; p += a.proteina_g; c += a.carboidrato_g; l += a.lipidio_g; });
    return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), l: Math.round(l) };
  };

  return (
    <div className="space-y-4">
      {/* Sticky macro bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h3 className="font-semibold text-foreground">Editor de Plano Alimentar</h3>
          </div>
          <div className="flex items-center gap-2">
            {importedBanner && (
              <Button onClick={() => handleSave("ativo")} disabled={saving} size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-1" /> Ativar plano importado
              </Button>
            )}
            <Button onClick={() => handleSave()} disabled={saving} size="sm" variant={importedBanner ? "outline" : "default"}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar Rascunho"}
            </Button>
            {planoId && (
              <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
                <FileDown className="h-4 w-4 mr-1" /> Exportar PDF
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <MacroBox label="Calorias" value={`${totals.kcal}`} unit="kcal" color="bg-primary" />
          <MacroBox label="Proteína" value={`${totals.prot}`} unit="g" color="bg-blue-500" />
          <MacroBox label="Carboidrato" value={`${totals.carb}`} unit="g" color="bg-orange-500" />
          <MacroBox label="Gordura" value={`${totals.lip}`} unit="g" color="bg-yellow-500" />
          <MacroBox label="Fibra" value={`${totals.fib}`} unit="g" color="bg-green-500" />
        </div>
      </div>

      {importedBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-900 dark:text-amber-100 flex items-start justify-between gap-3">
          <div>
            <strong>Plano importado de PDF.</strong> Revise refeições e quantidades antes de ativar. Alimentos não encontrados na base TACO ficaram com macros zerados — preencha manualmente ou substitua pela busca.
          </div>
          <Button variant="ghost" size="sm" onClick={() => setImportedBanner(false)}>Ok</Button>
        </div>
      )}

      {/* Plan header */}
      <Card className="border-border rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input value={plano.nome} onChange={e => setPlano(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={plano.objetivo_template} onValueChange={v => setPlano(p => ({ ...p, objetivo_template: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar objetivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="ganho_de_massa">Ganho de Massa</SelectItem>
                  <SelectItem value="saude_intestinal">Saúde Intestinal</SelectItem>
                  <SelectItem value="controle_ansiedade_alimentar">Controle Ansiedade</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={plano.data_inicio} onChange={e => setPlano(p => ({ ...p, data_inicio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim (opcional)</Label>
              <Input type="date" value={plano.data_fim} onChange={e => setPlano(p => ({ ...p, data_fim: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={plano.status} onValueChange={v => setPlano(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações Gerais</Label>
            <Textarea value={plano.observacoes} onChange={e => setPlano(p => ({ ...p, observacoes: e.target.value }))} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      {refeicoes.map((ref, refIdx) => {
        const mt = macroTotal(ref);
        const tipoLabel = REFEICAO_TIPOS.find(t => t.value === ref.tipo)?.label || ref.tipo;
        return (
          <Card key={ref.tipo} className="border-border rounded-xl">
            <CardHeader
              className="cursor-pointer pb-3"
              onClick={() => updateRefeicao(refIdx, "expanded", !ref.expanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{tipoLabel}</CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    {mt.kcal} kcal • P {mt.p}g • C {mt.c}g • G {mt.l}g
                  </Badge>
                </div>
                {ref.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {ref.expanded && (
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      className="w-28 h-8 text-xs"
                      placeholder="08:00"
                      value={ref.horario_sugerido}
                      onChange={e => updateRefeicao(refIdx, "horario_sugerido", e.target.value)}
                    />
                  </div>
                </div>

                {/* Alimentos */}
                {ref.alimentos.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr,80px,100px,70px,70px,70px,70px,40px] gap-1 px-3 py-1.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                      <span>Alimento</span><span>Qtd (g)</span><span>Medida</span>
                      <span>Kcal</span><span>P</span><span>C</span><span>G</span><span></span>
                    </div>
                    {ref.alimentos.map((ali, aliIdx) => (
                      <div key={aliIdx} className="border-t">
                        <div className="grid grid-cols-[1fr,80px,100px,70px,70px,70px,70px,40px] gap-1 px-3 py-1.5 items-center text-sm">
                          <span className="truncate" title={ali.nome_alimento}>{ali.nome_alimento}</span>
                          <Input
                            className="h-7 text-xs"
                            type="number"
                            value={ali.quantidade}
                            onChange={e => {
                              const qty = parseFloat(e.target.value) || 0;
                              updateAlimento(refIdx, aliIdx, "quantidade", qty);
                              if (ali.base_energia_kcal !== undefined) {
                                const ratio = qty / 100;
                                updateAlimento(refIdx, aliIdx, "energia_kcal", ali.base_energia_kcal * ratio);
                                updateAlimento(refIdx, aliIdx, "proteina_g", (ali.base_proteina_g || 0) * ratio);
                                updateAlimento(refIdx, aliIdx, "carboidrato_g", (ali.base_carboidrato_g || 0) * ratio);
                                updateAlimento(refIdx, aliIdx, "lipidio_g", (ali.base_lipidio_g || 0) * ratio);
                                updateAlimento(refIdx, aliIdx, "fibra_g", (ali.base_fibra_g || 0) * ratio);
                              }
                            }}
                          />
                          <Input
                            className="h-7 text-xs"
                            value={ali.medida_caseira}
                            onChange={e => updateAlimento(refIdx, aliIdx, "medida_caseira", e.target.value)}
                          />
                          <span className="text-xs text-center">{Math.round(ali.energia_kcal)}</span>
                          <span className="text-xs text-center">{Math.round(ali.proteina_g)}</span>
                          <span className="text-xs text-center">{Math.round(ali.carboidrato_g)}</span>
                          <span className="text-xs text-center">{Math.round(ali.lipidio_g)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAlimento(refIdx, aliIdx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                        <SubstituicoesInline
                          alimento={ali}
                          onReplace={(novo) => {
                            setRefeicoes(prev => prev.map((r, i) =>
                              i === refIdx ? {
                                ...r, alimentos: r.alimentos.map((a, j) => j === aliIdx ? novo : a)
                              } : r
                            ));
                          }}
                          onAddNote={(linha) => {
                            updateRefeicao(refIdx, "substituicoes_sugeridas",
                              ref.substituicoes_sugeridas ? ref.substituicoes_sugeridas + "\n" + linha : linha
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <AlimentoSearch onSelect={(ali) => addAlimento(refIdx, ali)} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Observações da Refeição</Label>
                    <Textarea
                      className="text-xs min-h-[60px]"
                      value={ref.observacoes}
                      onChange={e => updateRefeicao(refIdx, "observacoes", e.target.value)}
                      placeholder="Dicas, orientações..."
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Substituições Sugeridas</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={async () => {
                          // Get food groups present in this meal
                          const tacoIds = ref.alimentos.filter(a => a.alimento_taco_id).map(a => a.alimento_taco_id!);
                          if (tacoIds.length === 0) {
                            toast({ title: "Adicione alimentos da base TACO primeiro" });
                            return;
                          }
                          // Get the groups of foods in this meal
                          const { data: foods } = await supabase
                            .from("alimentos_taco")
                            .select("grupo")
                            .in("id", tacoIds);
                          const grupos = [...new Set((foods || []).map(f => f.grupo).filter(Boolean))];
                          if (grupos.length === 0) return;
                          // Query substitutions for those groups
                          const { data: subs } = await supabase
                            .from("substituicoes")
                            .select("*")
                            .in("grupo", grupos);
                          if (!subs || subs.length === 0) {
                            toast({ title: "Nenhuma substituição encontrada", description: "Popule sua biblioteca de substituições primeiro." });
                            return;
                          }
                          const text = subs.map(s =>
                            `${s.alimento_original} → ${s.alimento_substituto}${s.observacoes ? ` (${s.observacoes})` : ""}`
                          ).join("\n");
                          updateRefeicao(refIdx, "substituicoes_sugeridas",
                            ref.substituicoes_sugeridas ? ref.substituicoes_sugeridas + "\n" + text : text
                          );
                          toast({ title: `${subs.length} substituições carregadas!` });
                        }}
                      >
                        Sugerir Substituições
                      </Button>
                    </div>
                    <Textarea
                      className="text-xs min-h-[60px]"
                      value={ref.substituicoes_sugeridas}
                      onChange={e => updateRefeicao(refIdx, "substituicoes_sugeridas", e.target.value)}
                      placeholder="Alimentos alternativos..."
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {showExport && paciente && (
        <ExportPdfModal
          open={showExport}
          onOpenChange={setShowExport}
          type="plano_alimentar"
          paciente={paciente}
          planoData={{ ...plano, id: planoId, refeicoes: refeicoes.map(r => ({ ...r, alimentos_plano: r.alimentos })) }}
        />
      )}
    </div>
  );
}

function MacroBox({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></p>
      <div className="w-full h-1 rounded-full bg-muted mt-1">
        <div className={`h-1 rounded-full ${color} opacity-70`} style={{ width: "50%" }} />
      </div>
    </div>
  );
}

const grupoLabelsSearch: Record<string, string> = {
  cereais: "Cereais", verduras: "Verduras", frutas: "Frutas", leguminosas: "Leguminosas",
  oleaginosas: "Oleag.", carnes: "Carnes", leites: "Leites", ovos: "Ovos",
  oleos: "Óleos", acucares: "Açúcares", outros: "Outros",
};

const grupoColors: Record<string, string> = {
  cereais: "bg-amber-100 text-amber-800", verduras: "bg-green-100 text-green-800",
  frutas: "bg-pink-100 text-pink-800", leguminosas: "bg-orange-100 text-orange-800",
  oleaginosas: "bg-yellow-100 text-yellow-800", carnes: "bg-red-100 text-red-800",
  leites: "bg-blue-100 text-blue-800", ovos: "bg-indigo-100 text-indigo-800",
  oleos: "bg-lime-100 text-lime-800", acucares: "bg-purple-100 text-purple-800",
  outros: "bg-gray-100 text-gray-800",
};

function AlimentoSearch({ onSelect }: { onSelect: (a: Alimento) => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const ql = q.toLowerCase();
    const [taco, perso] = await Promise.all([
      supabase.from("alimentos_taco").select("*")
        .or(`nome.ilike.%${q}%,palavras_chave.cs.{${ql}}`).limit(12),
      user ? supabase.from("alimentos_personalizados").select("*")
        .eq("user_id", user.id).ilike("nome", `%${q}%`).limit(8) : Promise.resolve({ data: [] as any[] }),
    ]);
    const tacoItems = (taco.data || []).map((d: any) => ({ ...d, _source: "taco" }));
    const persoItems = (perso.data || []).map((d: any) => ({ ...d, _source: "perso" }));
    setResults([...persoItems, ...tacoItems]);
    setSearching(false);
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const selectAlimento = (item: any) => {
    const isPerso = item._source === "perso";
    const baseQty = isPerso ? Number(item.quantidade_base) || 100 : 100;
    const ratio = isPerso ? 100 / baseQty : 1;
    const base = {
      base_energia_kcal: (item.energia_kcal || 0) * ratio,
      base_proteina_g: (item.proteina_g || 0) * ratio,
      base_carboidrato_g: (item.carboidrato_g || 0) * ratio,
      base_lipidio_g: (item.lipidio_g || 0) * ratio,
      base_fibra_g: (item.fibra_g || 0) * ratio,
    };
    onSelect({
      nome_alimento: item.nome,
      quantidade: baseQty,
      medida_caseira: isPerso ? (item.medida_caseira || "1 porção") : "1 porção",
      energia_kcal: item.energia_kcal || 0,
      proteina_g: item.proteina_g || 0,
      carboidrato_g: item.carboidrato_g || 0,
      lipidio_g: item.lipidio_g || 0,
      fibra_g: item.fibra_g || 0,
      alimento_taco_id: isPerso ? null : item.id,
      grupo: item.grupo || null,
      ...base,
    });
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Buscar alimento (TACO + meus alimentos)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowCustom(true)}>
          <Plus className="h-3 w-3 mr-1" /> Personalizado
        </Button>
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(item => (
            <button
              key={`${item._source}-${item.id}`}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between items-center border-b last:border-0 gap-2"
              onClick={() => selectAlimento(item)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item._source === "perso" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-primary/15 text-primary font-medium">Meu</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${grupoColors[item.grupo] || grupoColors.outros}`}>
                  {grupoLabelsSearch[item.grupo] || item.grupo}
                </span>
                <span className="truncate">{item.nome}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {Math.round(item.energia_kcal || 0)} kcal · P{Math.round(item.proteina_g || 0)} C{Math.round(item.carboidrato_g || 0)} G{Math.round(item.lipidio_g || 0)} F{Math.round(item.fibra_g || 0)}
              </span>
            </button>
          ))}
        </div>
      )}
      {searching && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}

      <AlimentoPersonalizadoModal
        open={showCustom}
        onOpenChange={setShowCustom}
        onConfirm={(a) => { onSelect(a); setShowCustom(false); }}
      />
    </div>
  );
}

function AlimentoPersonalizadoModal({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onConfirm: (a: Alimento) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const empty = {
    nome: "", grupo: "outros", quantidade: 100, medida_caseira: "1 porção",
    energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipidio_g: 0, fibra_g: 0,
  };
  const [form, setForm] = useState(empty);
  const [salvar, setSalvar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setForm(empty); setSalvar(false); } }, [open]);

  const handle = async () => {
    if (!form.nome.trim()) { toast({ title: "Informe o nome do alimento", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (salvar && user) {
        const { error } = await supabase.from("alimentos_personalizados").insert({
          user_id: user.id, nome: form.nome, grupo: form.grupo as any,
          quantidade_base: form.quantidade, medida_caseira: form.medida_caseira,
          energia_kcal: form.energia_kcal, proteina_g: form.proteina_g,
          carboidrato_g: form.carboidrato_g, lipidio_g: form.lipidio_g, fibra_g: form.fibra_g,
        });
        if (error) throw error;
        toast({ title: "Salvo na sua biblioteca!" });
      }
      const ratio = 100 / (form.quantidade || 100);
      onConfirm({
        nome_alimento: form.nome,
        quantidade: form.quantidade,
        medida_caseira: form.medida_caseira,
        energia_kcal: form.energia_kcal,
        proteina_g: form.proteina_g,
        carboidrato_g: form.carboidrato_g,
        lipidio_g: form.lipidio_g,
        fibra_g: form.fibra_g,
        alimento_taco_id: null,
        grupo: form.grupo,
        base_energia_kcal: form.energia_kcal * ratio,
        base_proteina_g: form.proteina_g * ratio,
        base_carboidrato_g: form.carboidrato_g * ratio,
        base_lipidio_g: form.lipidio_g * ratio,
        base_fibra_g: form.fibra_g * ratio,
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const num = (k: keyof typeof form) => (
    <Input type="number" className="h-8 text-xs" value={(form as any)[k]}
      onChange={e => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))} />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Adicionar alimento personalizado</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome *</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex.: Pão de queijo caseiro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Grupo</Label>
              <Select value={form.grupo} onValueChange={v => setForm(f => ({ ...f, grupo: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(grupoLabelsSearch).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medida caseira</Label>
              <Input className="h-9" value={form.medida_caseira} onChange={e => setForm(f => ({ ...f, medida_caseira: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label className="text-xs">Quantidade (g)</Label>{num("quantidade")}</div>
            <div className="space-y-1"><Label className="text-xs">Kcal</Label>{num("energia_kcal")}</div>
            <div className="space-y-1"><Label className="text-xs">Proteína (g)</Label>{num("proteina_g")}</div>
            <div className="space-y-1"><Label className="text-xs">Carboidrato (g)</Label>{num("carboidrato_g")}</div>
            <div className="space-y-1"><Label className="text-xs">Gordura (g)</Label>{num("lipidio_g")}</div>
            <div className="space-y-1"><Label className="text-xs">Fibra (g)</Label>{num("fibra_g")}</div>
          </div>
          <p className="text-[11px] text-muted-foreground">Os valores informados se referem à quantidade indicada acima.</p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={salvar} onCheckedChange={(c) => setSalvar(!!c)} />
            Salvar este alimento na minha biblioteca
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handle} disabled={saving}>{saving ? "Salvando..." : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SubOption {
  alimento_substituto: string;
  observacoes: string | null;
  // dados TACO se encontrados
  kcal_100?: number;
  prot_100?: number;
  carb_100?: number;
  lip_100?: number;
  fib_100?: number;
  taco_id?: number;
  quantidade_eq?: number; // gramas equivalentes em kcal
}

function SubstituicoesInline({
  alimento, onReplace, onAddNote,
}: {
  alimento: Alimento;
  onReplace: (novo: Alimento) => void;
  onAddNote: (linha: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<SubOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  const carregar = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      // Busca substituições por grupo OU pelo nome do alimento original
      let query = supabase.from("substituicoes").select("*");
      if (alimento.grupo) {
        query = query.or(`grupo.eq.${alimento.grupo},alimento_original.ilike.%${alimento.nome_alimento.split(",")[0]}%`);
      } else {
        query = query.ilike("alimento_original", `%${alimento.nome_alimento.split(",")[0]}%`);
      }
      const { data: subs } = await query.limit(20);
      const list = subs || [];
      // Buscar dados TACO dos substitutos para calcular equivalência
      const nomes = [...new Set(list.map(s => s.alimento_substituto))];
      let tacoMap = new Map<string, any>();
      if (nomes.length) {
        const ors = nomes.map(n => `nome.ilike.%${n.split(" ")[0]}%`).join(",");
        const { data: tacos } = await supabase.from("alimentos_taco").select("*").or(ors).limit(80);
        (tacos || []).forEach(t => {
          for (const n of nomes) {
            if (!tacoMap.has(n) && t.nome.toLowerCase().includes(n.toLowerCase().split(" ")[0])) {
              tacoMap.set(n, t);
            }
          }
        });
      }
      const result: SubOption[] = list.map(s => {
        const t = tacoMap.get(s.alimento_substituto);
        if (t && (t.energia_kcal || 0) > 0) {
          const qtd_eq = (alimento.energia_kcal / t.energia_kcal) * 100;
          return {
            alimento_substituto: s.alimento_substituto,
            observacoes: s.observacoes,
            kcal_100: t.energia_kcal, prot_100: t.proteina_g, carb_100: t.carboidrato_g,
            lip_100: t.lipidio_g, fib_100: t.fibra_g, taco_id: t.id,
            quantidade_eq: Math.round(qtd_eq),
          };
        }
        return { alimento_substituto: s.alimento_substituto, observacoes: s.observacoes };
      });
      setOpts(result);
      setLoaded(true);
    } finally { setLoading(false); }
  }, [alimento, loaded]);

  useEffect(() => {
    if (open && !loaded) carregar();
  }, [open, loaded, carregar]);

  // Reset quando quantidade do alimento muda — recalcular equivalências
  useEffect(() => {
    if (loaded) {
      setOpts(prev => prev.map(o => {
        if (o.kcal_100 && o.kcal_100 > 0) {
          return { ...o, quantidade_eq: Math.round((alimento.energia_kcal / o.kcal_100) * 100) };
        }
        return o;
      }));
    }
  }, [alimento.energia_kcal, loaded]);

  return (
    <div className="px-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-[11px] text-primary hover:underline flex items-center gap-1"
      >
        <ArrowRightLeft className="h-3 w-3" />
        {open ? "Ocultar substituições" : "Ver substituições"}
        {loaded && ` (${opts.length})`}
      </button>
      {open && (
        <div className="mt-2 ml-4 space-y-1">
          {loading && <p className="text-[11px] text-muted-foreground">Carregando...</p>}
          {!loading && loaded && opts.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Nenhuma substituição cadastrada para este alimento. Adicione na Biblioteca.</p>
          )}
          {opts.map((o, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-[11px] border border-border/50 rounded px-2 py-1 bg-muted/20">
              <div className="min-w-0 flex-1">
                <span className="font-medium">{o.alimento_substituto}</span>
                {o.quantidade_eq ? (
                  <span className="text-muted-foreground"> — {o.quantidade_eq}g (≈ {Math.round(alimento.energia_kcal)} kcal)</span>
                ) : (
                  <span className="text-muted-foreground"> — sem dados TACO, ajuste manualmente</span>
                )}
                {o.observacoes && <span className="text-muted-foreground italic"> · {o.observacoes}</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {o.taco_id && o.quantidade_eq && (
                  <Button
                    size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                    title="Substituir o alimento desta linha"
                    onClick={() => {
                      const ratio = (o.quantidade_eq! / 100);
                      onReplace({
                        nome_alimento: o.alimento_substituto,
                        quantidade: o.quantidade_eq!,
                        medida_caseira: "1 porção",
                        energia_kcal: (o.kcal_100 || 0) * ratio,
                        proteina_g: (o.prot_100 || 0) * ratio,
                        carboidrato_g: (o.carb_100 || 0) * ratio,
                        lipidio_g: (o.lip_100 || 0) * ratio,
                        fibra_g: (o.fib_100 || 0) * ratio,
                        alimento_taco_id: o.taco_id || null,
                        grupo: alimento.grupo,
                        base_energia_kcal: o.kcal_100,
                        base_proteina_g: o.prot_100,
                        base_carboidrato_g: o.carb_100,
                        base_lipidio_g: o.lip_100,
                        base_fibra_g: o.fib_100,
                      });
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                  title="Adicionar como opção nas notas da refeição"
                  onClick={() => {
                    const linha = o.quantidade_eq
                      ? `${Math.round(alimento.quantidade)}g de ${alimento.nome_alimento} → ${o.quantidade_eq}g de ${o.alimento_substituto} (≈${Math.round(alimento.energia_kcal)} kcal)`
                      : `${alimento.nome_alimento} → ${o.alimento_substituto}${o.observacoes ? ` (${o.observacoes})` : ""}`;
                    onAddNote(linha);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

