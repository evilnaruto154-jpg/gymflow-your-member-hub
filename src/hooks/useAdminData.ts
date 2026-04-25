import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches profiles data for the admin panel.
 * Tries multiple approaches with full logging.
 */
export async function fetchAdminProfiles() {
  console.log("[Admin Debug] Starting fetchAdminProfiles...");

  // Check current Supabase session state
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[Admin Debug] Supabase session:", session ? `Active (${session.user.email})` : "NONE");

  // ─── Approach 1: admin_panel_list_profiles (SECURITY DEFINER) ───
  try {
    console.log("[Admin Debug] Trying admin_panel_list_profiles RPC...");
    const { data, error } = await supabase.rpc("admin_panel_list_profiles" as any);
    console.log("[Admin Debug] RPC admin_panel_list_profiles →", { data: data?.length ?? "null", error: error?.message ?? "none" });
    if (!error && data && Array.isArray(data)) {
      console.log("[Admin Debug] ✅ Got", data.length, "users from admin_panel_list_profiles");
      return data;
    }
  } catch (e) {
    console.log("[Admin Debug] ❌ admin_panel_list_profiles exception:", e);
  }

  // ─── Approach 2: admin_list_profiles (old RPC, needs auth) ───
  try {
    console.log("[Admin Debug] Trying admin_list_profiles RPC...");
    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_list_profiles");
    console.log("[Admin Debug] RPC admin_list_profiles →", { data: rpcData?.length ?? "null", error: rpcError?.message ?? "none" });
    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      console.log("[Admin Debug] ✅ Got", rpcData.length, "users from admin_list_profiles");
      return rpcData;
    }
  } catch (e) {
    console.log("[Admin Debug] ❌ admin_list_profiles exception:", e);
  }

  // ─── Approach 3: Direct table query ───
  try {
    console.log("[Admin Debug] Trying direct profiles table query...");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("[Admin Debug] Direct query →", { data: data?.length ?? "null", error: error?.message ?? "none" });
    if (!error && data && data.length > 0) {
      console.log("[Admin Debug] ✅ Got", data.length, "users from direct query");
      return data;
    }
  } catch (e) {
    console.log("[Admin Debug] ❌ Direct query exception:", e);
  }

  console.error(
    "[Admin Debug] ❌ ALL APPROACHES FAILED.\n" +
    "This is likely because:\n" +
    "1. The admin_panel_list_profiles SQL function hasn't been created in Supabase yet\n" +
    "2. RLS policies on the profiles table block unauthenticated reads\n\n" +
    "FIX: Run the SQL from supabase/admin_panel_setup.sql in your Supabase SQL Editor"
  );
  return [];
}
