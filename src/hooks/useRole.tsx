import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "owner" | "staff";

export function useRole() {
  const { user } = useAuth();

  const roleQuery = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data?.map((r: any) => r.role) ?? []) as AppRole[];
    },
    enabled: !!user,
  });

  const roles = roleQuery.data ?? [];
  const isOwner = roles.includes("owner");
  const isStaff = roles.includes("staff");
  const primaryRole: AppRole = isOwner ? "owner" : "staff";

  return { roles, isOwner, isStaff, primaryRole, roleQuery };
}
