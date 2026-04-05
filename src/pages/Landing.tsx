import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell,
  Users,
  CreditCard,
  CalendarCheck,
  UserCog,
  BarChart3,
  Smartphone,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Play,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const features = [
    { icon: Users, title: "Member Management", desc: "Add, edit, and organize all your gym members effortlessly from one central hub." },
    { icon: CreditCard, title: "Payment Tracking", desc: "Track every payment, due, and invoice with automated reminders." },
    { icon: CalendarCheck, title: "Attendance System", desc: "Monitor daily attendance with check-in tracking and attendance analytics." },
    { icon: UserCog, title: "Trainer Management", desc: "Assign trainers, manage schedules, and track their performance." },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Get real-time insights into revenue, growth, and member retention." },
    { icon: Smartphone, title: "Mobile Friendly", desc: "Access your gym dashboard from any device, anywhere, anytime." },
  ];

  const benefits = [
    { icon: Clock, title: "Save 10+ Hours/Week", desc: "Automate membership renewals, reminders, and daily admin tasks." },
    { icon: Zap, title: "Automate Memberships", desc: "Auto-assign plans, track expiry, send renewal reminders via WhatsApp." },
    { icon: CreditCard, title: "Track Every Payment", desc: "Never miss a payment. Full history, dues, and receipt generation." },
    { icon: TrendingUp, title: "Grow Faster", desc: "Data-driven decisions to increase retention and revenue." },
  ];

  const testimonials = [
    { name: "Rahul Sharma", gym: "Iron Paradise Gym", review: "GymFlow completely transformed how I manage my gym. Payments, attendance, everything is automated now.", rating: 5 },
    { name: "Priya Patel", gym: "FitZone Studio", review: "The dashboard analytics helped me increase member retention by 40%. Best investment for my gym.", rating: 5 },
    { name: "Vikram Singh", gym: "Power House Fitness", review: "I was spending hours on paperwork. Now GymFlow handles everything while I focus on training.", rating: 5 },
  ];

  const plans = {
    monthly: [
      { name: "Free", price: "₹0", period: "/month", features: ["Up to 25 members", "Basic attendance", "Manual payments", "Email support"], highlight: false },
      { name: "Pro", price: "₹999", period: "/month", features: ["Unlimited members", "WhatsApp reminders", "Payment tracking", "Analytics dashboard", "Trainer management", "Priority support"], highlight: true },
      { name: "Premium", price: "₹2,499", period: "/month", features: ["Everything in Pro", "Multi-branch support", "Custom branding", "API access", "Dedicated account manager", "24/7 phone support"], highlight: false },
    ],
    yearly: [
      { name: "Free", price: "₹0", period: "/year", features: ["Up to 25 members", "Basic attendance", "Manual payments", "Email support"], highlight: false },
      { name: "Pro", price: "₹9,999", period: "/year", features: ["Unlimited members", "WhatsApp reminders", "Payment tracking", "Analytics dashboard", "Trainer management", "Priority support"], highlight: true },
      { name: "Premium", price: "₹24,999", period: "/year", features: ["Everything in Pro", "Multi-branch support", "Custom branding", "API access", "Dedicated account manager", "24/7 phone support"], highlight: false },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary glow-green">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">GymFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <Button onClick={() => navigate("/get-started")} className="glow-green font-semibold">
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6 bg-grid">
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left */}
          <div className="space-y-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 mr-1.5" /> 7-day free trial • No card required
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display leading-[1.1] tracking-tight">
              Run Your Gym{" "}
              <span className="gradient-text text-glow-green">Like a Pro.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Manage members, track payments, automate plans, and grow your gym — all from one powerful dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/get-started")}
                className="text-base px-8 h-13 font-semibold glow-green-strong group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-13 border-border/50 hover:border-primary/30 hover:bg-primary/5"
              >
                <Play className="mr-2 h-4 w-4" /> Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Free 7-day trial</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Cancel anytime</div>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="relative">
            <div className="glass-strong rounded-2xl p-1 glow-green">
              <div className="bg-card rounded-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-primary/70" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">GymFlow Dashboard</span>
                </div>
                {/* Dashboard content */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Members", value: "1,247", change: "+12%" },
                      { label: "Revenue", value: "₹4.8L", change: "+23%" },
                      { label: "Attendance", value: "89%", change: "+5%" },
                    ].map((s) => (
                      <div key={s.label} className="glass rounded-xl p-3.5 space-y-1">
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                        <p className="text-lg font-bold font-display">{s.value}</p>
                        <p className="text-[11px] text-primary font-medium">{s.change}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-3">Membership Growth</p>
                    <div className="flex items-end gap-1.5 h-20">
                      {[35, 45, 40, 55, 50, 65, 60, 75, 70, 85, 80, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-primary/30 hover:bg-primary/60 transition-colors"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Recent members */}
                  <div className="glass rounded-xl p-4 space-y-2.5">
                    <p className="text-xs text-muted-foreground">Recent Members</p>
                    {["Arjun K.", "Sneha M.", "Ravi P."].map((name, i) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                            {name[0]}
                          </div>
                          <span className="text-foreground/80">{name}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                          {["Pro", "Starter", "Premium"][i]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 glass-strong rounded-xl p-3 glow-green animate-fade-in hidden lg:flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold">Revenue Up</p>
                <p className="text-[11px] text-primary font-bold">+23% this month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="py-16 px-6 border-y border-border/30">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-8 uppercase tracking-widest">Trusted by 500+ gyms across India</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-40">
            {["Iron Paradise", "FitZone", "PowerHouse", "Elite Fitness", "Muscle Factory"].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display">
              Everything You Need to{" "}
              <span className="gradient-text">Run Your Gym</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Powerful tools designed specifically for gym owners who want simplicity and control.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 group hover:glow-green transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold font-display mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section id="dashboard" className="py-24 px-6 bg-grid relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Dashboard</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display">
              A Dashboard That{" "}
              <span className="gradient-text">Feels Powerful</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Get a bird's-eye view of your entire gym. Revenue, members, attendance — everything at a glance.
            </p>
          </div>
          {/* Large dashboard preview */}
          <div className="glass-strong rounded-2xl p-1 glow-green max-w-5xl mx-auto">
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-warning/70" />
                <div className="w-3 h-3 rounded-full bg-primary/70" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">GymFlow — Owner Dashboard</span>
              </div>
              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 border-r border-border/30 p-4 hidden md:block space-y-1">
                  {[
                    { icon: BarChart3, label: "Dashboard", active: true },
                    { icon: Users, label: "Members" },
                    { icon: CreditCard, label: "Payments" },
                    { icon: CalendarCheck, label: "Attendance" },
                    { icon: UserCog, label: "Trainers" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                        item.active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="flex-1 p-5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Total Members", value: "1,247" },
                      { label: "Monthly Revenue", value: "₹4,82,000" },
                      { label: "Active Plans", value: "1,089" },
                      { label: "Today's Attendance", value: "312" },
                    ].map((s) => (
                      <div key={s.label} className="glass rounded-xl p-3.5">
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                        <p className="text-lg font-bold font-display mt-1">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-3">Revenue (6 months)</p>
                      <div className="flex items-end gap-2 h-24">
                        {[45, 55, 50, 70, 65, 85].map((h, i) => (
                          <div key={i} className="flex-1 rounded-md bg-primary/25" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="glass rounded-xl p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">Recent Payments</p>
                      {[
                        { name: "Arjun K.", amount: "₹2,500" },
                        { name: "Sneha M.", amount: "₹1,800" },
                        { name: "Ravi P.", amount: "₹3,200" },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-sm">
                          <span className="text-foreground/70">{p.name}</span>
                          <span className="text-primary font-semibold text-xs">{p.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Why GymFlow</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display">
              Why Gym Owners{" "}
              <span className="gradient-text">Love GymFlow</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="glass rounded-2xl p-6 text-center group hover:glow-green transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <b.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold font-display mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6 bg-grid relative">
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display">
              Simple, Transparent{" "}
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready.</p>
            {/* Toggle */}
            <div className="inline-flex items-center gap-3 glass rounded-full p-1.5 mt-4">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly <span className="text-[11px] ml-1 opacity-70">Save 16%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {plans[billingCycle].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? "glass-strong glow-green-strong border-primary/30 relative"
                    : "glass"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold shadow-lg">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold font-display">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold font-display">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className={`w-full mt-6 font-semibold ${plan.highlight ? "glow-green" : ""}`}
                  variant={plan.highlight ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                >
                  {plan.name === "Free" ? "Get Started" : "Start Free Trial"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Testimonials</Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display">
              Loved by{" "}
              <span className="gradient-text">Gym Owners</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-6 hover:glow-green transition-all duration-300 hover:-translate-y-1">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-6">"{t.review}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.gym}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-primary/3 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold font-display">
            Ready to Transform{" "}
            <span className="gradient-text text-glow-green">Your Gym?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join 500+ gym owners who trust GymFlow to run their business. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/get-started")}
              className="text-base px-10 h-13 font-semibold glow-green-strong group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-10 h-13 border-border/50 hover:border-primary/30">
              Book a Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free 7-day trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/30 px-6 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary glow-green">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold font-display">GymFlow</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The ultimate gym management platform built for modern gym owners.
            </p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Dashboard", "Mobile App"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <div className="space-y-2.5">
                {col.links.map((link) => (
                  <p key={link} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    {link}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-border/30 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GymFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
