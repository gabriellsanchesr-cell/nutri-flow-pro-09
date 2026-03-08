import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PORTAL_FEATURES = [
  { key: "plano_alimentar", label: "Acesso ao plano alimentar" },
  { key: "checkin_semanal", label: "Acesso ao check-in semanal" },
  { key: "diario_alimentar", label: "Acesso ao diário alimentar" },
  { key: "chat", label: "Acesso ao chat com o nutricionista" },
  { key: "metas", label: "Acesso às metas" },
  { key: "receituario", label: "Acesso ao receituário" },
  { key: "materiais", label: "Acesso a materiais extras" },
  { key: "avaliacoes_fisicas", label: "Acesso às avaliações físicas" },
  { key: "evolucao_fotografica", label: "Acesso à evolução fotográfica" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
}

export function PortalPermissoesModal({ open, onOpenChange, paciente }: Props) {
  const { toast } = useToast();
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!paciente?.id || !open) return;
    const load = async () => {
      const { data } = await supabase
        .from("paciente_portal_permissoes")
        .select("*")
        .eq("paciente_id", paciente.id)
        .single();
      if (data) {
        const p: Record<string, boolean> = {};
        PORTAL_FEATURES.forEach(f => { p[f.key] = (data as any)[f.key] ?? true; });
        setPerms(p);
      } else {
        const defaults: Record<string, boolean> = {};
        PORTAL_FEATURES.forEach(f => { defaults[f.key] = true; });
        setPerms(defaults);
      }
      setInitialLoad(false);
    };
    load();
  }, [paciente?.id, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("paciente_portal_permissoes")
        .upsert({
          paciente_id: paciente.id,
          ...perms,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "paciente_id" });
      if (error) throw error;
      toast({ title: "Sucesso", description: "Permissões do portal atualizadas." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Permissões do Portal — {paciente?.nome_completo}</DialogTitle>
        </DialogHeader>
        {initialLoad ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {PORTAL_FEATURES.map(f => (
              <div key={f.key} className="flex items-center justify-between">
                <Label className="text-sm">{f.label}</Label>
                <Switch
                  checked={perms[f.key] ?? true}
                  onCheckedChange={(v) => setPerms(prev => ({ ...prev, [f.key]: v }))}
                />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
