import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Activity,
  Calendar,
  BookOpen,
  FileText,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Planos Alimentares", url: "/planos", icon: Utensils },
  { title: "Acompanhamento", url: "/acompanhamento", icon: Activity },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Biblioteca", url: "/biblioteca", icon: BookOpen },
  { title: "Templates", url: "/templates", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { data } = await supabase
        .from("conversas")
        .select("nao_lidas_nutri")
        .eq("nutri_id", user.id);
      const total = (data || []).reduce((sum, c) => sum + (c.nao_lidas_nutri || 0), 0);
      setUnreadChat(total);
    };
    loadUnread();
    const channel = supabase
      .channel("sidebar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversas", filter: `nutri_id=eq.${user.id}` }, () => loadUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="NutriGabriel"
            className="h-10 w-10 rounded-lg object-contain"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-primary-foreground">
                NutriGabriel
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Gestão Nutricional
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {!collapsed && item.url === "/chat" && unreadChat > 0 && (
                        <Badge className="h-4 min-w-[16px] text-[9px] px-1 bg-destructive text-destructive-foreground">
                          {unreadChat > 99 ? "99+" : unreadChat}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair"
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
