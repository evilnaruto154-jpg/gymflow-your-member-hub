import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { profile, isActive, isTrialing, trialDaysLeft, trialExpired } = useProfile();
  const navigate = useNavigate();

  const statusLabel = isActive
    ? "Active"
    : trialExpired
      ? "Expired"
      : isTrialing
        ? `Trial (${trialDaysLeft} days left)`
        : "Expired";

  const statusClass = isActive
    ? "bg-success/15 text-success border-success/30"
    : trialExpired
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : "bg-warning/15 text-warning border-warning/30";

  return (
    <div className="max-w-xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-foreground">{profile?.name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member since</p>
            <p className="text-foreground">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display">Subscription</CardTitle>
          <Badge variant="outline" className={statusClass}>
            {statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile?.subscription_plan && (
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-foreground capitalize">{profile.subscription_plan}</p>
            </div>
          )}
          {profile?.subscription_end_date && (
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="text-foreground">
                {new Date(profile.subscription_end_date).toLocaleDateString()}
              </p>
            </div>
          )}
          <Button variant="outline" onClick={() => navigate("/subscription")}>
            {isActive ? "Manage Plan" : "Upgrade Plan"}
          </Button>
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={signOut} className="w-full">
        Sign Out
      </Button>
    </div>
  );
};

export default SettingsPage;
