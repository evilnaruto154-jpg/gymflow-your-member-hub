import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Shield, Users, Crown, Ban, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AdminProfile {
  id: string;
  email: string | null;
  name: string | null;
  gym_name: string | null;
  subscription_status: string;
  subscription_plan: string | null;
  trial_end_date: string | null;
  trial_used: boolean;
  login_provider: string | null;
  created_at: string;
}

const MASTER_EMAIL = "mullahusen999@gmail.com";

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Only master admin can access
  const isMaster = user?.email === MASTER_EMAIL;

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Use an edge function or direct query - since we're master admin with RLS on own profile only,
      // we query via a function. For now, we'll use the profiles table with a special approach.
      // The master admin's RLS only allows seeing own profile, so we need an edge function.
      // As a workaround, let's create a DB function for admin access.
      const { data, error } = await supabase.rpc("admin_list_profiles" as any);
      if (error) throw error;
      return (data ?? []) as AdminProfile[];
    },
    enabled: isMaster,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status, plan }: { userId: string; status: string; plan?: string | null }) => {
      const updates: Record<string, any> = { subscription_status: status };
      if (plan !== undefined) updates.subscription_plan = plan;
      if (status === "active" && !plan) updates.subscription_plan = "pro_monthly";
      if (status === "expired" || status === "blocked") {
        updates.trial_used = true;
      }

      const { error } = await supabase.rpc("admin_update_profile" as any, {
        target_user_id: userId,
        new_status: updates.subscription_status,
        new_plan: updates.subscription_plan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Updated", description: "User status updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!isMaster) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">Only the master admin can access this panel.</p>
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const filtered = users.filter((u) => {
    const matchSearch = !search || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.gym_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.subscription_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.subscription_status === "active").length,
    trialing: users.filter((u) => u.subscription_status === "trialing").length,
    expired: users.filter((u) => u.subscription_status === "expired").length,
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-success/15 text-success border-success/30",
      trialing: "bg-warning/15 text-warning border-warning/30",
      expired: "bg-destructive/15 text-destructive border-destructive/30",
      blocked: "bg-muted text-muted-foreground border-border",
    };
    return styles[status] || styles.expired;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage all GymFlow users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-success" },
          { label: "Trialing", value: stats.trialing, icon: Crown, color: "text-warning" },
          { label: "Expired", value: stats.expired, icon: XCircle, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email, name, or gym..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Gym</TableHead>
              <TableHead className="hidden sm:table-cell">Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Plan</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {usersQuery.isError && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-destructive">
                Failed to load users. Make sure admin functions are deployed.
              </TableCell></TableRow>
            )}
            {!usersQuery.isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
            )}
            {filtered.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{u.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{u.gym_name || "—"}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {u.login_provider || "email"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadge(u.subscription_status)}>
                    {u.subscription_status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground capitalize">
                  {u.subscription_plan?.replace("_", " ") || "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {format(new Date(u.created_at), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {u.subscription_status !== "active" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Activate
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Activate subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will give {u.email} an active Pro subscription.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => updateStatus.mutate({ userId: u.id, status: "active", plan: "pro_monthly" })}>
                              Activate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {u.subscription_status !== "blocked" && u.email !== MASTER_EMAIL && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs text-destructive">
                            <Ban className="h-3 w-3 mr-1" /> Block
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Block user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revoke access for {u.email}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => updateStatus.mutate({ userId: u.id, status: "blocked" })}>
                              Block
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPanel;
