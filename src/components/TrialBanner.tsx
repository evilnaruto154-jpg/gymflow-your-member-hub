import { useProfile } from "@/hooks/useProfile";
import { Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TrialBanner() {
  const { isTrialing, trialDaysLeft, trialExpired, isExpired } = useProfile();
  const navigate = useNavigate();

  // Show banner for: active trial, expired trial, or expired subscription
  if (!isTrialing && !isExpired) return null;

  const isUrgent = isTrialing && trialDaysLeft <= 2 && trialDaysLeft > 0;
  const isExpiredState = trialExpired;

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-sm font-medium ${
        isExpiredState
          ? "bg-destructive text-destructive-foreground"
          : isUrgent
            ? "bg-warning text-warning-foreground"
            : "bg-primary/10 text-primary"
      }`}
    >
      <div className="flex items-center gap-2">
        {isExpiredState ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        {isExpiredState
          ? "Your free PRO trial has expired. Subscribe to continue using all features."
          : `🎉 PRO Trial active — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} of full access remaining.`}
      </div>
      <button
        onClick={() => navigate("/subscription")}
        className="underline hover:no-underline font-semibold"
      >
        {isExpiredState ? "Subscribe Now" : "View Plans"}
      </button>
    </div>
  );
}
