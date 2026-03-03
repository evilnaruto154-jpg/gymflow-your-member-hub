import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Bell, TestTube, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { profile, isActive, isTrialing, trialDaysLeft, trialExpired } = useProfile();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [demoPhone, setDemoPhone] = useState("");

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

  const handleTestSubscriptionAlert = async () => {
    await addNotification.mutateAsync({
      title: "Subscription Expiring Soon",
      message: "Your GymFlow subscription will expire on " + new Date(Date.now() + 3 * 86400000).toLocaleDateString() + ". Renew now to avoid interruption.",
      type: "subscription",
    });
    toast({ title: "✅ Test Sent", description: "Subscription alert notification created." });
  };

  const handleTestMemberAlert = async () => {
    await addNotification.mutateAsync({
      title: "Members Expiring Soon",
      message: "3 members are expiring in the next 3 days. Check your members list.",
      type: "member",
    });
    toast({ title: "✅ Test Sent", description: "Member expiry alert notification created." });
  };

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

      {/* Demo Notification Mode */}
      <Card className="border-primary/20 bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Demo Notification Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Number (for push alerts)
            </label>
            <Input
              placeholder="+91 98765 43210"
              value={demoPhone}
              onChange={(e) => setDemoPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleTestSubscriptionAlert}
              disabled={addNotification.isPending}
            >
              <Bell className="h-4 w-4 text-warning" />
              Test Subscription Alert
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleTestMemberAlert}
              disabled={addNotification.isPending}
            >
              <Bell className="h-4 w-4 text-destructive" />
              Test Member Expiry Alert
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            These create test notifications in your notification log. Push notifications will be delivered when the system is fully configured.
          </p>
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={signOut} className="w-full">
        Sign Out
      </Button>
    </div>
  );
};

export default SettingsPage;
