import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TrialBanner } from "@/components/TrialBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, User, Settings, CreditCard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate, Outlet } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export function AppLayout() {
  const { profile, isTrialing, trialDaysLeft, isActive, trialExpired } = useProfile();
  const { user } = useAuth();
  const { notificationsQuery, markAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const planLabel = isTrialing
    ? `PRO Trial · ${trialDaysLeft}d left`
    : isActive
      ? (profile?.subscription_plan?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) || "Active")
      : trialExpired
        ? "Expired"
        : "No Plan";

  const planColor = isTrialing
    ? "bg-primary/10 text-primary border-primary/25"
    : isActive
      ? "bg-success/10 text-success border-success/25"
      : "bg-destructive/10 text-destructive border-destructive/25";

  const notifications = notificationsQuery.data ?? [];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TrialBanner />
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground hover:bg-accent/50" />
              <div className="hidden sm:flex relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-48 lg:w-64 h-8 pl-8 text-sm bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold cursor-pointer ${planColor}`}
                onClick={() => navigate("/subscription")}
              >
                {planLabel}
              </Badge>

              {/* Notification Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
                  <DropdownMenuLabel className="text-foreground">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.read ? "bg-accent/10" : ""}`}
                        onClick={() => markAsRead.mutate(n.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm text-foreground">{n.title}</span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer hover:bg-accent/50">
                    <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                  <DropdownMenuLabel className="text-foreground">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{profile?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-foreground hover:text-foreground">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/subscription")} className="cursor-pointer text-foreground hover:text-foreground">
                    <CreditCard className="mr-2 h-4 w-4" /> Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-foreground hover:text-foreground">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
