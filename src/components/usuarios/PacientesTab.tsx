import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, KeyRound, Power, Shield, Trash2, Plus } from "lucide-react";
import { PacienteAccessModal } from "@/components/PacienteAccessModal";
import { PortalPermissoesModal } from "./PortalPermissoesModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusBadge: Record<string, string> = {
  ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  desativado: "bg-muted text-muted-foreground",
  sem_conta: "bg-amber-50 text-amber-700 border-amber-200",
};

const faseLabels: Record<string, string> = {
  rotina: "Rotina", estrategia: "Estratégia", autonomia: "Autonomia", liberdade: "Liberdade",
};

export function PacientesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterFase, setFilterFase] = useState("todos");
  const [accessModal, setAccessModal] = useState<{ pac: any; mode: "create" | "edit" } | null>(null);
  const [portalPermsTarget, setPortalPermsTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from("pacientes").select("*").order("nome_completo");
    setPacientes((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = pacientes.filter(p => {
    const matchSearch = !search || p.nome_completo?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
    const status = p.account_status || "sem_conta";
    const matchStatus = filterStatus === "todos" || status === filterStatus;
    const matchFase = filterFase === "todos" || p.fase_real === filterFase;
    return matchSearch && matchStatus && matchFase;
  });

  const toggleAtivo = async (pac: any) => {
    if (!pac.auth_user_id) return;
    const action = pac.account_status === "ativo" ? "deactivate" : "reactivate";
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", {
        body: { action, paciente_id: pac.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Sucesso", description: action === "deactivate" ? "Acesso desativado." : "Acesso reativado." });
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", {
        body: { action: "delete", paciente_id: deleteTarget.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Sucesso", description: "Paciente excluído." });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="desativado">Inativo</SelectItem>
              <SelectItem value="sem_conta">Sem conta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFase} onValueChange={setFilterFase}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Fase" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="rotina">Rotina</SelectItem>
              <SelectItem value="estrategia">Estratégia</SelectItem>
              <SelectItem value="autonomia">Autonomia</SelectItem>
              <SelectItem value="liberdade">Liberdade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate("/pacientes/novo")} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Paciente
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado</TableCell></TableRow>
            ) : filtered.map((p) => {
              const status = p.account_status || "sem_conta";
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {p.nome_completo?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{p.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">{p.email || "Sem e-mail"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.fase_real ? <Badge variant="outline">{faseLabels[p.fase_real] || p.fase_real}</Badge> : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadge[status] || statusBadge.sem_conta}>
                      {status === "ativo" ? "Ativo" : status === "desativado" ? "Inativo" : "Sem conta"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(p.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/pacientes/${p.id}`)} title="Ver perfil">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {status === "sem_conta" ? (
                        <Button variant="ghost" size="icon" onClick={() => setAccessModal({ pac: p, mode: "create" })} title="Criar acesso">
                          <KeyRound className="h-4 w-4 text-amber-600" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => setAccessModal({ pac: p, mode: "edit" })} title="Editar acesso">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleAtivo(p)} title={status === "ativo" ? "Desativar" : "Reativar"}>
                            <Power className={`h-4 w-4 ${status === "ativo" ? "text-emerald-600" : "text-muted-foreground"}`} />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setPortalPermsTarget(p)} title="Permissões do portal">
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {accessModal && (
        <PacienteAccessModal
          open
          onOpenChange={() => setAccessModal(null)}
          pacienteId={accessModal.pac.id}
          pacienteNome={accessModal.pac.nome_completo}
          pacienteEmail={accessModal.pac.email}
          mode={accessModal.mode}
          onSuccess={load}
        />
      )}
      {portalPermsTarget && (
        <PortalPermissoesModal open onOpenChange={() => setPortalPermsTarget(null)} paciente={portalPermsTarget} />
      )}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir paciente"
        description={`Tem certeza que deseja excluir ${deleteTarget?.nome_completo}? Todos os dados serão perdidos permanentemente.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
