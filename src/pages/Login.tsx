import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle, ExternalLink, ArrowDown } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const loginRef = useRef<HTMLDivElement>(null);

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

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    "Plano alimentar personalizado",
    "Evolução e resultados",
    "Diário alimentar",
    "Receitas e orientações",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/30 overflow-y-auto">
      {/* Decorative blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12 gap-12">
        {/* Hero Section */}
        <section className="w-full max-w-lg text-center animate-fade-in space-y-6">
          <img src="/logo.png" alt="Gabriel Sanches" className="h-24 mx-auto drop-shadow-sm" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bem-vindos!</h1>
            <p className="text-muted-foreground mt-2 text-base leading-relaxed">
              Acesse aqui tudo sobre seu acompanhamento nutricional e evolução!
            </p>
          </div>

          <ul className="space-y-3 text-left mx-auto max-w-xs">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button onClick={scrollToLogin} size="lg" className="rounded-xl font-semibold gap-2">
            Acessar meu portal <ArrowDown className="h-4 w-4" />
          </Button>
        </section>

        {/* Login Card */}
        <section ref={loginRef} className="w-full max-w-md animate-fade-in">
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-card/95 rounded-2xl">
            <CardHeader className="text-center space-y-1 pb-2">
              <CardTitle className="text-xl font-bold text-foreground">Acesse seu portal</CardTitle>
              <CardDescription>Entre com seu e-mail e senha</CardDescription>
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
            </CardContent>
          </Card>
        </section>

        {/* Footer CTA */}
        <section className="text-center pb-8 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">Ainda não é paciente?</p>
          <a
            href="https://www.gabrielnutri.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Conheça meu trabalho <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      </div>
    </div>
  );
}
