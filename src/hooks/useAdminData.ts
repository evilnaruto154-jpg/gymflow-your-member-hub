import { supabase } from "@/integrations/supabase/client";

export interface AdminProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  subscription_plan: string | null;
  subscription_status: string;
  subscription_end_date: string | null;
  trial_end_date: string | null;
  trial_used: boolean;
  created_at: string;
  gym_name: string | null;
  login_provider: string | null;
  last_login_at: string | null;
  login_count: number;
}

export interface AdminStats {
  total_users: number;
  active_subs: number;
  expired_subs: number;
  active_trials: number;
  expired_trials: number;
  total_logins: number;
  dau: number;
  mau: number;
  new_today: number;
  new_week: number;
  new_month: number;
  paid_users: number;
  trial_started_total: number;
  signup_series: { day: string; n: number }[];
  login_series: { day: string; n: number }[];
  plan_distribution: { plan: string; n: number }[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc("admin_panel_get_stats" as any);
  if (error) throw new Error(`Failed to load stats: ${error.message}`);
  return data as AdminStats;
}

/**
 * Fetches all profiles for the admin panel.
 * Uses admin_panel_list_profiles() — a SECURITY DEFINER function
 * that bypasses RLS and works WITHOUT a Supabase auth session.
 *
 * This is correct because the standalone admin panel uses its own
 * local authentication (hardcoded credentials), not Supabase auth.
 */
export async function fetchAdminProfiles(): Promise<AdminProfileRow[]> {
  console.log("[Admin] Fetching profiles via admin_panel_list_profiles RPC...");

  const { data, error } = await supabase.rpc("admin_panel_list_profiles" as any);

  if (error) {
    console.error("[Admin] RPC error:", error.message, error.details, error.hint);
    throw new Error(
      `Failed to load users: ${error.message}. ` +
      `Make sure you have run the latest migration SQL in your Supabase SQL Editor.`
    );
  }

  if (!data || !Array.isArray(data)) {
    console.warn("[Admin] RPC returned empty/null data");
    return [];
  }

  console.log(`[Admin] ✅ Loaded ${data.length} profiles`);
  return data as AdminProfileRow[];
}

/**
 * Admin: update a user's subscription status/plan.
 * Uses admin_update_profile() SECURITY DEFINER function.
 * Requires the caller to be authenticated as mullahusen999@gmail.com
 * (checked inside the SQL function).
 */
export async function adminUpdateProfile(
  targetUserId: string,
  newStatus: string,
  newPlan?: string | null
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_profile" as any, {
    target_user_id: targetUserId,
    new_status: newStatus,
    new_plan: newPlan ?? null,
  });

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
