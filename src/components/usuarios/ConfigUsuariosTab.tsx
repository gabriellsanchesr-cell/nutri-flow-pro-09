import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigUsuariosTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    expiracao_sessao_admin: 12,
    expiracao_sessao_equipe: 24,
    expiracao_sessao_paciente: 168,
    tentativas_login: 5,
    tempo_bloqueio: 15,
    forcar_troca_senha: true,
    enviar_email_boas_vindas: true,
    equipe_pode_criar_pacientes: false,
    equipe_pode_criar_acessos: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("configuracoes_usuarios")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setConfig({
          expiracao_sessao_admin: (data as any).expiracao_sessao_admin ?? 12,
          expiracao_sessao_equipe: (data as any).expiracao_sessao_equipe ?? 24,
          expiracao_sessao_paciente: (data as any).expiracao_sessao_paciente ?? 168,
          tentativas_login: (data as any).tentativas_login ?? 5,
          tempo_bloqueio: (data as any).tempo_bloqueio ?? 15,
          forcar_troca_senha: (data as any).forcar_troca_senha ?? true,
          enviar_email_boas_vindas: (data as any).enviar_email_boas_vindas ?? true,
          equipe_pode_criar_pacientes: (data as any).equipe_pode_criar_pacientes ?? false,
          equipe_pode_criar_acessos: (data as any).equipe_pode_criar_acessos ?? false,
        });
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("configuracoes_usuarios")
        .upsert({
          user_id: user.id,
          ...config,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "Sucesso", description: "Configurações salvas." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateNum = (key: string, val: string) => {
    setConfig(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  const toggleBool = (key: string) => {
    setConfig(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  return (
    <div className="space-y-6 mt-4 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Expiração de Sessão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Admin (horas)</Label>
              <Input type="number" value={config.expiracao_sessao_admin} onChange={e => updateNum("expiracao_sessao_admin", e.target.value)} min={1} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Equipe (horas)</Label>
              <Input type="number" value={config.expiracao_sessao_equipe} onChange={e => updateNum("expiracao_sessao_equipe", e.target.value)} min={1} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Paciente (horas)</Label>
              <Input type="number" value={config.expiracao_sessao_paciente} onChange={e => updateNum("expiracao_sessao_paciente", e.target.value)} min={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Segurança de Login</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Tentativas antes de bloquear</Label>
              <Input type="number" value={config.tentativas_login} onChange={e => updateNum("tentativas_login", e.target.value)} min={1} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tempo de bloqueio (min)</Label>
              <Input type="number" value={config.tempo_bloqueio} onChange={e => updateNum("tempo_bloqueio", e.target.value)} min={1} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Forçar troca de senha no primeiro acesso</Label>
            <Switch checked={config.forcar_troca_senha} onCheckedChange={() => toggleBool("forcar_troca_senha")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Permissões da Equipe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enviar e-mail de boas-vindas automaticamente</Label>
            <Switch checked={config.enviar_email_boas_vindas} onCheckedChange={() => toggleBool("enviar_email_boas_vindas")} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Permitir que equipe crie pacientes</Label>
            <Switch checked={config.equipe_pode_criar_pacientes} onCheckedChange={() => toggleBool("equipe_pode_criar_pacientes")} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Permitir que equipe crie acessos ao portal</Label>
            <Switch checked={config.equipe_pode_criar_acessos} onCheckedChange={() => toggleBool("equipe_pode_criar_acessos")} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
