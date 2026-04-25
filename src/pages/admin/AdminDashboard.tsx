import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminProfiles, AdminProfileRow } from "@/hooks/useAdminData";
import { format } from "date-fns";
import {
  Users, UserCheck, UserX, Clock, Search, ArrowUpDown,
  TrendingUp, ChevronDown,
} from "lucide-react";

// Use shared type from useAdminData
type AdminUser = AdminProfileRow;

type SortField = "name" | "email" | "plan" | "expiry" | "created_at";
type SortDir = "asc" | "desc";

// Derive user plan for display
function getUserPlan(user: AdminUser): "free" | "trial" | "pro" {
  const now = new Date();
  const endDate = user.subscription_end_date
    ? new Date(user.subscription_end_date)
    : user.trial_end_date
      ? new Date(user.trial_end_date)
      : null;

  if (user.subscription_status === "active" && user.subscription_plan && user.subscription_plan !== "free") {
    if (endDate && endDate < now) return "free";
    return "pro";
  }
  if (user.subscription_status === "trialing") {
    if (endDate && endDate < now) return "free";
    return "trial";
  }
  return "free";
}

// Derive user status
function getUserStatus(user: AdminUser): "Active" | "Expired" {
  const now = new Date();
  const endDate = user.subscription_end_date
    ? new Date(user.subscription_end_date)
    : user.trial_end_date
      ? new Date(user.trial_end_date)
      : null;

  if (!endDate) return "Expired";
  if (endDate < now) return "Expired";
  if (user.subscription_status === "active" || user.subscription_status === "trialing") {
    return "Active";
  }
  return "Expired";
}

function getExpiryDate(user: AdminUser): string | null {
  return user.subscription_end_date || user.trial_end_date || null;
}

// Badge component
function PlanBadge({ plan }: { plan: "free" | "trial" | "pro" }) {
  const styles = {
    pro: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    trial: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    free: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[plan]}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: "Active" | "Expired" }) {
  const styles = {
    Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    Expired: "bg-red-500/15 text-red-400 border-red-500/25",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-emerald-400" : "bg-red-400"}`} />
      {status}
    </span>
  );
}

// Stat Card component
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconBg,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#13141a] p-5 group hover:border-white/[0.1] transition-all duration-300`}>
      {/* Background glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className="relative flex items-center gap-4">
        <div className={`flex items-center justify-center h-11 w-11 rounded-xl ${iconBg} shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white font-display">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{title}</p>
        </div>
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch all users
  const usersQuery = useQuery({
    queryKey: ["admin-dashboard-users"],
    queryFn: () => fetchAdminProfiles(),
    retry: 1,
    staleTime: 30_000,
  });

  const users = usersQuery.data ?? [];

  // Computed data
  const enrichedUsers = useMemo(() => {
    return users.map((u) => ({
      ...u,
      _plan: getUserPlan(u),
      _status: getUserStatus(u),
      _expiry: getExpiryDate(u),
    }));
  }, [users]);

  // Stats
  const stats = useMemo(() => {
    const total = enrichedUsers.length;
    const active = enrichedUsers.filter((u) => u._status === "Active" && u._plan !== "free").length;
    const expired = enrichedUsers.filter((u) => u._status === "Expired").length;
    const trial = enrichedUsers.filter((u) => u._plan === "trial" && u._status === "Active").length;
    return { total, active, expired, trial };
  }, [enrichedUsers]);

  // Filtered and sorted
  const filteredUsers = useMemo(() => {
    let result = enrichedUsers;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    // Plan filter
    if (planFilter !== "all") {
      result = result.filter((u) => u._plan === planFilter);
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "email":
          cmp = (a.email || "").localeCompare(b.email || "");
          break;
        case "plan":
          cmp = a._plan.localeCompare(b._plan);
          break;
        case "expiry":
          cmp = (a._expiry || "").localeCompare(b._expiry || "");
          break;
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [enrichedUsers, search, planFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Overview of all GymFlow users and their subscription status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          gradient="bg-violet-600"
          iconBg="bg-gradient-to-br from-violet-500 to-violet-700"
        />
        <StatCard
          title="Active Plans"
          value={stats.active}
          icon={UserCheck}
          gradient="bg-emerald-600"
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <StatCard
          title="Expired Users"
          value={stats.expired}
          icon={UserX}
          gradient="bg-red-600"
          iconBg="bg-gradient-to-br from-red-500 to-red-700"
        />
        <StatCard
          title="Trial Users"
          value={stats.trial}
          icon={Clock}
          gradient="bg-amber-600"
          iconBg="bg-gradient-to-br from-amber-500 to-amber-700"
        />
      </div>

      {/* Users Section */}
      <div className="rounded-xl border border-white/[0.06] bg-[#13141a] overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">All Users</h2>
            <span className="text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
              {filteredUsers.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full sm:w-64 h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <span className="capitalize">{planFilter === "all" ? "All Plans" : planFilter}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1b23] border border-white/[0.08] rounded-lg shadow-xl z-20 py-1 animate-fade-in">
                    {["all", "free", "trial", "pro"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setPlanFilter(opt);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm capitalize transition-colors ${
                          planFilter === opt
                            ? "text-violet-400 bg-violet-500/10"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {opt === "all" ? "All Plans" : opt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {[
                  { label: "Name", field: "name" as SortField },
                  { label: "Email", field: "email" as SortField },
                  { label: "Plan", field: "plan" as SortField },
                  { label: "Plan Expiry", field: "expiry" as SortField },
                  { label: "Status", field: null },
                  { label: "Joined", field: "created_at" as SortField },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-gray-500 font-medium"
                  >
                    {col.field ? (
                      <button
                        onClick={() => handleSort(col.field!)}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                      >
                        {col.label}
                        <ArrowUpDown className={`h-3 w-3 ${sortField === col.field ? "text-violet-400" : ""}`} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {usersQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500/30 border-t-violet-500" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  </td>
                </tr>
              )}
              {usersQuery.isError && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-red-400 text-sm">Failed to load users.</p>
                      <p className="text-gray-500 text-xs max-w-md">Make sure you are logged into the main GymFlow app as the master admin in another tab to access user data.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!usersQuery.isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors duration-150 animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-300 shrink-0">
                        {(user.name || user.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white font-medium truncate max-w-[160px]">
                        {user.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate max-w-[200px] block">
                      {user.email || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={user._plan} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {user._expiry
                        ? format(new Date(user._expiry), "dd MMM yyyy")
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user._status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(user.created_at), "dd MMM yyyy")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!usersQuery.isLoading && filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {filteredUsers.length} of {enrichedUsers.length} users
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
