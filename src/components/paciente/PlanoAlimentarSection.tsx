import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Utensils, ChevronDown, ChevronUp, Pencil, Copy, Power, Trash2, Send, FileDown,
} from "lucide-react";
import { PlanoAlimentarEditor } from "./PlanoAlimentarEditor";
import { ExportPdfModal } from "@/components/pdf/ExportPdfModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const tipoRefeicaoLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_da_manha: "Lanche da Manhã", almoco: "Almoço",
  lanche_da_tarde: "Lanche da Tarde", jantar: "Jantar", ceia: "Ceia",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  inativo: { label: "Inativo", variant: "secondary" },
  rascunho: { label: "Rascunho", variant: "outline" },
};

interface Props {
  paciente: any;
}

export function PlanoAlimentarSection({ paciente }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refeicoes, setRefeicoes] = useState<Record<string, any[]>>({});
  const [editingPlanoId, setEditingPlanoId] = useState<string | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportPlano, setExportPlano] = useState<any>(null);
  const [exportType, setExportType] = useState<"plano_alimentar" | "plano_simplificado">("plano_alimentar");

  useEffect(() => { loadPlanos(); }, [paciente.id]);

  const loadPlanos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("planos_alimentares")
      .select("*")
      .eq("paciente_id", paciente.id)
      .eq("is_template", false)
      .order("created_at", { ascending: false });
    setPlanos(data || []);
    setLoading(false);
  };

  const toggleExpand = async (planoId: string) => {
    if (expanded === planoId) { setExpanded(null); return; }
    setExpanded(planoId);
    if (!refeicoes[planoId]) {
      const { data: refs } = await supabase
        .from("refeicoes")
        .select("*, alimentos_plano(*)")
        .eq("plano_id", planoId)
        .order("ordem", { ascending: true });
      setRefeicoes(prev => ({ ...prev, [planoId]: refs || [] }));
    }
  };

  const duplicatePlano = async (plano: any) => {
    if (!user) return;
    try {
      const { data: newPlano, error } = await supabase.from("planos_alimentares").insert({
        user_id: user.id, paciente_id: paciente.id,
        nome: `${plano.nome} (cópia)`, observacoes: plano.observacoes,
        status: "rascunho", is_template: false,
      }).select("id").single();
      if (error) throw error;

      const { data: refs } = await supabase.from("refeicoes")
        .select("*, alimentos_plano(*)").eq("plano_id", plano.id);
      if (refs) {
        for (const ref of refs) {
          const { data: newRef } = await supabase.from("refeicoes").insert({
            plano_id: newPlano.id, tipo: ref.tipo, ordem: ref.ordem,
            observacoes: ref.observacoes, substituicoes_sugeridas: ref.substituicoes_sugeridas,
          }).select("id").single();
          if (newRef && ref.alimentos_plano?.length) {
            await supabase.from("alimentos_plano").insert(
              ref.alimentos_plano.map((a: any) => ({
                refeicao_id: newRef.id, nome_alimento: a.nome_alimento,
                quantidade: a.quantidade, medida_caseira: a.medida_caseira,
                energia_kcal: a.energia_kcal, proteina_g: a.proteina_g,
                carboidrato_g: a.carboidrato_g, lipidio_g: a.lipidio_g,
                fibra_g: a.fibra_g, alimento_taco_id: a.alimento_taco_id,
              }))
            );
          }
        }
      }
      toast({ title: "Plano duplicado!" });
      loadPlanos();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (plano: any) => {
    const newStatus = plano.status === "ativo" ? "inativo" : "ativo";
    await supabase.from("planos_alimentares").update({ status: newStatus } as any).eq("id", plano.id);
    toast({ title: `Plano ${newStatus === "ativo" ? "ativado" : "desativado"}!` });
    loadPlanos();
  };

  const deletePlano = async () => {
    if (!deleteId) return;
    await supabase.from("planos_alimentares").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Plano excluído." });
    loadPlanos();
  };

  if (editingPlanoId !== null) {
    return (
      <PlanoAlimentarEditor
        pacienteId={paciente.id}
        planoId={editingPlanoId === "new" ? undefined : editingPlanoId}
        onBack={() => { setEditingPlanoId(null); loadPlanos(); }}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando planos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Planos Alimentares</h3>
        <Button size="sm" onClick={() => setEditingPlanoId("new")}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Novo Plano
        </Button>
      </div>

      {planos.length === 0 ? (
        <Card className="border-border rounded-xl">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano alimentar cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        planos.map(plano => {
          const st = statusLabels[(plano as any).status] || statusLabels.rascunho;
          return (
            <Card key={plano.id} className="border-border rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{plano.nome}</CardTitle>
                    <Badge variant={st.variant} className="text-xs shrink-0">{st.label}</Badge>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {new Date(plano.created_at).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => setEditingPlanoId(plano.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={() => duplicatePlano(plano)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={plano.status === "ativo" ? "Desativar" : "Ativar"} onClick={() => toggleStatus(plano)}>
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => setDeleteId(plano.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {plano.observacoes && <p className="text-xs text-muted-foreground mt-1">{plano.observacoes}</p>}
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => toggleExpand(plano.id)}>
                  {expanded === plano.id ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {expanded === plano.id ? "Recolher" : "Ver refeições"}
                </Button>
                {expanded === plano.id && refeicoes[plano.id] && (
                  <div className="mt-3 space-y-3">
                    {refeicoes[plano.id].map((ref: any) => {
                      const alimentos = ref.alimentos_plano || [];
                      const totalKcal = alimentos.reduce((a: number, al: any) => a + (al.energia_kcal || 0), 0);
                      return (
                        <div key={ref.id} className="border border-border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">{tipoRefeicaoLabels[ref.tipo] || ref.tipo}</span>
                            <span className="text-xs text-muted-foreground">{Math.round(totalKcal)} kcal</span>
                          </div>
                          {alimentos.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sem alimentos cadastrados.</p>
                          ) : (
                            <div className="space-y-1">
                              {alimentos.map((al: any) => (
                                <div key={al.id} className="flex justify-between text-xs">
                                  <span>{al.nome_alimento} — {al.quantidade}g ({al.medida_caseira})</span>
                                  <span className="text-muted-foreground">{Math.round(al.energia_kcal || 0)} kcal</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano alimentar?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as refeições e alimentos deste plano serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletePlano} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
