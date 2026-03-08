import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Pencil, Trash2, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PacienteAccessModal } from "@/components/PacienteAccessModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  desativado: { label: "Inativo", variant: "destructive" },
  sem_conta: { label: "Sem conta", variant: "outline" },
};

export default function Pacientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Modal states
  const [accessModal, setAccessModal] = useState<{ open: boolean; paciente: any; mode: "create" | "edit" }>({
    open: false, paciente: null, mode: "create",
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; paciente: any }>({
    open: false, paciente: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) loadPacientes();
  }, [user]);

  const loadPacientes = async () => {
    const { data } = await supabase
      .from("pacientes")
      .select("*")
      .order("nome_completo");
    setPacientes(data || []);
  };

  const filtered = pacientes.filter((p) => {
    const matchBusca = p.nome_completo.toLowerCase().includes(busca.toLowerCase());
    const status = p.account_status || "sem_conta";
    const matchStatus = filtroStatus === "todos" || status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleAction = async (action: "deactivate" | "reactivate", paciente: any) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", {
        body: { action, paciente_id: paciente.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: action === "deactivate" ? "Acesso desativado." : "Acesso reativado." });
      loadPacientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.paciente) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", {
        body: { action: "delete", paciente_id: deleteModal.paciente.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: "Paciente excluído permanentemente." });
      setDeleteModal({ open: false, paciente: null });
      loadPacientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button onClick={() => navigate("/pacientes/novo")}>
          <Plus className="h-4 w-4 mr-2" /> Novo Paciente
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1">
          {["todos", "ativo", "desativado", "sem_conta"].map((s) => (
            <Button
              key={s}
              variant={filtroStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus(s)}
            >
              {s === "todos" ? "Todos" : statusConfig[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const status = p.account_status || "sem_conta";
              const cfg = statusConfig[status] || statusConfig.sem_conta;
              return (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                  <TableCell className="font-medium">{p.nome_completo}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy") : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status === "sem_conta" && (
                          <DropdownMenuItem onClick={() => setAccessModal({ open: true, paciente: p, mode: "create" })}>
                            <KeyRound className="h-4 w-4 mr-2" /> Criar Acesso
                          </DropdownMenuItem>
                        )}
                        {status === "ativo" && (
                          <>
                            <DropdownMenuItem onClick={() => setAccessModal({ open: true, paciente: p, mode: "edit" })}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar Acesso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("deactivate", p)}>
                              <UserX className="h-4 w-4 mr-2" /> Desativar
                            </DropdownMenuItem>
                          </>
                        )}
                        {status === "desativado" && (
                          <DropdownMenuItem onClick={() => handleAction("reactivate", p)}>
                            <UserCheck className="h-4 w-4 mr-2" /> Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteModal({ open: true, paciente: p })}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {accessModal.paciente && (
        <PacienteAccessModal
          open={accessModal.open}
          onOpenChange={(v) => setAccessModal((s) => ({ ...s, open: v }))}
          pacienteId={accessModal.paciente.id}
          pacienteNome={accessModal.paciente.nome_completo}
          pacienteEmail={accessModal.paciente.email}
          mode={accessModal.mode}
          onSuccess={loadPacientes}
        />
      )}

      {deleteModal.paciente && (
        <DeleteConfirmModal
          open={deleteModal.open}
          onOpenChange={(v) => setDeleteModal((s) => ({ ...s, open: v }))}
          pacienteNome={deleteModal.paciente.nome_completo}
          onConfirm={handleDelete}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
