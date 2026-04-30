import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FolderKanban,
  Settings,
  TrendingUp,
  Calendar,
  FileText,
  PieChart,
  LayoutGrid,
  CheckSquare,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Painel Executivo', url: '/dashboard/executivo', icon: LayoutDashboard },
  { title: 'Dashboard Vendas', url: '/vendas/dashboard', icon: TrendingUp },
  { title: 'Pipeline (Kanban)', url: '/vendas/leads', icon: FolderKanban },
  { title: 'Clientes', url: '/vendas/clientes', icon: Users },
  { title: 'Marketing', url: '/marketing/dashboard', icon: Megaphone },
  { title: 'Dashboard Projetos', url: '/projetos/dashboard', icon: PieChart },
  { title: 'Kanban Projetos', url: '/projetos/kanban', icon: LayoutGrid },
  { title: 'Tarefas', url: '/projetos/tarefas', icon: CheckSquare },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex items-center justify-center p-4">
        <div className="font-bold text-xl text-primary tracking-tight">CRM Empresarial</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
