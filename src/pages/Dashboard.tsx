import { useMemo } from "react";
import { useMembers, getMemberStatus } from "@/hooks/useMembers";
import { useExpenses } from "@/hooks/useExpenses";
import { useInventory } from "@/hooks/useInventory";
import { useTrainers } from "@/hooks/useTrainers";
import { useProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserCheck, UserPlus, AlertTriangle, TrendingUp, IndianRupee,
  Clock, CreditCard, Package, ArrowRight, UserCog
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { DashboardAlerts } from "@/components/DashboardAlerts";
import { useNavigate } from "react-router-dom";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(142 50% 60%)", "hsl(220 70% 55%)"];

const Dashboard = () => {
  const { membersQuery } = useMembers();
  const { expensesQuery } = useExpenses();
  const { lowStockItems } = useInventory();
  const { activeTrainers, trainers: allTrainers } = useTrainers();
  const { isTrialing, trialDaysLeft, profile } = useProfile();
  const { isOwner } = useRole();
  const navigate = useNavigate();
  const members = membersQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  const total = members.length;
  const active = members.filter((m) => getMemberStatus(m.expiry_date) === "active").length;
  const expired = members.filter((m) => getMemberStatus(m.expiry_date) === "expired").length;
  const expiringSoon = members.filter((m) => {
    const days = differenceInDays(new Date(m.expiry_date), new Date());
    return days >= 0 && days <= 7;
  }).length;
  const newThisMonth = members.filter((m) => {
    const d = parseISO(m.created_at);
    return isWithinInterval(d, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
  }).length;
  const pendingPayments = members.filter((m) => m.payment_status !== "paid").length;

  const monthlyRevenue = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return members
      .filter((m) => m.payment_status === "paid" && isWithinInterval(parseISO(m.created_at), { start, end }))
      .reduce((sum, m) => sum + m.payment_amount, 0);
  }, [members]);

  const monthlyExpenses = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return expenses
      .filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netProfit = monthlyRevenue - monthlyExpenses;

  // Revenue vs Expense chart data
  const revenueExpenseData = useMemo(() => {
    const months: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const rev = members
        .filter((m) => m.payment_status === "paid" && isWithinInterval(parseISO(m.created_at), { start, end }))
        .reduce((sum, m) => sum + m.payment_amount, 0);
      const exp = expenses
        .filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
        .reduce((sum, e) => sum + e.amount, 0);
      months.push({ month: format(date, "MMM"), revenue: rev, expenses: exp });
    }
    return months;
  }, [members, expenses]);

  const growthData = useMemo(() => {
    const months: { month: string; members: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const end = endOfMonth(date);
      const count = members.filter((m) => parseISO(m.created_at) <= end).length;
      months.push({ month: format(date, "MMM"), members: count });
    }
    return months;
  }, [members]);

  // Plan distribution
  const planData = useMemo(() => {
    const planMap: Record<string, number> = {};
    members.forEach((m) => {
      planMap[m.plan] = (planMap[m.plan] || 0) + 1;
    });
    return Object.entries(planMap).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Payment collection trend
  const paymentTrend = useMemo(() => {
    const months: { month: string; collected: number; pending: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const inRange = members.filter((m) => isWithinInterval(parseISO(m.created_at), { start, end }));
      const collected = inRange.filter((m) => m.payment_status === "paid").reduce((s, m) => s + m.payment_amount, 0);
      const pending = inRange.filter((m) => m.payment_status !== "paid").reduce((s, m) => s + m.payment_amount, 0);
      months.push({ month: format(date, "MMM"), collected, pending });
    }
    return months;
  }, [members]);

  const stats = [
    { title: "Active Members", value: active, icon: UserCheck, color: "text-success" },
    { title: "New This Month", value: newThisMonth, icon: UserPlus, color: "text-primary" },
    { title: "Expiring Soon", value: expiringSoon, icon: Clock, color: "text-warning" },
    { title: "Monthly Revenue", value: `₹${monthlyRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
    { title: "Pending Payments", value: pendingPayments, icon: CreditCard, color: "text-warning" },
    { title: "Monthly Expenses", value: `₹${monthlyExpenses.toLocaleString()}`, icon: TrendingUp, color: "text-destructive" },
    { title: "Net Profit", value: `₹${netProfit.toLocaleString()}`, icon: IndianRupee, color: netProfit >= 0 ? "text-success" : "text-destructive" },
  ];

  const quickActions = [
    { label: "Add Member", icon: UserPlus, path: "/members/new" },
    { label: "Record Expense", icon: IndianRupee, path: "/expenses" },
    { label: "Add Inventory", icon: Package, path: "/inventory" },
    { label: "View Members", icon: Users, path: "/members" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your gym</p>
        </div>
        {isTrialing ? (
          <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 px-4 py-1.5 text-sm font-semibold">
            Trial – {trialDaysLeft} Day{trialDaysLeft !== 1 ? "s" : ""} Remaining
          </Badge>
        ) : profile?.subscription_status === "active" ? (
          <Badge variant="outline" className="bg-success/15 text-success border-success/30 px-4 py-1.5 text-sm font-semibold">
            Plan: {profile.subscription_plan?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) || "Active"}
          </Badge>
        ) : profile?.subscription_status === "expired" ? (
          <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 px-4 py-1.5 text-sm font-semibold cursor-pointer" onClick={() => navigate("/subscription")}>
            Plan Expired – Upgrade Now
          </Badge>
        ) : null}
      </div>

      {/* Smart Alerts */}
      <DashboardAlerts members={members} />

      {/* Low inventory alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors" onClick={() => navigate("/inventory")}>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium">{lowStockItems.length} inventory item(s) below reorder level</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Trainer Stats - Owner with Pro plan */}
      {isOwner && profile?.subscription_plan?.includes("pro") && (
        <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate("/trainers")}>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{activeTrainers.length} Active Trainer(s) · {allTrainers.length} Total</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Manage Trainers</Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-card-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Button key={action.label} variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate(action.path)}>
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Charts — only full analytics for owners */}
      {isOwner && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue vs Expenses */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />Revenue vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Member Growth */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />Member Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Line type="monotone" dataKey="members" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Collection Trend */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />Payment Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paymentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Plan Distribution Pie */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {planData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">No member data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {membersQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
    </div>
  );
};

export default Dashboard;
