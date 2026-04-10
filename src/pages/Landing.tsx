import { useNavigate } from "react-router-dom";
import { RevealSection } from "@/hooks/useScrollReveal";
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
  ArrowRight,
  Check,
  Zap,
  TrendingUp,
  Play,
  ChevronRight,
  Package,
  Shield,
  Star,
  Menu,
  X,
  ChevronDown,
  Clock,
  Globe,
  Headphones,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { PRICING_PLANS, YEARLY_DISCOUNT_LABEL } from "@/lib/pricing";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (user) return null;

  const features = [
    { icon: Users, title: "Member Management", desc: "Add, edit, and organize all your gym members effortlessly from one central hub." },
    { icon: CalendarCheck, title: "Attendance Tracking", desc: "Monitor daily attendance with check-in tracking and detailed analytics." },
    { icon: CreditCard, title: "Payment Tracking", desc: "Track every payment, due, and invoice with automated reminders." },
    { icon: Package, title: "Inventory Management", desc: "Manage gym equipment, supplements, and supplies with smart stock alerts." },
    { icon: UserCog, title: "Trainer Management", desc: "Assign trainers, manage schedules, and track their performance." },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Get real-time insights into revenue, growth, and member retention." },
  ];

  const benefits = [
    { icon: Clock, title: "Save 10+ Hours/Week", desc: "Automate member management, billing, and reporting so you can focus on growing your gym." },
    { icon: TrendingUp, title: "Grow Revenue 30%", desc: "Smart analytics and retention tools help you identify opportunities and reduce churn." },
    { icon: Globe, title: "Access Anywhere", desc: "Cloud-based platform works on any device — manage your gym from your phone, tablet, or laptop." },
    { icon: Headphones, title: "Priority Support", desc: "Get help when you need it with our dedicated support team available via chat and email." },
  ];

  const faqs = [
    { q: "How does the 7-day free trial work?", a: "Sign up and get full access to all features for 7 days — no credit card required. After the trial, choose a plan that fits your gym." },
    { q: "Can I cancel anytime?", a: "Absolutely. There are no long-term contracts. You can cancel, upgrade, or downgrade your plan at any time." },
    { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption and security practices. Your data is backed up daily and stored securely in the cloud." },
    { q: "Do I need to install anything?", a: "No. GymFlow is a web-based platform that works in your browser. You can also install it as a PWA on mobile devices." },
    { q: "Can multiple staff members use the same account?", a: "Yes. You can add trainers and staff with role-based access so everyone has the right permissions." },
  ];

  const plans = {
    monthly: [
      {
        name: "Free",
        price: "₹0",
        period: "/7 days",
        features: ["Up to 50 members", "Dashboard access", "Attendance tracking", "Inventory management"],
        highlight: false,
        cta: "Start Free Trial",
      },
      ...PRICING_PLANS.map((p) => ({
        name: p.name,
        price: p.monthlyPrice,
        period: "/month",
        features: p.features,
        highlight: p.popular,
        cta: "Get Started",
      })),
    ],
    yearly: [
      {
        name: "Free",
        price: "₹0",
        period: "/7 days",
        features: ["Up to 50 members", "Dashboard access", "Attendance tracking", "Inventory management"],
        highlight: false,
        cta: "Start Free Trial",
      },
      ...PRICING_PLANS.map((p) => ({
        name: p.name,
        price: p.yearlyPrice,
        period: "/year",
        features: p.features,
        highlight: p.popular,
        cta: "Get Started",
      })),
    ],
  };

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#dashboard", label: "Product" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary glow-green">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">GymFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <Button onClick={() => navigate("/auth")} className="glow-green font-semibold">
              Start Free Trial
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pb-4 space-y-2 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="ghost" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="justify-start text-muted-foreground">
                Login
              </Button>
              <Button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="glow-green font-semibold">
                Start Free Trial
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-28 lg:pt-44 lg:pb-32 px-4 sm:px-6">
        <div className="absolute top-20 left-1/4 w-72 sm:w-[500px] h-72 sm:h-[500px] rounded-full bg-primary/5 blur-[100px] sm:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-60 sm:w-[400px] h-60 sm:h-[400px] rounded-full bg-accent/5 blur-[80px] sm:blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
          <RevealSection className="space-y-6 sm:space-y-8 text-center lg:text-left" direction="left">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium inline-flex">
              <Zap className="h-3.5 w-3.5 mr-1.5" /> 7-day free trial • No credit card required
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display leading-[1.08] tracking-tight">
              Run Your Entire Gym{" "}
              <span className="gradient-text">From One Dashboard.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Manage members, track payments, monitor attendance, and grow your gym with GymFlow.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-base px-6 sm:px-8 h-12 sm:h-13 font-semibold glow-green group"
              >
                Start 7-Day Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-6 sm:px-8 h-12 sm:h-13 border-border hover:border-primary/30 hover:bg-primary/5"
                onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Play className="mr-2 h-4 w-4" /> View Dashboard
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-sm text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Free 7-day trial</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Cancel anytime</div>
            </div>
          </RevealSection>

          <RevealSection className="relative max-w-lg mx-auto lg:max-w-none w-full" direction="right" delay={200}>
            <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-warning/70" />
                <div className="w-3 h-3 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">GymFlow Dashboard</span>
              </div>
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: "Total Members", value: "1,247", change: "+12%" },
                    { label: "Revenue", value: "₹4.8L", change: "+23%" },
                    { label: "Attendance", value: "89%", change: "+5%" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/50 bg-muted/30 p-2.5 sm:p-3.5 space-y-1">
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">{s.label}</p>
                      <p className="text-base sm:text-lg font-bold font-display">{s.value}</p>
                      <p className="text-[10px] sm:text-[11px] text-primary font-medium">{s.change}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground mb-3">Membership Growth</p>
                  <div className="flex items-end gap-1 sm:gap-1.5 h-16 sm:h-20">
                    {[35, 45, 40, 55, 50, 65, 60, 75, 70, 85, 80, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/25 hover:bg-primary/50 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4 space-y-2.5">
                  <p className="text-xs text-muted-foreground">Recent Members</p>
                  {["Arjun K.", "Sneha M.", "Ravi P."].map((name, i) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                          {name[0]}
                        </div>
                        <span className="text-foreground/80 text-xs sm:text-sm">{name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                        {["Pro", "Starter", "Premium"][i]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 rounded-xl border border-border/50 bg-card shadow-lg p-2.5 sm:p-3 hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold">Revenue Up</p>
                <p className="text-[11px] text-primary font-bold">+23% this month</p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <RevealSection>
        <section className="py-12 sm:py-16 px-4 sm:px-6 border-y border-border/30">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 uppercase tracking-widest">Trusted by 500+ gyms across India</p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-14 opacity-40">
              {["Iron Paradise", "FitZone", "PowerHouse", "Elite Fitness", "Muscle Factory"].map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <Dumbbell className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute top-1/2 left-0 w-60 sm:w-[300px] h-60 sm:h-[300px] rounded-full bg-primary/3 blur-[80px] sm:blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealSection className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Features</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display">
              Everything You Need to{" "}
              <span className="gradient-text">Run Your Gym</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Powerful tools designed specifically for gym owners who want simplicity and control.
            </p>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <RevealSection key={f.title} delay={i * 100}>
                <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-7 group hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                    <f.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold font-display mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE ── */}
      <section id="dashboard" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30 relative">
        <div className="absolute top-0 right-0 w-72 sm:w-[400px] h-72 sm:h-[400px] rounded-full bg-primary/3 blur-[100px] sm:blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealSection className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Product</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display">
              A Dashboard That{" "}
              <span className="gradient-text">Feels Powerful</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Get a bird's-eye view of your entire gym. Revenue, members, attendance — everything at a glance.
            </p>
          </RevealSection>

          <RevealSection direction="scale" delay={150}>
            <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden max-w-5xl mx-auto">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border/50 bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-warning/70" />
                <div className="w-3 h-3 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">GymFlow — Owner Dashboard</span>
              </div>
              <div className="flex">
                <div className="w-40 sm:w-48 border-r border-border/30 p-3 sm:p-4 hidden md:block space-y-1">
                  {[
                    { icon: BarChart3, label: "Dashboard", active: true },
                    { icon: Users, label: "Members" },
                    { icon: CreditCard, label: "Payments" },
                    { icon: CalendarCheck, label: "Attendance" },
                    { icon: UserCog, label: "Trainers" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        item.active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-3 sm:p-5 space-y-3 sm:space-y-4 min-w-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { label: "Total Members", value: "1,247", trend: "+12%" },
                      { label: "Monthly Revenue", value: "₹4,82,000", trend: "+23%" },
                      { label: "Active Plans", value: "1,089", trend: "+8%" },
                      { label: "Today's Attendance", value: "312", trend: "+5%" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border/50 bg-muted/30 p-2.5 sm:p-3.5">
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">{s.label}</p>
                        <p className="text-sm sm:text-lg font-bold font-display mt-1">{s.value}</p>
                        <p className="text-[10px] text-primary font-medium mt-0.5">{s.trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground mb-3">Revenue (6 months)</p>
                      <div className="flex items-end gap-1.5 sm:gap-2 h-20 sm:h-28">
                        {[45, 55, 50, 70, 65, 85].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-md bg-gradient-to-t from-primary/30 to-primary/15 hover:from-primary/50 hover:to-primary/25 transition-colors"
                              style={{ height: `${h}%` }}
                            />
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground">
                              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground mb-3">Attendance (Weekly)</p>
                      <div className="flex items-end gap-1.5 sm:gap-2 h-20 sm:h-28">
                        {[70, 85, 75, 90, 80, 60, 45].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-md bg-gradient-to-t from-accent/25 to-accent/10 hover:from-accent/40 hover:to-accent/20 transition-colors"
                              style={{ height: `${h}%` }}
                            />
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground mb-3">Members</p>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider pb-1 border-b border-border/30">
                          <span>Name</span><span>Plan</span><span className="text-right">Status</span>
                        </div>
                        {[
                          { name: "Arjun K.", plan: "Pro", status: "Active" },
                          { name: "Sneha M.", plan: "Starter", status: "Active" },
                          { name: "Ravi P.", plan: "Pro", status: "Expiring" },
                          { name: "Priya S.", plan: "Starter", status: "Active" },
                        ].map((m) => (
                          <div key={m.name} className="grid grid-cols-3 text-xs sm:text-sm items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/15 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-primary">
                                {m.name[0]}
                              </div>
                              <span className="text-foreground/80 text-xs truncate">{m.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-0 w-fit">
                              {m.plan}
                            </Badge>
                            <span className={`text-[10px] text-right font-medium ${m.status === "Expiring" ? "text-warning" : "text-primary"}`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground mb-3">Recent Activity</p>
                      <div className="space-y-2.5 sm:space-y-3">
                        {[
                          { text: "Arjun K. checked in", time: "2 min ago", icon: CalendarCheck },
                          { text: "Payment received ₹2,500", time: "15 min ago", icon: CreditCard },
                          { text: "New member: Priya S.", time: "1 hr ago", icon: Users },
                          { text: "Inventory restocked", time: "3 hr ago", icon: Package },
                        ].map((a) => (
                          <div key={a.text} className="flex items-center gap-2.5 sm:gap-3 text-sm">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <a.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] sm:text-xs text-foreground/80 truncate">{a.text}</p>
                              <p className="text-[10px] text-muted-foreground">{a.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Benefits</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display">
              Why Gym Owners{" "}
              <span className="gradient-text">Love GymFlow</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Built by gym owners, for gym owners. Here's what sets us apart.
            </p>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {benefits.map((b, i) => (
              <RevealSection key={b.title} delay={i * 100}>
                <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 text-center hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold font-display mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30 relative">
        <div className="absolute bottom-0 left-1/3 w-72 sm:w-[400px] h-72 sm:h-[400px] rounded-full bg-primary/3 blur-[100px] sm:blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <RevealSection className="text-center mb-10 sm:mb-14 space-y-3 sm:space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">Pricing</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display">
              Simple, Transparent{" "}
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">Start free. Upgrade when you're ready.</p>
            <div className="inline-flex items-center gap-1 rounded-full p-1.5 mt-4 border border-border/50 bg-muted/50">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly <span className="text-[11px] ml-1 opacity-70">{YEARLY_DISCOUNT_LABEL}</span>
              </button>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {plans[billingCycle].map((plan, i) => (
              <RevealSection key={plan.name} delay={i * 120}>
                <div
                  className={`rounded-2xl p-5 sm:p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 h-full ${
                    plan.highlight
                      ? "border-2 border-primary/40 bg-card shadow-xl relative scale-100 sm:scale-[1.03]"
                      : "border border-border/50 bg-card hover:shadow-lg hover:border-primary/20"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold shadow-lg">
                        <Star className="h-3 w-3 mr-1" /> MOST POPULAR
                      </Badge>
                    </div>
                  )}
                  <div className="mb-5 sm:mb-6">
                    <h3 className="text-lg font-semibold font-display">{plan.name}</h3>
                    <div className="mt-3">
                      <span className="text-3xl sm:text-4xl font-bold font-display">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={`w-full mt-6 sm:mt-8 font-semibold transition-all duration-300 ${plan.highlight ? "glow-green" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-3xl mx-auto">
          <RevealSection className="text-center mb-10 sm:mb-14 space-y-3 sm:space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display">
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </h2>
          </RevealSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-medium hover:bg-muted/30 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRIAL CTA ── */}
      <RevealSection direction="scale">
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30 relative">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="rounded-2xl sm:rounded-3xl border border-primary/20 bg-card p-8 sm:p-10 md:p-16 text-center shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              <div className="relative z-10 space-y-5 sm:space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/15 mb-2">
                  <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">
                  Start Your 7-Day Free Trial
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                  No credit card required. Get full access to Dashboard, Members, Attendance, and Inventory — completely free for 7 days.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="text-base px-8 sm:px-10 h-12 sm:h-13 font-semibold glow-green group"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</div>
                  <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Full access</div>
                  <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Cancel anytime</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── FOOTER ── */}
      <RevealSection>
        <footer className="border-t border-border/30 px-4 sm:px-6 py-10 sm:py-12">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
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
          <div className="max-w-6xl mx-auto mt-8 sm:mt-10 pt-6 border-t border-border/30 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} GymFlow. All rights reserved.
          </div>
        </footer>
      </RevealSection>
    </div>
  );
};

export default Landing;
