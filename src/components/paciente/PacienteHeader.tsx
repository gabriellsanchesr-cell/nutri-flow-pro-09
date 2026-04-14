import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound, UserX, UserCheck, Trash2, Pencil } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const faseLabels: Record<string, { label: string; color: string }> = {
  rotina: { label: "Rotina", color: "bg-primary/10 text-primary border-primary/20" },
  estrategia: { label: "Estratégia", color: "bg-warning/10 text-warning border-warning/20" },
  autonomia: { label: "Autonomia", color: "bg-success/10 text-success border-success/20" },
  liberdade: { label: "Liberdade", color: "bg-accent text-accent-foreground border-accent" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success border-success/20" },
  desativado: { label: "Inativo", color: "bg-destructive/10 text-destructive border-destructive/20" },
  sem_conta: { label: "Sem Conta", color: "bg-muted text-muted-foreground border-border" },
};

const accessLabels: Record<string, { label: string; color: string }> = {
  ativo: { label: "Com Conta", color: "bg-primary/10 text-primary border-primary/20" },
  desativado: { label: "Conta Inativa", color: "bg-warning/10 text-warning border-warning/20" },
  sem_conta: { label: "Sem Conta", color: "bg-muted text-muted-foreground border-border" },
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface PacienteHeaderProps {
  paciente: any;
  activeSection: string;
  sectionLabel: string;
  onCreateAccess: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDelete: () => void;
  onEdit: () => void;
  actionLoading: boolean;
}

export function PacienteHeader({
  paciente, activeSection, sectionLabel,
  onCreateAccess, onDeactivate, onReactivate, onDelete, onEdit,
  actionLoading,
}: PacienteHeaderProps) {
  const navigate = useNavigate();
  const status = paciente.account_status || "sem_conta";
  const fase = paciente.fase_real || "rotina";
  const age = useMemo(() => calcAge(paciente.data_nascimento), [paciente.data_nascimento]);
  const faseCfg = faseLabels[fase] || faseLabels.rotina;
  const isAtivo = paciente.ativo !== false;
  const statusCfg = isAtivo ? statusLabels.ativo : statusLabels.desativado;
  const accessCfg = accessLabels[status] || accessLabels.sem_conta;

  return (
    <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
      <div className="px-6 pt-4 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); navigate("/pacientes"); }}>
                Pacientes
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                {paciente.nome_completo}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sectionLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="px-6 pb-4 flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0 shadow-md">
          {getInitials(paciente.nome_completo)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground truncate">{paciente.nome_completo}</h1>
            {age !== null && <span className="text-sm text-muted-foreground">{age} anos</span>}
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${faseCfg.color}`}>
              {faseCfg.label}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${accessCfg.color}`}>
              {accessCfg.label}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap shrink-0">
          <Button size="sm" variant="outline" onClick={onEdit} className="rounded-lg">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          {status === "sem_conta" && (
            <Button size="sm" onClick={onCreateAccess} className="rounded-lg">
              <KeyRound className="h-3.5 w-3.5 mr-1" /> Criar Acesso
            </Button>
          )}
          {status === "ativo" && (
            <Button size="sm" variant="outline" onClick={onDeactivate} disabled={actionLoading} className="rounded-lg">
              <UserX className="h-3.5 w-3.5 mr-1" /> Desativar
            </Button>
          )}
          {status === "desativado" && (
            <Button size="sm" variant="outline" onClick={onReactivate} disabled={actionLoading} className="rounded-lg">
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Reativar
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete} className="rounded-lg">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}
