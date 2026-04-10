import { useMemo } from "react";
import { useMembers, getMemberStatus } from "@/hooks/useMembers";
import { useExpenses } from "@/hooks/useExpenses";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserCheck, UserPlus, AlertTriangle, TrendingUp, IndianRupee,
  Clock, CreditCard, Package, ArrowRight, Activity, CalendarCheck
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { DashboardAlerts } from "@/components/DashboardAlerts";
import { useNavigate } from "react-router-dom";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Dashboard = () => {
  const { membersQuery } = useMembers();
  const { expensesQuery } = useExpenses();
  const { lowStockItems } = useInventory();
  const { isTrialing, trialDaysLeft, profile, isActive, trialExpired } = useProfile();
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

  const planData = useMemo(() => {
    const planMap: Record<string, number> = {};
    members.forEach((m) => {
      planMap[m.plan] = (planMap[m.plan] || 0) + 1;
    });
    return Object.entries(planMap).map(([name, value]) => ({ name, value }));
  }, [members]);

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

  // Recent activity from members
  const recentActivity = useMemo(() => {
    return [...members]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((m) => ({
        name: m.name,
        action: m.payment_status === "paid" ? "Membership paid" : "Member added",
        time: format(parseISO(m.created_at), "dd MMM, HH:mm"),
        icon: m.payment_status === "paid" ? IndianRupee : UserPlus,
      }));
  }, [members]);

  const topStats = [
    { title: "Total Members", value: total, icon: Users, trend: `${active} active` },
    { title: "Active Members", value: active, icon: UserCheck, trend: `${expired} expired` },
    { title: "Monthly Revenue", value: `₹${monthlyRevenue.toLocaleString()}`, icon: IndianRupee, trend: `₹${netProfit.toLocaleString()} profit` },
    { title: "Today's Attendance", value: newThisMonth, icon: CalendarCheck, trend: `${expiringSoon} expiring soon` },
  ];

  const quickActions = [
    { label: "Add Member", icon: UserPlus, path: "/members/new" },
    { label: "Record Expense", icon: IndianRupee, path: "/expenses" },
    { label: "Add Inventory", icon: Package, path: "/inventory" },
    { label: "View Members", icon: Users, path: "/members" },
  ];

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back — here's your gym overview</p>
        </div>
        {isTrialing ? (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 px-4 py-1.5 text-sm font-semibold">
            Trial · {trialDaysLeft} Day{trialDaysLeft !== 1 ? "s" : ""} Left
          </Badge>
        ) : isActive ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/25 px-4 py-1.5 text-sm font-semibold">
            {profile?.subscription_plan?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) || "Active"}
          </Badge>
        ) : trialExpired ? (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/25 px-4 py-1.5 text-sm font-semibold cursor-pointer" onClick={() => navigate("/subscription")}>
            Expired — Upgrade
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


      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat) => (
          <Card key={stat.title} className="stat-card border-border bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold font-display text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-3 flex-col gap-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Charts & Activity — only for owners */}
      {isOwner && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue vs Expenses - span 2 */}
            <Card className="lg:col-span-2 border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />Revenue vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueExpenseData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity Panel */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.action}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Member Growth */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />Member Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="members" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#memberGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Collection */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />Payment Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={paymentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="collected" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Plan Distribution */}
          <Card className="border-border bg-card max-w-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {planData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12 text-sm">No member data yet</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {membersQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
    </div>
  );
};

export default Dashboard;
