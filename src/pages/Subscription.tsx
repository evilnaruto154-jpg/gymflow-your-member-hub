import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Subscription = () => {
  const { profile, isActive, isTrialing, trialDaysLeft, trialExpired } = useProfile();
  const { toast } = useToast();

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Razorpay Integration",
      description: `Razorpay payment for the ${plan} plan will be configured in Phase 2. Please provide your API keys.`,
    });
  };

  const statusBadge = isActive
    ? { label: "Active", className: "bg-success/15 text-success border-success/30" }
    : trialExpired
      ? { label: "Trial Expired", className: "bg-destructive/15 text-destructive border-destructive/30" }
      : isTrialing
        ? { label: `Trial — ${trialDaysLeft} days left`, className: "bg-warning/15 text-warning border-warning/30" }
        : { label: "Expired", className: "bg-destructive/15 text-destructive border-destructive/30" };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your GymFlow subscription</p>
      </div>

      {/* Current Status */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
          <Badge variant="outline" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {profile?.subscription_plan && (
            <p>Plan: <span className="font-medium text-foreground">{profile.subscription_plan}</span></p>
          )}
          {profile?.subscription_end_date && (
            <p>Next billing: <span className="font-medium text-foreground">
              {new Date(profile.subscription_end_date).toLocaleDateString()}
            </span></p>
          )}
          {isTrialing && !trialExpired && (
            <p>Trial ends: <span className="font-medium text-foreground">
              {new Date(profile!.trial_end_date).toLocaleDateString()}
            </span></p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-display">Monthly</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold font-display">₹199</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Unlimited members", "WhatsApp reminders", "Expiry tracking", "Dashboard analytics"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{f}</span>
              </div>
            ))}
            <Button
              className="w-full mt-4"
              onClick={() => handleSubscribe("monthly")}
              disabled={isActive && profile?.subscription_plan === "monthly"}
            >
              {isActive && profile?.subscription_plan === "monthly" ? "Current Plan" : "Subscribe Monthly"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
            SAVE 16%
          </div>
          <CardHeader>
            <CardTitle className="font-display">Yearly</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold font-display">₹1,999</span>
              <span className="text-muted-foreground">/year</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Everything in Monthly", "Priority support", "Early access to features", "Best value"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{f}</span>
              </div>
            ))}
            <Button
              className="w-full mt-4"
              onClick={() => handleSubscribe("yearly")}
              disabled={isActive && profile?.subscription_plan === "yearly"}
            >
              {isActive && profile?.subscription_plan === "yearly" ? "Current Plan" : "Subscribe Yearly"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
