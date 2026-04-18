import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches profiles data for the admin panel.
 * Uses the admin_panel_list_profiles SECURITY DEFINER function
 * which bypasses RLS and works without an authenticated session.
 *
 * Fallback chain:
 * 1. admin_panel_list_profiles (new, works without auth)
 * 2. admin_list_profiles (old, needs master auth)
 * 3. Direct table query (needs authenticated session with RLS access)
 */
export async function fetchAdminProfiles() {
  // Approach 1: New admin panel function (SECURITY DEFINER, works with anon key)
  try {
    const { data, error } = await supabase.rpc("admin_panel_list_profiles" as any);
    if (!error && data && Array.isArray(data) && data.length >= 0) {
      return data;
    }
  } catch {
    // Function doesn't exist yet, continue
  }

  // Approach 2: Old admin RPC (needs master session)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_list_profiles");
    if (!rpcError && rpcData) {
      return rpcData;
    }
  } catch {
    // Not available
  }

  // Approach 3: Direct table query (needs session with RLS access)
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, subscription_plan, subscription_status, subscription_end_date, trial_end_date, trial_used, created_at, gym_name, login_provider")
    .order("created_at", { ascending: false });

  if (!error && data) {
    return data;
  }

  console.warn(
    "[GymFlow Admin] Could not fetch profiles. Please run the SQL setup script in Supabase:\n" +
    "Go to Supabase Dashboard → SQL Editor → paste contents of supabase/admin_panel_setup.sql"
  );
  return [];
}
