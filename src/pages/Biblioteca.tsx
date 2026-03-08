import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRightLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const grupoLabels: Record<string, string> = {
  cereais: "Cereais", verduras: "Verduras", frutas: "Frutas", leguminosas: "Leguminosas",
  oleaginosas: "Oleaginosas", carnes: "Carnes", leites: "Leites", ovos: "Ovos",
  oleos: "Óleos", acucares: "Açúcares", outros: "Outros",
};

export default function Biblioteca() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ grupo: "cereais", alimento_original: "", alimento_substituto: "", observacoes: "" });

  useEffect(() => {
    if (user) loadSubs();
  }, [user]);

  const loadSubs = async () => {
    const { data } = await supabase.from("substituicoes").select("*").order("grupo");
    setSubs(data || []);
  };

  const createSub = async () => {
    if (!user) return;
    const { error } = await supabase.from("substituicoes").insert({
      user_id: user.id,
      grupo: form.grupo as any,
      alimento_original: form.alimento_original,
      alimento_substituto: form.alimento_substituto,
      observacoes: form.observacoes || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Substituição adicionada!" });
      setDialogOpen(false);
      setForm({ grupo: "cereais", alimento_original: "", alimento_substituto: "", observacoes: "" });
      loadSubs();
    }
  };

  const deleteSub = async (id: string) => {
    await supabase.from("substituicoes").delete().eq("id", id);
    loadSubs();
  };

  const grouped = subs.reduce((acc, s) => {
    (acc[s.grupo] = acc[s.grupo] || []).push(s);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Biblioteca de Substituições</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Substituição</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Substituição</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Grupo Alimentar</Label>
                <Select value={form.grupo} onValueChange={(v) => setForm((f) => ({ ...f, grupo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(grupoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alimento Original *</Label>
                <Input value={form.alimento_original} onChange={(e) => setForm((f) => ({ ...f, alimento_original: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Substituto *</Label>
                <Input value={form.alimento_substituto} onChange={(e) => setForm((f) => ({ ...f, alimento_substituto: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <Button onClick={createSub} className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([grupo, items]) => (
        <Card key={grupo}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="secondary">{grupoLabels[grupo] || grupo}</Badge>
              <span className="text-xs text-muted-foreground">{(items as any[]).length} substituições</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(items as any[]).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{s.alimento_original}</span>
                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                    <span>{s.alimento_substituto}</span>
                    {s.observacoes && <span className="text-xs text-muted-foreground">({s.observacoes})</span>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSub(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {subs.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Nenhuma substituição cadastrada ainda</p>
      )}
    </div>
  );
}
