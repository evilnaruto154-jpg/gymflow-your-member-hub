import { useProfile } from "@/hooks/useProfile";

export type Feature = "members" | "whatsapp" | "attendance" | "expenses" | "reports" | "inventory" | "analytics";

// Trial includes features mentioned: dashboard, attendance, inventory. We'll allow members.
const TRIAL_FEATURES: Feature[] = ["members", "attendance", "inventory"];

// Starter adds whatsapp, analytics (expiry tracking). We assume cumulative.
const STARTER_FEATURES: Feature[] = ["members", "attendance", "inventory", "whatsapp", "analytics"];

// Pro adds expenses, reports
const PRO_FEATURES: Feature[] = ["members", "attendance", "inventory", "whatsapp", "analytics", "expenses", "reports"];

export function useFeatureAccess() {
  const { isActive, isTrialing, trialExpired, hasAccess, profile } = useProfile();

  const isPro = profile?.subscription_plan?.includes("pro") || false;
  const isStarter = profile?.subscription_plan?.includes("starter") || false;

  const canAccess = (feature: Feature): boolean => {
    if (isActive) {
      if (isPro) return PRO_FEATURES.includes(feature);
      if (isStarter) return STARTER_FEATURES.includes(feature);
      // fallback
      return STARTER_FEATURES.includes(feature);
    }
    if (isTrialing && !trialExpired) return TRIAL_FEATURES.includes(feature);
    return false;
  };

  const isLocked = (feature: Feature): boolean => !canAccess(feature);

  // Return limits as well
  const getMemberLimit = () => {
    if (isActive && isPro) return Infinity;
    if (isActive && isStarter) return 100;
    if (isTrialing && !trialExpired) return 50;
    return 0;
  };

  return { canAccess, isLocked, hasAccess, isActive, isTrialing, trialExpired, isPro, getMemberLimit };
}
