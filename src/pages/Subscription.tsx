import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter Monthly",
    price: "₹199",
    period: "/month",
    value: "starter_monthly",
    popular: false,
    features: ["Up to 100 members", "WhatsApp reminders", "Expiry tracking", "Dashboard analytics"],
  },
  {
    name: "Starter Yearly",
    price: "₹1,999",
    period: "/year",
    value: "starter_yearly",
    popular: false,
    badge: "SAVE 16%",
    features: ["Everything in Starter Monthly", "Priority email support", "Data export"],
  },
  {
    name: "Pro Monthly",
    price: "₹399",
    period: "/month",
    value: "pro_monthly",
    popular: true,
    features: ["Unlimited members", "Attendance tracking", "Expense management", "Reports & analytics", "Staff accounts"],
  },
  {
    name: "Pro Yearly",
    price: "₹3,999",
    period: "/year",
    value: "pro_yearly",
    popular: false,
    badge: "SAVE 17%",
    features: ["Everything in Pro Monthly", "Priority support", "Early access to features", "Best value"],
  },
];

const Subscription = () => {
  const { profile, isActive, isTrialing, trialDaysLeft, trialExpired, hasAccess } = useProfile();
  const { toast } = useToast();

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Razorpay Integration",
      description: `Payment for the ${plan} plan will be configured in Phase 2.`,
    });
  };

  const handleStartTrial = () => {
    toast({
      title: "Trial Started!",
      description: "Your 7-day free trial is now active. Enjoy GymFlow Pro!",
    });
  };

  const statusBadge = isActive
    ? { label: "Active", className: "bg-success/15 text-success border-success/30" }
    : trialExpired
      ? { label: "Trial Expired", className: "bg-destructive/15 text-destructive border-destructive/30" }
      : isTrialing
        ? { label: `Trial — ${trialDaysLeft} days left`, className: "bg-warning/15 text-warning border-warning/30" }
        : { label: "No Plan", className: "bg-muted text-muted-foreground border-border" };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-display text-foreground">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2">Unlock the full potential of GymFlow Pro</p>
        <Badge variant="outline" className={`mt-3 ${statusBadge.className}`}>
          {statusBadge.label}
        </Badge>
      </div>

      {/* Trial CTA */}
      {!isActive && !isTrialing && !profile?.trial_used && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <p className="font-display font-bold text-foreground">Start your 7-day free trial</p>
                <p className="text-sm text-muted-foreground">No credit card required. Cancel anytime.</p>
              </div>
            </div>
            <Button size="lg" onClick={handleStartTrial}>Start Free Trial</Button>
          </CardContent>
        </Card>
      )}

      {/* Pricing Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <Card
            key={plan.value}
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
            {plan.badge && !plan.popular && (
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                {plan.badge}
              </div>
            )}
            <CardHeader className={plan.popular ? "pt-8" : ""}>
              <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold font-display">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
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
                onClick={() => handleSubscribe(plan.value)}
                disabled={isActive && profile?.subscription_plan === plan.value}
              >
                {isActive && profile?.subscription_plan === plan.value ? "Current Plan" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        {["✔ 7-Day Free Trial", "✔ Cancel Anytime", "✔ No Hidden Charges", "✔ Secure Payments"].map((t) => (
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
