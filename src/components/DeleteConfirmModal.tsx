import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({ open, onOpenChange, pacienteNome, onConfirm, loading }: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const canConfirm = confirmText.toLowerCase() === pacienteNome.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmText(""); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Paciente</DialogTitle>
          <DialogDescription>
            Tem certeza? Esta ação não pode ser desfeita. Todos os dados do paciente serão removidos permanentemente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Digite <strong>{pacienteNome}</strong> para confirmar:</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={pacienteNome} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={!canConfirm || loading} onClick={onConfirm}>
            {loading ? "Excluindo..." : "Excluir permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
