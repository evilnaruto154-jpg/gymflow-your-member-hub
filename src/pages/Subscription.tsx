import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { PRICING_PLANS, YEARLY_DISCOUNT_LABEL } from "@/lib/pricing";

const Subscription = () => {
  const { profile, isActive, isTrialing, trialDaysLeft, trialExpired, updateProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Razorpay Integration",
      description: `Payment for the ${plan} plan will be configured in Phase 2.`,
    });
  };

  const handleStartTrial = async () => {
    // Edge case 1: User not logged in
    if (!user) {
      toast({ title: "Authentication Required", description: "You must be logged in to activate a trial.", variant: "destructive" });
      navigate("/auth", { replace: true });
      return;
    }

    // Edge case 2: Trial already used (prevent abuse — 1 trial per user)
    if (profile?.trial_used) {
      toast({ title: "Trial Unavailable", description: "You have already used your free trial. Please subscribe to continue.", variant: "destructive" });
      return;
    }

    // Edge case 3: Trial already active
    if (isTrialing && !trialExpired) {
      toast({ title: "Trial Active", description: "Your free trial is already in progress. Enjoy full PRO access!" });
      navigate("/dashboard");
      return;
    }

    // Edge case 4: Already has active subscription
    if (isActive) {
      toast({ title: "Already Subscribed", description: "You already have an active subscription." });
      navigate("/dashboard");
      return;
    }

    setStartingTrial(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      console.log("[Trial] Starting trial activation...", {
        userId: user.id,
        trialStart: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
      });

      const result = await updateProfile.mutateAsync({
        subscription_status: "trialing",
        subscription_plan: "pro_trial",
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        // trial_used stays false during active trial — set to true only on expiry
        trial_used: false,
      });

      console.log("[Trial] ✅ Trial activated successfully:", result);

      toast({
        title: "🎉 Trial Started Successfully!",
        description: "Your 7-day free PRO trial is now active. You have full access to all features!",
      });

      // Small delay to allow optimistic cache update to propagate to all subscribers
      await new Promise((resolve) => setTimeout(resolve, 100));
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("[Trial] ❌ Trial activation failed:", err);
      toast({
        title: "Error",
        description: err?.message || "Could not start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStartingTrial(false);
    }
  };

  // Determine if user can start a trial:
  // Not currently active, not currently trialing, and hasn't used trial before
  const canStartTrial = !isActive && !isTrialing && !profile?.trial_used;

  const statusBadge = isActive
    ? { label: "Active", className: "bg-success/15 text-success border-success/30" }
    : trialExpired
      ? { label: "Trial Expired", className: "bg-destructive/15 text-destructive border-destructive/30" }
      : isTrialing
        ? { label: `PRO Trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`, className: "bg-warning/15 text-warning border-warning/30" }
        : { label: "No Plan", className: "bg-muted text-muted-foreground border-border" };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Active Trial Banner — prominent when trial is active */}
      {isTrialing && !trialExpired && (
        <Card className="border-success/30 bg-gradient-to-r from-success/5 to-success/10">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-success" />
              <div>
                <p className="font-display font-bold text-lg text-foreground">
                  🎉 Your 7-Day FREE PRO Trial is Active!
                </p>
                <p className="text-sm text-muted-foreground">
                  {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining — you have full access to ALL Pro features
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trial Expired Banner */}
      {trialExpired && (
        <Card className="border-destructive/30 bg-gradient-to-r from-destructive/5 to-destructive/10">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-display font-bold text-lg text-foreground">
                  Your Free Trial Has Expired
                </p>
                <p className="text-sm text-muted-foreground">
                  Subscribe to a plan below to continue using GymFlow with full access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold font-display text-foreground">
          {isTrialing && !trialExpired ? "You Have Full PRO Access" : "Choose Your Plan"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isTrialing && !trialExpired
            ? "Your trial includes ALL Pro features — unlimited members, reports, analytics, and more. Subscribe anytime before it ends."
            : "Unlock the full potential of GymFlow Pro"}
        </p>
        <Badge variant="outline" className={`mt-3 ${statusBadge.className}`}>
          {statusBadge.label}
        </Badge>
      </div>

      {/* Trial CTA — show only if user hasn't used trial yet */}
      {canStartTrial && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <p className="font-display font-bold text-foreground">Start your 7-day FREE PRO Trial</p>
                <p className="text-sm text-muted-foreground">Full PRO access to all features. No credit card required. No restrictions.</p>
              </div>
            </div>
            <Button size="lg" onClick={handleStartTrial} disabled={startingTrial}>
              {startingTrial ? "Activating..." : "Start Free Trial"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
        <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
          Yearly
        </span>
        {isYearly && (
         <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30 text-xs">
            {YEARLY_DISCOUNT_LABEL}
          </Badge>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {PRICING_PLANS.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const period = isYearly ? "/year" : "/month";
          const value = isYearly ? plan.yearlyValue : plan.monthlyValue;

          return (
            <Card
              key={plan.name}
              className={`relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                plan.popular
                  ? "border-primary bg-card shadow-primary/10 shadow-lg"
                  : "border-border bg-card/80"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-bold text-center py-1">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className={plan.popular ? "pt-8" : ""}>
                <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold font-display">{price}</span>
                  <span className="text-muted-foreground text-sm">{period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
                <Button
                  className="w-full mt-4"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(value)}
                  disabled={isActive && profile?.subscription_plan === value}
                >
                  {isActive && profile?.subscription_plan === value ? "Current Plan" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        {["✔ 7-Day Free PRO Trial", "✔ Cancel Anytime", "✔ No Hidden Charges", "✔ Secure Payments"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* Current Plan Info */}
      {isActive && profile?.subscription_plan && (
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Plan: <span className="font-medium text-foreground capitalize">{profile.subscription_plan.replace("_", " ")}</span></p>
            {profile.subscription_end_date && (
              <p>Next billing: <span className="font-medium text-foreground">
                {new Date(profile.subscription_end_date).toLocaleDateString()}
              </span></p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Subscription;
