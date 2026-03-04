import {
  LayoutDashboard, Users, UserPlus, Settings, LogOut, CreditCard,
  Dumbbell, CalendarCheck, IndianRupee, Package
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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

const trainerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Members", url: "/members", icon: Users },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];

const staffNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Members", url: "/members", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { primaryRole, isOwner } = useRole();

  const navItems = isOwner ? ownerNav : primaryRole === "trainer" ? trainerNav : staffNav;

  const roleBadge = isOwner ? "Owner" : primaryRole === "trainer" ? "Trainer" : "Staff";
  const roleColor = isOwner ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-secondary-foreground border-border";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary shrink-0">
            <Dumbbell className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold font-display text-sidebar-accent-foreground">GymFlow</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
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

      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && (
          <div className="px-2 space-y-1">
            <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
            <Badge variant="outline" className={`text-[10px] ${roleColor}`}>{roleBadge}</Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
