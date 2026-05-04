import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, KeyRound, CheckCircle, AlertTriangle, Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type PageState = "loading" | "form" | "success" | "error";

function scorePassword(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  return { checks, score: Object.values(checks).filter(Boolean).length };
}

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token") && hash.includes("type=recovery")) {
        await new Promise((r) => setTimeout(r, 500));
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) {
            setErrorMessage("Invalid or expired reset link. Please request a new one.");
            setPageState("error");
          }
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!cancelled) {
        if (session) {
          setPageState("form");
        } else {
          setErrorMessage("Invalid or expired reset link. Please request a new one.");
          setPageState("error");
        }
      }
    };

    const timer = setTimeout(checkSession, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const { checks, score } = scorePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = score >= 4 && passwordsMatch && !submitting;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 4) {
      toast({ title: "Weak password", description: "Use 8+ chars with upper, lower, number & symbol.", variant: "destructive" });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: "Passwords don't match", description: "Please confirm your new password.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    setPageState("success");
    toast({ title: "Password updated", description: "Your password has been changed successfully." });

    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    }, 2500);
  };

  const handleRequestNewLink = () => {
    navigate("/auth");
  };

  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground">GymFlow</h1>
          </div>
          <Card className="border-destructive/30 bg-card">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-destructive" />
                </div>
              </div>
              <h2 className="text-lg font-bold font-display text-foreground">Link Expired</h2>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={handleRequestNewLink} className="w-full">Request New Reset Link</Button>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="w-full text-muted-foreground">Back to Login</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground">GymFlow</h1>
          </div>
          <Card className="border-success/30 bg-card">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-success" />
                </div>
              </div>
              <h2 className="text-lg font-bold font-display text-foreground">Password Updated!</h2>
              <p className="text-muted-foreground text-sm">Your password has been changed successfully. Redirecting to login…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className="flex items-center gap-2 text-xs">
      {ok ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">GymFlow</h1>
        </div>
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl font-display">Set New Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm Password</Label>
                <Input
                  id="confirm-pw"
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords don't match.</p>
                )}
              </div>

              <ul className="grid grid-cols-2 gap-1 pt-1">
                <Rule ok={checks.length} label="8+ characters" />
                <Rule ok={checks.upper} label="Uppercase" />
                <Rule ok={checks.lower} label="Lowercase" />
                <Rule ok={checks.number} label="Number" />
                <Rule ok={checks.symbol} label="Symbol" />
              </ul>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
