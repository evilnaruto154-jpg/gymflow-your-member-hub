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
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      if (errorParam) {
        console.error("OAuth error:", errorParam, errorDescription);
        navigate(`/auth?error=${encodeURIComponent(errorDescription || errorParam)}`, { replace: true });
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Code exchange failed:", error.message);
          navigate("/auth", { replace: true });
          return;
        }
      }

      // Session is now set; onAuthStateChange will also fire.
      // Navigate to dashboard as a safe fallback.
      navigate("/dashboard", { replace: true });
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
