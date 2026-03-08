import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Shield, Power, Trash2 } from "lucide-react";
import { AddMembroModal } from "./AddMembroModal";
import { PermissoesModal } from "./PermissoesModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

const funcaoLabels: Record<string, string> = {
  nutricionista_assistente: "Nutricionista Assistente",
  secretaria: "Secretária",
  estagiario: "Estagiário",
  personalizado: "Personalizado",
};

const funcaoBadgeClass: Record<string, string> = {
  nutricionista_assistente: "bg-blue-50 text-blue-700 border-blue-200",
  secretaria: "bg-purple-50 text-purple-700 border-purple-200",
  estagiario: "bg-slate-100 text-slate-700 border-slate-200",
  personalizado: "bg-muted text-muted-foreground border-border",
};

export function EquipeTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [membros, setMembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editMembro, setEditMembro] = useState<any>(null);
  const [permMembro, setPermMembro] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from("equipe_membros").select("*").order("created_at", { ascending: false });
    setMembros((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAtivo = async (membro: any) => {
    try {
      const action = membro.ativo ? "deactivate" : "reactivate";
      const { data, error } = await supabase.functions.invoke("manage-team-auth", {
        body: { action, membro_id: membro.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Sucesso", description: membro.ativo ? "Membro desativado." : "Membro reativado." });
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-team-auth", {
        body: { action: "delete", membro_id: deleteTarget.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Sucesso", description: "Membro excluído." });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{membros.length} membro(s) na equipe</p>
        <Button onClick={() => { setEditMembro(null); setAddOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Membro
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : membros.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum membro cadastrado</TableCell></TableRow>
            ) : membros.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {m.nome_completo?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={funcaoBadgeClass[m.funcao] || funcaoBadgeClass.personalizado}>
                    {m.funcao === "personalizado" && m.funcao_personalizada
                      ? m.funcao_personalizada
                      : funcaoLabels[m.funcao] || m.funcao}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={m.ativo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}>
                    {m.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditMembro(m); setAddOpen(true); }} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPermMembro(m)} title="Permissões">
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleAtivo(m)} title={m.ativo ? "Desativar" : "Reativar"}>
                      <Power className={`h-4 w-4 ${m.ativo ? "text-emerald-600" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(m)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddMembroModal open={addOpen} onOpenChange={setAddOpen} membro={editMembro} onSuccess={load} />
      {permMembro && <PermissoesModal open={!!permMembro} onOpenChange={(o) => !o && setPermMembro(null)} membro={permMembro} onSuccess={load} />}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir membro da equipe"
        description={`Tem certeza que deseja excluir ${deleteTarget?.nome_completo}? Esta ação é irreversível.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
