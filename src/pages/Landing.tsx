import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Users, Bell, Shield, Check, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const features = [
    { icon: Users, title: "Member Management", desc: "Add, edit, track all gym members in one place." },
    { icon: Bell, title: "Expiry Alerts", desc: "Auto-detect expired & expiring memberships. Send WhatsApp reminders." },
    { icon: Shield, title: "Secure & Private", desc: "Your data is isolated. Only you can see your gym's members." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display">GymFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate("/auth")}>Login</Button>
          <Button onClick={() => navigate("/get-started")}>Start Free Trial</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
          7-day free trial • No card required
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight mb-6">
          Simple Gym Management{" "}
          <span className="text-primary">Software</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Track members, manage renewals, and send reminders automatically.
          Built for gym owners who want simplicity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/get-started")} className="text-base px-8">
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base px-8">
            Login
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-12">
          Everything you need to run your gym
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-display">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-4xl mx-auto" id="pricing">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground text-center mb-12">
          Start with a 7-day free trial. Cancel anytime.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Monthly */}
          <Card className="border-border bg-card relative overflow-hidden">
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
              <Button className="w-full mt-4" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Yearly */}
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
              <Button className="w-full mt-4" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} GymFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
