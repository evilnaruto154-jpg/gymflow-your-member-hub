import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an owner
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "owner");
    
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Only owners can manage trainers" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { trainer_name, trainer_email, phone, password } = payload;

      // Create auth user for the trainer
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: trainer_email,
        password,
        email_confirm: true,
        user_metadata: { full_name: trainer_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign trainer role
      await adminClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role: "trainer",
      });

      // Create trainer record
      const { error: insertError } = await adminClient.from("trainers").insert({
        owner_id: caller.id,
        trainer_name,
        trainer_email,
        phone: phone || "",
        auth_user_id: newUser.user.id,
      });

      if (insertError) {
        // Cleanup: delete the auth user if trainer record fails
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create notification for owner
      await adminClient.from("notifications").insert({
        user_id: caller.id,
        title: "Trainer Added",
        message: `${trainer_name} has been added as a trainer.`,
        type: "member",
      });

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { auth_user_id, new_password } = payload;

      const { error } = await adminClient.auth.admin.updateUserById(auth_user_id, {
        password: new_password,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_status") {
      const { trainer_id, new_status } = payload;

      const { error } = await adminClient
        .from("trainers")
        .update({ status: new_status })
        .eq("id", trainer_id)
        .eq("owner_id", caller.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notification
      await adminClient.from("notifications").insert({
        user_id: caller.id,
        title: new_status === "active" ? "Trainer Activated" : "Trainer Deactivated",
        message: `A trainer has been ${new_status === "active" ? "activated" : "deactivated"}.`,
        type: "member",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
