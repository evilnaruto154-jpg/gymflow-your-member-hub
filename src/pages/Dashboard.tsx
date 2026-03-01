import { useMemo } from "react";
import { useMembers, getMemberStatus, Member } from "@/hooks/useMembers";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

const Dashboard = () => {
  const { membersQuery } = useMembers();
  const { profile, isTrialing, trialDaysLeft, trialExpired, isActive } = useProfile();
  const members = membersQuery.data ?? [];

  const total = members.length;
  const active = members.filter((m) => getMemberStatus(m.expiry_date) === "active").length;
  const expired = members.filter((m) => getMemberStatus(m.expiry_date) === "expired").length;
  const expiring = members.filter((m) => getMemberStatus(m.expiry_date) === "expiring").length;

  // Revenue chart data (last 6 months)
  const revenueData = useMemo(() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthRevenue = members
        .filter(
          (m) =>
            m.payment_status === "paid" &&
            isWithinInterval(parseISO(m.created_at), { start, end })
        )
        .reduce((sum, m) => sum + m.payment_amount, 0);
      months.push({ month: format(date, "MMM"), revenue: monthRevenue });
    }
    return months;
  }, [members]);

  // Member growth data (last 6 months cumulative)
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

  const stats = [
    { title: "Total Members", value: total, icon: Users, color: "text-primary" },
    { title: "Active", value: active, icon: UserCheck, color: "text-success" },
    { title: "Expired", value: expired, icon: UserX, color: "text-destructive" },
    { title: "Expiring Soon", value: expiring, icon: AlertTriangle, color: "text-warning" },
  ];

  const trialStatusLabel = trialExpired
    ? "Expired"
    : isActive
      ? "Active Subscription"
      : isTrialing
        ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`
        : "Expired";

  const trialBadgeClass = trialExpired
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : isActive
      ? "bg-success/15 text-success border-success/30"
      : "bg-warning/15 text-warning border-warning/30";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your gym</p>
      </div>

      {/* Trial / Subscription Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isActive ? "Subscription Status" : "Trial Status"}
          </CardTitle>
          <Badge variant="outline" className={trialBadgeClass}>
            {trialStatusLabel}
          </Badge>
        </CardHeader>
        <CardContent>
          {isTrialing && !trialExpired && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.max(0, ((7 - trialDaysLeft) / 7) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {7 - trialDaysLeft} of 7 trial days used
              </p>
            </div>
          )}
          {isActive && profile?.subscription_plan && (
            <p className="text-sm text-muted-foreground">
              Plan: <span className="text-foreground font-medium capitalize">{profile.subscription_plan}</span>
              {profile.subscription_end_date && (
                <> · Next billing: {new Date(profile.subscription_end_date).toLocaleDateString()}</>
              )}
            </p>
          )}
          {profile?.trial_used && !isActive && (
            <p className="text-xs text-muted-foreground mt-1">Free trial has been used. Subscribe to continue.</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-card-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`₹${value}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Member Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [value, "Members"]}
                />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {membersQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
