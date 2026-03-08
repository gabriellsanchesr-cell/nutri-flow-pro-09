import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "nutri" | "paciente" | "equipe" | null;

interface EquipePermissoes {
  [modulo: string]: { [permissao: string]: boolean };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: AppRole;
  isNutri: boolean;
  isAdmin: boolean;
  isEquipe: boolean;
  isPaciente: boolean;
  equipePermissoes: EquipePermissoes;
  equipeMembro: any;
  hasPermission: (modulo: string, permissao: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  role: null,
  isNutri: false,
  isAdmin: false,
  isEquipe: false,
  isPaciente: false,
  equipePermissoes: {},
  equipeMembro: null,
  hasPermission: () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [equipePermissoes, setEquipePermissoes] = useState<EquipePermissoes>({});
  const [equipeMembro, setEquipeMembro] = useState<any>(null);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_user_role", { _user_id: userId });
      if (!error && data) {
        const r = data as AppRole;
        setRole(r);
        if (r === "equipe") {
          const { data: membro } = await supabase
            .from("equipe_membros")
            .select("*")
            .eq("auth_user_id", userId)
            .single();
          if (membro) {
            setEquipeMembro(membro);
            setEquipePermissoes((membro as any).permissoes || {});
          }
        } else {
          setEquipeMembro(null);
          setEquipePermissoes({});
        }
      } else {
        setRole(null);
      }
    } catch {
      setRole(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchRole(session.user.id);
        } else {
          setRole(null);
          setEquipeMembro(null);
          setEquipePermissoes({});
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setEquipeMembro(null);
    setEquipePermissoes({});
  };

  const hasPermission = (modulo: string, permissao: string): boolean => {
    if (role === "nutri") return true;
    if (role !== "equipe") return false;
    return !!equipePermissoes?.[modulo]?.[permissao];
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      role,
      isNutri: role === "nutri",
      isAdmin: role === "nutri",
      isEquipe: role === "equipe",
      isPaciente: role === "paciente",
      equipePermissoes,
      equipeMembro,
      hasPermission,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
