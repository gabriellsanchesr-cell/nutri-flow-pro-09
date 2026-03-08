import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PERMISSION_MODULES, PERMISSION_PRESETS } from "./permissionPresets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: any;
  onSuccess: () => void;
}

export function PermissoesModal({ open, onOpenChange, membro, onSuccess }: Props) {
  const { toast } = useToast();
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [acessoTodos, setAcessoTodos] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (membro) {
      setPerms(membro.permissoes || {});
      setAcessoTodos(membro.acesso_todos_pacientes ?? true);
    }
  }, [membro]);

  const toggle = (modulo: string, perm: string) => {
    setPerms(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [perm]: !(prev[modulo]?.[perm] ?? false) },
    }));
  };

  const applyPreset = (preset: string) => {
    if (PERMISSION_PRESETS[preset]) {
      setPerms(JSON.parse(JSON.stringify(PERMISSION_PRESETS[preset])));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-team-auth", {
        body: {
          action: "update",
          membro_id: membro.id,
          permissoes: perms,
          acesso_todos_pacientes: acessoTodos,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Sucesso", description: "Permissões atualizadas." });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Permissões — {membro?.nome_completo}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={() => applyPreset("nutricionista_assistente")}>Nutri Assistente</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("secretaria")}>Secretária</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("estagiario")}>Estagiário</Button>
        </div>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4">
            {/* Patient access scope */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Acesso a Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={acessoTodos ? "todos" : "atribuidos"} onValueChange={(v) => setAcessoTodos(v === "todos")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="todos" id="todos" />
                    <Label htmlFor="todos" className="text-sm">Todos os pacientes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="atribuidos" id="atribuidos" />
                    <Label htmlFor="atribuidos" className="text-sm">Apenas pacientes atribuídos</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {Object.entries(PERMISSION_MODULES).map(([moduleKey, mod]) => (
              <Card key={moduleKey}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{mod.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mod.permissions.map((p) => (
                    <div key={p.key} className="flex items-center justify-between">
                      <Label className="text-sm text-foreground">{p.label}</Label>
                      <Switch
                        checked={perms[moduleKey]?.[p.key] ?? false}
                        onCheckedChange={() => toggle(moduleKey, p.key)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar Permissões"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
