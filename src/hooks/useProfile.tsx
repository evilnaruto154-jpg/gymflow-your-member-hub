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

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[Profile] Fetch error:", error.message);
        throw new Error(error.message);
      }

      if (!data) {
        // Profile not found — this should not happen due to trigger,
        // but we create it defensively with auto-trial.
        console.warn("[Profile] No profile found, creating one with 7-day trial...");
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

        if (createError) {
          console.error("[Profile] Create error:", createError.message);
          throw new Error(createError.message);
        }
        console.log("[Profile] ✅ Created new profile with 7-day trial");
        return created as Profile;
      }

      // Self-heal: if status is missing/incomplete, assign a new trial
      if (
        !data.subscription_status ||
        data.subscription_status === "incomplete" ||
        data.subscription_status === ""
      ) {
        console.log("[Profile] Self-healing: setting trial status...");
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

        const { error: updateError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (updateError) {
          console.error("[Profile] Self-heal update error:", updateError.message);
        }

        return { ...data, ...updates } as Profile;
      }

      // Self-heal: if trialing but trial_end_date has passed, mark expired
      if (
        data.subscription_status === "trialing" &&
        data.trial_end_date &&
        new Date(data.trial_end_date).getTime() < Date.now()
      ) {
        console.log("[Profile] Auto-expiring trial (end date passed)...");
        const updates = {
          subscription_status: "expired",
          trial_used: true,
        };

        const { error: updateError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (updateError) {
          console.error("[Profile] Auto-expire error:", updateError.message);
        }

        return { ...data, ...updates } as Profile;
      }

      return data as Profile;
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("[Profile] Update error:", error.message);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
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
