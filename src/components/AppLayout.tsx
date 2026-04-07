import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TrialBanner } from "@/components/TrialBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  const { profile, isTrialing, trialDaysLeft, isActive, trialExpired } = useProfile();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const planLabel = isTrialing
    ? `Trial · ${trialDaysLeft}d left`
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TrialBanner />
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="hidden sm:flex relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-48 lg:w-64 h-8 pl-8 text-sm bg-secondary/50 border-border/50"
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold cursor-pointer ${planColor}`}
                onClick={() => navigate("/subscription")}
              >
                {planLabel}
              </Badge>

              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              <ThemeToggle />

              <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
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
