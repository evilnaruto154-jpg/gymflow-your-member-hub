import { useFeatureAccess, Feature } from "@/hooks/useFeatureAccess";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { isLocked } = useFeatureAccess();
  const navigate = useNavigate();

  if (isLocked(feature)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="rounded-full bg-muted p-6">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold font-display text-foreground">Feature Locked</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your 7-day trial has expired. Please upgrade to continue using this feature.
        </p>
        <Button onClick={() => navigate("/subscription")}>Upgrade Now</Button>
      </div>
    );
  }

  return <>{children}</>;
}
