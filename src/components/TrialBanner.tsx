import { useProfile } from "@/hooks/useProfile";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const { isTrialing, trialDaysLeft, trialExpired } = useProfile();
  const navigate = useNavigate();

  if (!isTrialing) return null;

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-sm font-medium ${
        trialExpired
          ? "bg-destructive text-destructive-foreground"
          : trialDaysLeft <= 2
            ? "bg-warning text-warning-foreground"
            : "bg-primary/10 text-primary"
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {trialExpired
          ? "Your free trial has expired."
          : `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}.`}
      </div>
      <button
        onClick={() => navigate("/subscription")}
        className="underline hover:no-underline font-semibold"
      >
        {trialExpired ? "Subscribe Now" : "Upgrade"}
      </button>
    </div>
  );
}
