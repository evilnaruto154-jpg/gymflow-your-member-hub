import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminProfiles, adminUpdateProfile, AdminProfileRow } from "@/hooks/useAdminData";
import { format } from "date-fns";
import {
  Users, Search, ArrowUpDown, ChevronDown, Mail, Calendar,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";

type SortField = "name" | "email" | "plan" | "expiry" | "created_at";
type SortDir = "asc" | "desc";

function getUserPlan(user: AdminProfileRow): "free" | "trial" | "pro" {
  const now = new Date();
  const endDate = user.subscription_end_date
    ? new Date(user.subscription_end_date)
    : user.trial_end_date
      ? new Date(user.trial_end_date)
      : null;

  if (
    user.subscription_status === "active" &&
    user.subscription_plan &&
    user.subscription_plan !== "free"
  ) {
    if (endDate && endDate < now) return "free";
    return "pro";
  }
  if (user.subscription_status === "trialing") {
    if (endDate && endDate < now) return "free";
    return "trial";
  }
  return "free";
}

function getUserStatus(user: AdminProfileRow): "Active" | "Expired" {
  const now = new Date();
  const endDate = user.subscription_end_date
    ? new Date(user.subscription_end_date)
    : user.trial_end_date
      ? new Date(user.trial_end_date)
      : null;

  if (!endDate) return "Expired";
  if (endDate < now) return "Expired";
  if (
    user.subscription_status === "active" ||
    user.subscription_status === "trialing"
  ) {
    return "Active";
  }
  return "Expired";
}

function getExpiryDate(user: AdminProfileRow): string | null {
  return user.subscription_end_date || user.trial_end_date || null;
}

function PlanBadge({ plan }: { plan: "free" | "trial" | "pro" }) {
  const styles = {
    pro: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    trial: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    free: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[plan]}`}
    >
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
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
      {status}
    </span>
  );
}

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users-page"],
    queryFn: () => fetchAdminProfiles(),
    retry: 1,
    staleTime: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({
      userId,
      status,
      plan,
    }: {
      userId: string;
      status: string;
      plan?: string | null;
    }) => adminUpdateProfile(userId, status, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
    },
  });

  const users = usersQuery.data ?? [];

  const enrichedUsers = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        _plan: getUserPlan(u),
        _status: getUserStatus(u),
        _expiry: getExpiryDate(u),
      })),
    [users]
  );

  const filteredUsers = useMemo(() => {
    let result = enrichedUsers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    if (planFilter !== "all") {
      result = result.filter((u) => u._plan === planFilter);
    }

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

  // Error state with setup instructions
  if (usersQuery.isError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white font-display tracking-tight">Users</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and view all registered users</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-sm">Failed to load users</p>
              <p className="text-gray-400 text-xs mt-1">
                {(usersQuery.error as Error)?.message}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-black/30 rounded-lg p-4 space-y-2">
            <p className="font-medium text-gray-300">Fix: Run this SQL in Supabase Dashboard → SQL Editor</p>
            <pre className="text-gray-500 overflow-auto text-[10px] leading-relaxed">
{`-- Run the migration file:
-- supabase/migrations/20260425000000_complete_system_fix.sql`}
            </pre>
          </div>
          <button
            onClick={() => usersQuery.refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-sm hover:bg-violet-500/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display tracking-tight">Users</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and view all registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
            <Users className="h-4 w-4 text-violet-400" />
            <span>{enrichedUsers.length} total users</span>
          </div>
          <button
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${usersQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#13141a] border border-white/[0.08] text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#13141a] border border-white/[0.08] text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <span className="capitalize">
              {planFilter === "all" ? "All Plans" : planFilter}
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showFilterMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFilterMenu(false)}
              />
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

      {/* Users Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[#13141a] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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
                  { label: "Actions", field: null },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-medium"
                  >
                    {col.field ? (
                      <button
                        onClick={() => handleSort(col.field!)}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                      >
                        {col.label}
                        <ArrowUpDown
                          className={`h-3 w-3 ${
                            sortField === col.field ? "text-violet-400" : ""
                          }`}
                        />
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
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500/30 border-t-violet-500" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!usersQuery.isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-gray-500 text-sm"
                  >
                    {search || planFilter !== "all"
                      ? "No users match your filter."
                      : "No users found. Make sure the migration SQL has been run in Supabase."}
                  </td>
                </tr>
              )}
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors duration-150 animate-fade-in"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-300 shrink-0">
                        {(user.name || user.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white font-medium truncate max-w-[180px]">
                        {user.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-400">{user.email || "—"}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <PlanBadge plan={user._plan} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {user._expiry
                        ? format(new Date(user._expiry), "dd MMM yyyy")
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={user._status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(user.created_at), "dd MMM yyyy")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {user.subscription_status !== "active" && (
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              userId: user.id,
                              status: "active",
                              plan: "pro_monthly",
                            })
                          }
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Activate
                        </button>
                      )}
                      {user.subscription_status !== "blocked" &&
                        user.email !== "mullahusen999@gmail.com" && (
                          <button
                            onClick={() =>
                              updateStatus.mutate({
                                userId: user.id,
                                status: "blocked",
                              })
                            }
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Block
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {usersQuery.isLoading && (
            <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500/30 border-t-violet-500" />
              <span className="text-sm">Loading users...</span>
            </div>
          )}
          {!usersQuery.isLoading && filteredUsers.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm">
              No users found.
            </div>
          )}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
              onClick={() =>
                setExpandedUserId(
                  expandedUserId === user.id ? null : user.id
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center text-sm font-medium text-violet-300 shrink-0">
                    {(user.name || user.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {user.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PlanBadge plan={user._plan} />
                  <StatusBadge status={user._status} />
                </div>
              </div>

              {expandedUserId === user.id && (
                <div className="grid grid-cols-2 gap-2 pl-13 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    Expiry:{" "}
                    {user._expiry
                      ? format(new Date(user._expiry), "dd MMM yyyy")
                      : "—"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Mail className="h-3 w-3" />
                    Joined: {format(new Date(user.created_at), "dd MMM yyyy")}
                  </div>
                  <div className="col-span-2 flex gap-2 mt-1">
                    {user.subscription_status !== "active" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({
                            userId: user.id,
                            status: "active",
                            plan: "pro_monthly",
                          });
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Activate
                      </button>
                    )}
                    {user.subscription_status !== "blocked" &&
                      user.email !== "mullahusen999@gmail.com" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({
                              userId: user.id,
                              status: "blocked",
                            });
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs"
                        >
                          <XCircle className="h-3 w-3" />
                          Block
                        </button>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
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

export default AdminUsers;
