import { cn } from "@/lib/utils";
import {
  LayoutDashboard, User, ClipboardList, TrendingUp, Camera, Utensils,
  Calculator, CalendarDays, FileQuestion, TestTube, BookOpen, FileText, KeyRound,
  ChevronDown,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const sections = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "dados", label: "Dados do Paciente", icon: User },
  { id: "anamnese", label: "Anamnese", icon: ClipboardList },
  { id: "acompanhamento", label: "Acompanhamento", icon: TrendingUp },
  { id: "fotos", label: "Evolução Fotográfica", icon: Camera },
  { id: "plano", label: "Plano Alimentar", icon: Utensils },
  { id: "calculo", label: "Cálculo Energético", icon: Calculator },
  { id: "consultas", label: "Consultas", icon: CalendarDays },
  { id: "questionarios", label: "Questionários", icon: FileQuestion },
  { id: "exames", label: "Exames Laboratoriais", icon: TestTube },
  { id: "orientacoes", label: "Orientações e Materiais", icon: BookOpen },
  { id: "prontuario", label: "Prontuário", icon: FileText },
  { id: "acesso", label: "Acesso do Paciente", icon: KeyRound },
] as const;

export type SectionId = (typeof sections)[number]["id"];

interface PacienteSidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export function PacienteSidebar({ active, onSelect }: PacienteSidebarProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = sections.find(s => s.id === active)?.label || "";

  if (isMobile) {
    return (
      <div className="bg-card border-b border-border px-4 py-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="truncate">{activeLabel}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")} />
        </Button>
        {mobileOpen && (
          <div className="mt-2 space-y-0.5 pb-2">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => { onSelect(s.id); setMobileOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                    active === s.id
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="w-56 shrink-0 bg-card border-r border-border overflow-y-auto">
      <div className="py-3 px-2 space-y-0.5">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all text-left",
                isActive
                  ? "bg-primary/5 text-primary font-medium border-l-[3px] border-primary pl-[9px]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-[3px] border-transparent pl-[9px]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
