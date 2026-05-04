import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  gym_name: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_used: boolean;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_end_date: string | null;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  login_provider: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      console.log("[Profile] Fetching profile for user:", user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!data) {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 7);

        const newProfile = {
          id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
          subscription_status: "trialing" as const,
          subscription_plan: "pro_trial",
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          trial_used: false,
        };

        const { data: created, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw new Error(createError.message);
        return created as Profile;
      }

      console.log("[Profile] Fetched:", {
        status: data.subscription_status,
        plan: data.subscription_plan,
        trial_end: data.trial_end_date,
        trial_used: data.trial_used,
      });

      // Self-heal: if status is missing/incomplete, assign a new trial
      if (
        !data.subscription_status ||
        data.subscription_status === "incomplete" ||
        data.subscription_status === ""
      ) {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 7);

        const updates = {
          subscription_status: "trialing",
          subscription_plan: "pro_trial",
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          trial_used: false,
        };

        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        return { ...data, ...updates } as Profile;
      }

      // Self-heal: if trialing but trial_end_date has passed, mark expired
      if (
        data.subscription_status === "trialing" &&
        data.trial_end_date &&
        new Date(data.trial_end_date).getTime() < Date.now()
      ) {
        const updates = {
          subscription_status: "expired",
          trial_used: true,
        };

        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        return { ...data, ...updates } as Profile;
      }

      return data as Profile;
    },
    enabled: !!user,
    staleTime: 5_000, // Reduced from 60s to 5s — prevents stale "No Plan" after trial activation
    refetchOnWindowFocus: true,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("Not authenticated");
      console.log("[Profile] Updating profile:", updates);

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("[Profile] Update error:", error.message);
        throw new Error(error.message);
      }

      console.log("[Profile] ✅ Update successful, DB returned:", {
        status: data?.subscription_status,
        plan: data?.subscription_plan,
      });

      return data as Profile;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["profile", user?.id] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<Profile | null>(["profile", user?.id]);

      // Optimistically update the cache immediately
      if (previousProfile) {
        queryClient.setQueryData<Profile>(["profile", user?.id], {
          ...previousProfile,
          ...updates,
        });
        console.log("[Profile] ⚡ Optimistic update applied:", {
          status: updates.subscription_status || previousProfile.subscription_status,
          plan: updates.subscription_plan || previousProfile.subscription_plan,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile", user?.id], context.previousProfile);
        console.error("[Profile] ❌ Rolling back optimistic update due to error");
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure server state
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const profile = profileQuery.data ?? null;

  const isTrialing = profile?.subscription_status === "trialing";
  const isActive = profile?.subscription_status === "active";
  const isExpired = profile?.subscription_status === "expired";
  const isBlocked = profile?.subscription_status === "blocked";

  const trialDaysLeft = profile?.trial_end_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.trial_end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Trial is expired ONLY if:
  //   - Status is "trialing" but end date has passed, OR
  //   - Status is explicitly "expired" or "blocked"
  const trialExpired =
    (isTrialing && trialDaysLeft <= 0) ||
    isExpired ||
    isBlocked;

  // Has full access if:
  //   - Active paid subscription, OR
  //   - Trialing with days remaining (= full Pro access during trial)
  const hasAccess = isActive || (isTrialing && trialDaysLeft > 0);

  return {
    profile,
    profileQuery,
    updateProfile,
    isTrialing,
    isActive,
    isExpired,
    isBlocked,
    trialDaysLeft,
    trialExpired,
    hasAccess,
  };
}
