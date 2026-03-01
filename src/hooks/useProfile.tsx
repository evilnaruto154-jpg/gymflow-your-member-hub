import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  trial_start_date: string;
  trial_end_date: string;
  subscription_status: string;
  subscription_plan: string | null;
  subscription_end_date: string | null;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const profile = profileQuery.data;

  const isTrialing = profile?.subscription_status === "trialing";
  const isActive = profile?.subscription_status === "active";
  const isExpired = profile?.subscription_status === "expired";

  const trialDaysLeft = profile?.trial_end_date
    ? Math.max(0, Math.ceil((new Date(profile.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const trialExpired = isTrialing && trialDaysLeft <= 0;

  const hasAccess = isActive || (isTrialing && !trialExpired);

  return {
    profile,
    profileQuery,
    updateProfile,
    isTrialing,
    isActive,
    isExpired,
    trialDaysLeft,
    trialExpired,
    hasAccess,
  };
}
