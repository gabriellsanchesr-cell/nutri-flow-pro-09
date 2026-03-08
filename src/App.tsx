import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import PacienteForm from "./pages/PacienteForm";
import PacienteDetalhe from "./pages/PacienteDetalhe";
import AnamnesePublica from "./pages/AnamnesePublica";
import QuestionarioPublico from "./pages/QuestionarioPublico";
import Planos from "./pages/Planos";
import Acompanhamento from "./pages/Acompanhamento";
import Agenda from "./pages/Agenda";
import Biblioteca from "./pages/Biblioteca";
import Templates from "./pages/Templates";
import MeuPainel from "./pages/MeuPainel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (session && role === "paciente") return <Navigate to="/meu-painel" replace />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function NutriRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (role === "paciente") return <Navigate to="/meu-painel" replace />;
  return <>{children}</>;
}

function PacienteRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (role === "nutri") return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/esqueci-senha" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/meu-painel" element={<PacienteRoute><MeuPainel /></PacienteRoute>} />
            <Route path="/" element={<NutriRoute><AppLayout /></NutriRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/novo" element={<PacienteForm />} />
              <Route path="pacientes/:id" element={<PacienteDetalhe />} />
              <Route path="planos" element={<Planos />} />
              <Route path="acompanhamento" element={<Acompanhamento />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="biblioteca" element={<Biblioteca />} />
              <Route path="templates" element={<Templates />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
