import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const todayStr = today.toISOString().split("T")[0];
    const in3DaysStr = in3Days.toISOString().split("T")[0];

    // Get all profiles (gym owners)
    const { data: profiles } = await supabase.from("profiles").select("id, subscription_status, subscription_end_date");

    for (const profile of profiles ?? []) {
      const userId = profile.id;

      // Check subscription expiry
      if (profile.subscription_end_date) {
        const subEnd = new Date(profile.subscription_end_date);
        subEnd.setHours(0, 0, 0, 0);
        const daysUntilExpiry = Math.ceil((subEnd.getTime() - today.getTime()) / 86400000);

        if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Subscription Expiring Soon",
            message: `Your GymFlow subscription will expire on ${subEnd.toLocaleDateString()}. Renew now to avoid interruption.`,
            type: "subscription",
          });
        } else if (daysUntilExpiry <= 0 && profile.subscription_status !== "expired") {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Subscription Expired",
            message: "Your subscription has expired. Please renew to continue managing your gym.",
            type: "subscription",
          });
        }
      }

      // Check member expiry
      const { data: members } = await supabase
        .from("members")
        .select("id, name, expiry_date")
        .eq("user_id", userId);

      let expiringIn3Days = 0;
      let expiredToday = 0;
      let totalExpired = 0;
      let totalActive = 0;

      for (const m of members ?? []) {
        const exp = new Date(m.expiry_date);
        exp.setHours(0, 0, 0, 0);

        if (exp < today) {
          totalExpired++;
        } else if (exp.getTime() === today.getTime()) {
          expiredToday++;
        } else if (exp <= in3Days) {
          expiringIn3Days++;
        } else {
          totalActive++;
        }
      }

      if (expiringIn3Days > 0) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Members Expiring Soon",
          message: `${expiringIn3Days} member${expiringIn3Days > 1 ? "s are" : " is"} expiring in the next 3 days.`,
          type: "member",
        });
      }

      if (expiredToday > 0) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Membership Expired Today",
          message: `${expiredToday} member${expiredToday > 1 ? "s'" : "'s"} plan${expiredToday > 1 ? "s have" : " has"} expired today.`,
          type: "member",
        });
      }

      // Daily summary
      if ((members ?? []).length > 0) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Daily Summary",
          message: `Today: ${totalActive} Active, ${expiringIn3Days} Expiring Soon, ${totalExpired + expiredToday} Expired.`,
          type: "member",
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
