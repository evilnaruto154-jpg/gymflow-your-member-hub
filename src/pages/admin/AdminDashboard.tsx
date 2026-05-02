import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats, fetchAdminProfiles } from "@/hooks/useAdminData";
import {
  Users, UserCheck, UserX, Clock, AlertCircle, LogIn,
  Activity, CalendarDays, TrendingUp, DollarSign, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

const PIE_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

function Kpi({
  title, value, icon: Icon, accent,
}: { title: string; value: number | string; icon: React.ElementType; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#13141a] p-4 group hover:border-white/[0.12] transition-all">
      <div className={`absolute -top-10 -right-10 w-28 h-28 ${accent} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className="relative flex items-center gap-3">
        <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${accent} shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-white font-display leading-none">{value}</p>
          <p className="text-[11px] text-gray-400 mt-1 truncate">{title}</p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#13141a] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#1a1b23",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      fontSize: 12,
      color: "#fff",
    },
    labelStyle: { color: "#9ca3af" },
  } as const;
}

const AdminDashboard = () => {
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    retry: 1,
    staleTime: 30_000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: fetchAdminProfiles,
    retry: 1,
    staleTime: 30_000,
  });

  const stats = statsQuery.data;
  const recentUsers = (usersQuery.data ?? []).slice(0, 6);

  // Conversion: paid / trial_started
  const conversionRate = stats && stats.trial_started_total > 0
    ? Math.round((stats.paid_users / stats.trial_started_total) * 100)
    : 0;

  // Build series with day formatting
  const signupSeries = (stats?.signup_series ?? []).map((d) => ({
    day: format(parseISO(d.day), "MMM d"),
    users: d.n,
  }));
  const loginSeries = (stats?.login_series ?? []).map((d) => ({
    day: format(parseISO(d.day), "MMM d"),
    logins: d.n,
  }));

  // Subscription growth: cumulative paid users approximation = same as signups bar
  const subscriptionGrowth = signupSeries.map((d) => ({ day: d.day, signups: d.users }));

  const planDist = (stats?.plan_distribution ?? []).map((p) => ({
    name: p.plan === "none" || !p.plan ? "No plan" : p.plan,
    value: p.n,
  }));

  if (statsQuery.isError) {
    return (
      <div className="max-w-3xl mx-auto rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
        Failed to load analytics: {(statsQuery.error as Error).message}
      </div>
    );
  }

  const loading = statsQuery.isLoading;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-display tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time analytics across users, subscriptions, and activity
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Live data · refreshed automatically
        </div>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[#13141a] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Kpi title="Total Users" value={stats!.total_users} icon={Users} accent="bg-gradient-to-br from-violet-500 to-violet-700" />
          <Kpi title="Active Subscriptions" value={stats!.active_subs} icon={UserCheck} accent="bg-gradient-to-br from-emerald-500 to-emerald-700" />
          <Kpi title="Expired Subscriptions" value={stats!.expired_subs} icon={UserX} accent="bg-gradient-to-br from-red-500 to-red-700" />
          <Kpi title="Active Trials" value={stats!.active_trials} icon={Clock} accent="bg-gradient-to-br from-amber-500 to-amber-700" />
          <Kpi title="Expired Trials" value={stats!.expired_trials} icon={AlertCircle} accent="bg-gradient-to-br from-orange-500 to-orange-700" />
          <Kpi title="Total Logins" value={stats!.total_logins} icon={LogIn} accent="bg-gradient-to-br from-blue-500 to-blue-700" />
          <Kpi title="DAU" value={stats!.dau} icon={Activity} accent="bg-gradient-to-br from-cyan-500 to-cyan-700" />
          <Kpi title="MAU" value={stats!.mau} icon={CalendarDays} accent="bg-gradient-to-br from-indigo-500 to-indigo-700" />
          <Kpi title="New (Today / Week / Month)" value={`${stats!.new_today} / ${stats!.new_week} / ${stats!.new_month}`} icon={TrendingUp} accent="bg-gradient-to-br from-pink-500 to-pink-700" />
          <Kpi title="Trial → Paid" value={`${conversionRate}%`} icon={DollarSign} accent="bg-gradient-to-br from-fuchsia-500 to-fuchsia-700" />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="User Growth" subtitle="New signups · last 30 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={signupSeries} margin={{ left: -20, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle()} />
              <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#gUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Login Activity" subtitle="Total logins per day · last 30 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loginSeries} margin={{ left: -20, right: 6, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle()} />
              <Line type="monotone" dataKey="logins" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Subscription Growth" subtitle="Signups by day">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subscriptionGrowth} margin={{ left: -20, right: 6, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle()} />
              <Bar dataKey="signups" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Plan Distribution" subtitle="Users per subscription plan">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              <Pie data={planDist} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {planDist.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="rounded-xl border border-white/[0.06] bg-[#13141a] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Signups</h3>
          <div className="space-y-2">
            {usersQuery.isLoading && (
              <div className="text-xs text-gray-500">Loading…</div>
            )}
            {recentUsers.length === 0 && !usersQuery.isLoading && (
              <div className="text-xs text-gray-500">No recent users.</div>
            )}
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-1.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center text-[10px] font-medium text-violet-300 shrink-0">
                  {(u.name || u.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{u.name || u.email || "—"}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {format(new Date(u.created_at), "dd MMM, HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;