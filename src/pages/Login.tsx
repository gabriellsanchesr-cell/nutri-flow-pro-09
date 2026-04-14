import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, Apple, Lock, ArrowLeft, ExternalLink } from "lucide-react";

type View = "selection" | "patient-login";

export default function Login() {
  const [view, setView] = useState<View>("selection");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      let message = "E-mail ou senha incorretos.";
      if (error.message?.toLowerCase().includes("banned") || error.message?.toLowerCase().includes("ban")) {
        message = "Seu acesso está temporariamente suspenso. Entre em contato com seu nutricionista.";
      }
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {view === "selection" ? (
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Gabriel Sanches" className="h-20 mx-auto drop-shadow-sm mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Bem-vindos!</h1>
            <p className="text-muted-foreground mt-1">Acesse aqui tudo sobre seu acompanhamento nutricional e evolução!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sou Paciente */}
            <Card
              className="cursor-pointer border-0 backdrop-blur-sm bg-card/95 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              onClick={() => setView("patient-login")}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Apple className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-foreground">Sou Paciente</h2>
                  <p className="text-sm text-muted-foreground mt-1">Acesse seu portal de acompanhamento</p>
                </div>
                <Button className="w-full rounded-xl font-semibold">Entrar</Button>
              </CardContent>
            </Card>

            {/* Sou Nutricionista — disabled */}
            <Card className="border-0 backdrop-blur-sm bg-card/95 rounded-2xl shadow-lg opacity-50 cursor-not-allowed select-none">
              <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-foreground">Sou Nutricionista</h2>
                  <p className="text-sm text-muted-foreground mt-1">Acesso interno</p>
                </div>
                <Button className="w-full rounded-xl font-semibold" disabled>Bloqueado</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm bg-card/95 animate-fade-in rounded-2xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <button
              onClick={() => setView("selection")}
              className="absolute top-4 left-4 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src="/logo.png" alt="Gabriel Sanches" className="h-16 mx-auto drop-shadow-sm" />
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Login do Paciente</CardTitle>
              <CardDescription className="mt-1">Acesse seu portal de acompanhamento</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/esqueci-senha" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t text-center">
              <p className="text-sm text-muted-foreground mb-2">Ainda não é paciente?</p>
              <a
                href="https://www.gabrielnutri.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Conheça meu trabalho <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
