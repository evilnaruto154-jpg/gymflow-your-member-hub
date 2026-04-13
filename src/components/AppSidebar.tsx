import {
  LayoutDashboard, Users, UserPlus, Settings, LogOut, CreditCard,
  Dumbbell, CalendarCheck, IndianRupee, Package, Shield
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
// Removed useRole import
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const MASTER_EMAIL = "mullahusen999@gmail.com";

const ownerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Members", url: "/members", icon: Users },
  { title: "Add Member", url: "/members/new", icon: UserPlus },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Expenses", url: "/expenses", icon: IndianRupee },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  const isMaster = user?.email === MASTER_EMAIL;
  const navItems = ownerNav;
  const finalNav = isMaster
    ? [...navItems, { title: "Admin Panel", url: "/admin", icon: Shield }]
    : navItems;

  const roleBadge = "Owner";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold font-display text-sidebar-accent-foreground tracking-tight">
              GymFlow
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {finalNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent transition-colors duration-200"
                      activeClassName="bg-primary/10 text-primary font-medium border-r-2 border-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2 border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 space-y-1.5">
            <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/25"
            >
              {roleBadge}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
