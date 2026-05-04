import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * /auth/callback
 *
 * Supabase redirects here after OAuth (Google) sign-in with a `code` param.
 * We exchange the code for a session, then send the user to /dashboard.
 * The onAuthStateChange listener in useAuth will also fire SIGNED_IN,
 * but handling it here ensures the callback URL itself never shows a 404.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Processing Auth Callback...");
        
        // Supabase auto-handles the OAuth code/token in the URL.
        // We add a small delay to ensure it finishes parsing before we fetch session.
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error in callback:", error.message);
          navigate("/auth", { replace: true });
          return;
        }

        if (data?.session) {
          console.log("Session successfully retrieved, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.log("No session found in callback, redirecting to auth");
          navigate("/auth", { replace: true });
        }
      } catch (err) {
        console.error("Error during auth callback:", err);
        navigate("/auth", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
