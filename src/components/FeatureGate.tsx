import { useFeatureAccess, Feature } from "@/hooks/useFeatureAccess";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { isLocked, isTrialing, trialExpired } = useFeatureAccess();
  const navigate = useNavigate();

  if (isLocked(feature)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="rounded-full bg-muted p-6">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold font-display text-foreground">Feature Locked</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {trialExpired 
            ? "Your 7-day trial has expired. Please upgrade to continue." 
            : "This feature requires a plan upgrade to access."}
        </p>
        <Button onClick={() => navigate("/subscription")}>Upgrade Now</Button>
      </div>
    );
  }

  return <>{children}</>;
}
