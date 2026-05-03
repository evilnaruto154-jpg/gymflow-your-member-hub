import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Check, X, Eye, EyeOff } from "lucide-react";

function scorePassword(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isRecovery, setIsRecovery] = useState<null | boolean>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase v2 fires PASSWORD_RECOVERY when the user lands via a reset link.
    // The hash also contains type=recovery; check both for robustness.
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (hash.includes("type=recovery") || search.includes("type=recovery")) {
      setIsRecovery(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    // After a brief tick, if we still don't have recovery, mark as false (invalid link)
    const t = setTimeout(() => {
      setIsRecovery((prev) => (prev === null ? false : prev));
    }, 800);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const { checks, score } = scorePassword(password);
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = score >= 4 && passwordsMatch && !confirming;

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
    setConfirming(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setConfirming(false);
      return;
    }
    // Sign out so the user must log in fresh with the new password
    await supabase.auth.signOut();
    toast({ title: "Password updated", description: "Sign in with your new password." });
    navigate("/auth", { replace: true });
    setConfirming(false);
  };

  if (isRecovery === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isRecovery === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">This reset link is invalid or has expired.</p>
            <Button onClick={() => navigate("/auth")}>Request a new link</Button>
          </CardContent>
        </Card>
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
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">GymFlow</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">New password</Label>
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
                <Label htmlFor="confirm-pw">Confirm password</Label>
                <Input
                  id="confirm-pw"
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {confirm.length > 0 && !passwordsMatch && (
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
                {confirming ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
    } else {
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/auth", { replace: true });
    }
    setConfirming(false);
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid or expired reset link. Please request a new one.</p>
            <Button className="mt-4" onClick={() => navigate("/auth")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">GymFlow</h1>
        </div>
        <Card>
          <CardHeader><CardTitle>Set New Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={confirming}>
                {confirming ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
