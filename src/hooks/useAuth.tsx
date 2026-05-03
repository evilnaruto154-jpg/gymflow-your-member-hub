import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Subscribe to auth state changes first (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // PASSWORD_RECOVERY event — redirect to reset-password page, NOT dashboard
        if (event === "PASSWORD_RECOVERY" && session) {
          console.log("[Auth] PASSWORD_RECOVERY detected, redirecting to /reset-password");
          setTimeout(() => {
            navigate("/reset-password", { replace: true });
          }, 0);
          return; // Do NOT fall through to SIGNED_IN handling
        }

        // On successful OAuth / email sign-in, redirect to dashboard
        // But SKIP if user is already on /reset-password (they're resetting their password)
        if (event === "SIGNED_IN" && session) {
          // Don't redirect away from reset-password page
          if (window.location.pathname === "/reset-password") {
            console.log("[Auth] SIGNED_IN on /reset-password — staying on page");
            return;
          }

          // Record login event (fire-and-forget)
          setTimeout(() => {
            supabase.rpc("record_login_event" as any).then(({ error }) => {
              if (error) console.warn("[Auth] record_login_event:", error.message);
            });
          }, 0);

          // Use setTimeout to avoid React state flush + navigate collision
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 0);
        }

        if (event === "SIGNED_OUT") {
          queryClient.clear();
          navigate("/", { replace: true });
        }
      }
    );

    // 2. Hydrate session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name || "",
          signup_role: "owner",
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
