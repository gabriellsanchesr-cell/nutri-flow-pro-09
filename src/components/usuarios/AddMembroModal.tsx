import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PERMISSION_PRESETS } from "./permissionPresets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: any | null;
  onSuccess: () => void;
}

export function AddMembroModal({ open, onOpenChange, membro, onSuccess }: Props) {
  const isEdit = !!membro;
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [funcao, setFuncao] = useState("personalizado");
  const [funcaoPersonalizada, setFuncaoPersonalizada] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (membro) {
      setNome(membro.nome_completo || "");
      setEmail(membro.email || "");
      setTelefone(membro.telefone || "");
      setFuncao(membro.funcao || "personalizado");
      setFuncaoPersonalizada(membro.funcao_personalizada || "");
      setPassword("");
    } else {
      setNome(""); setEmail(""); setPassword(""); setTelefone("");
      setFuncao("personalizado"); setFuncaoPersonalizada("");
    }
  }, [membro, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const preset = PERMISSION_PRESETS[funcao] || {};
      const payload: any = {
        action: isEdit ? "update" : "create",
        nome_completo: nome,
        email,
        telefone,
        funcao,
        funcao_personalizada: funcao === "personalizado" ? funcaoPersonalizada : null,
      };
      if (isEdit) {
        payload.membro_id = membro.id;
        if (password) payload.password = password;
      } else {
        payload.password = password;
        payload.permissoes = preset;
        payload.acesso_todos_pacientes = funcao === "nutricionista_assistente";
      }

      const { data, error } = await supabase.functions.invoke("manage-team-auth", { body: payload });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Sucesso", description: isEdit ? "Membro atualizado." : "Membro adicionado." });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Membro" : "Adicionar Membro à Equipe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!isEdit} />
          </div>
          <div className="space-y-2">
            <Label>{isEdit ? "Nova senha (deixe vazio para manter)" : "Senha inicial *"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEdit} minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Função *</Label>
            <Select value={funcao} onValueChange={setFuncao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nutricionista_assistente">Nutricionista Assistente</SelectItem>
                <SelectItem value="secretaria">Secretária</SelectItem>
                <SelectItem value="estagiario">Estagiário</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {funcao === "personalizado" && (
            <div className="space-y-2">
              <Label>Nome da função</Label>
              <Input value={funcaoPersonalizada} onChange={(e) => setFuncaoPersonalizada(e.target.value)} placeholder="Ex: Assistente de atendimento" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : isEdit ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
