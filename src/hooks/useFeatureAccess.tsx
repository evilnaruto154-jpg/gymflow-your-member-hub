import { useProfile } from "@/hooks/useProfile";

export type Feature = "members" | "whatsapp" | "attendance" | "expenses" | "reports" | "staff" | "trainers";

const TRIAL_FEATURES: Feature[] = ["members", "whatsapp"];
const STARTER_FEATURES: Feature[] = ["members", "whatsapp", "attendance", "expenses", "reports", "staff"];
const PRO_FEATURES: Feature[] = ["members", "whatsapp", "attendance", "expenses", "reports", "staff", "trainers"];

export function useFeatureAccess() {
  const { isActive, isTrialing, trialExpired, hasAccess, profile } = useProfile();

  const isPro = profile?.subscription_plan?.includes("pro") || false;

  const canAccess = (feature: Feature): boolean => {
    if (isActive) {
      if (isPro) return PRO_FEATURES.includes(feature);
      return STARTER_FEATURES.includes(feature);
    }
    if (isTrialing && !trialExpired) return TRIAL_FEATURES.includes(feature);
    return false;
  };

  const isLocked = (feature: Feature): boolean => !canAccess(feature);

  return { canAccess, isLocked, hasAccess, isActive, isTrialing, trialExpired, isPro };
}
