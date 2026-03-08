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
import {
  Save, ArrowLeft, Plus, Trash2, Search, Clock, ChevronDown, ChevronUp, FileDown,
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

interface Props {
  pacienteId: string;
  planoId?: string;
  onBack: () => void;
  paciente?: any;
}

export function PlanoAlimentarEditor({ pacienteId, planoId, onBack, paciente }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [plano, setPlano] = useState<PlanoData>({
    nome: "Plano Alimentar", observacoes: "", status: "rascunho",
    data_inicio: "", data_fim: "", objetivo_template: "",
  });
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(
    REFEICAO_TIPOS.map(r => ({
      tipo: r.value, ordem: r.ordem, horario_sugerido: "", observacoes: "",
      substituicoes_sugeridas: "", alimentos: [], expanded: true,
    }))
  );

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let savedPlanoId = plano.id;
      const planoPayload: any = {
        nome: plano.nome, observacoes: plano.observacoes || null,
        status: plano.status,
        data_inicio: plano.data_inicio || null,
        data_fim: plano.data_fim || null,
        objetivo_template: plano.objetivo_template || null,
        paciente_id: pacienteId, user_id: user.id, is_template: false,
      };
      if (savedPlanoId) {
        const { error } = await supabase.from("planos_alimentares").update(planoPayload).eq("id", savedPlanoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("planos_alimentares").insert(planoPayload).select("id").single();
        if (error) throw error;
        savedPlanoId = data.id;
        setPlano(p => ({ ...p, id: savedPlanoId }));
      }

      // Delete existing refeicoes (cascade deletes alimentos_plano)
      if (planoId) {
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

      toast({ title: "Plano salvo com sucesso!" });
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
      <div className="sticky top-0 z-10 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h3 className="font-semibold text-foreground">Editor de Plano Alimentar</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar Plano"}
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
                      <div key={aliIdx} className="grid grid-cols-[1fr,80px,100px,70px,70px,70px,70px,40px] gap-1 px-3 py-1.5 border-t items-center text-sm">
                        <span className="truncate">{ali.nome_alimento}</span>
                        <Input
                          className="h-7 text-xs"
                          type="number"
                          value={ali.quantidade}
                          onChange={e => {
                            const qty = parseFloat(e.target.value) || 0;
                            updateAlimento(refIdx, aliIdx, "quantidade", qty);
                            
                            // Recalcular macros automaticamente se for alimento da TACO
                            if (ali.alimento_taco_id && ali.base_energia_kcal !== undefined) {
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
                    <Label className="text-xs">Substituições Sugeridas</Label>
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

function AlimentoSearch({ onSelect }: { onSelect: (a: Alimento) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("alimentos_taco")
      .select("*")
      .ilike("nome", `%${q}%`)
      .limit(10);
    setResults(data || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const selectAlimento = (item: any) => {
    const qty = 100;
    onSelect({
      nome_alimento: item.nome,
      quantidade: qty,
      medida_caseira: "1 porção",
      energia_kcal: item.energia_kcal || 0,
      proteina_g: item.proteina_g || 0,
      carboidrato_g: item.carboidrato_g || 0,
      lipidio_g: item.lipidio_g || 0,
      fibra_g: item.fibra_g || 0,
      alimento_taco_id: item.id,
      // Armazenar valores base para recálculo automático
      base_energia_kcal: item.energia_kcal || 0,
      base_proteina_g: item.proteina_g || 0,
      base_carboidrato_g: item.carboidrato_g || 0,
      base_lipidio_g: item.lipidio_g || 0,
      base_fibra_g: item.fibra_g || 0,
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
            placeholder="Buscar alimento na base TACO..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
          onSelect({
            nome_alimento: "Alimento personalizado",
            quantidade: 100, medida_caseira: "1 porção",
            energia_kcal: 0, proteina_g: 0, carboidrato_g: 0,
            lipidio_g: 0, fibra_g: 0, alimento_taco_id: null,
          });
        }}>
          <Plus className="h-3 w-3 mr-1" /> Personalizado
        </Button>
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between items-center border-b last:border-0"
              onClick={() => selectAlimento(item)}
            >
              <span className="truncate flex-1">{item.nome}</span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                {Math.round(item.energia_kcal || 0)} kcal | P{Math.round(item.proteina_g || 0)} C{Math.round(item.carboidrato_g || 0)} G{Math.round(item.lipidio_g || 0)}
              </span>
            </button>
          ))}
        </div>
      )}
      {searching && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
    </div>
  );
}
