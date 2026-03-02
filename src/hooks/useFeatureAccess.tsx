import { useProfile } from "@/hooks/useProfile";

export type Feature = "members" | "whatsapp" | "attendance" | "expenses" | "reports" | "staff";

const TRIAL_FEATURES: Feature[] = ["members", "whatsapp"];
const ACTIVE_FEATURES: Feature[] = ["members", "whatsapp", "attendance", "expenses", "reports", "staff"];

export function useFeatureAccess() {
  const { isActive, isTrialing, trialExpired, hasAccess } = useProfile();

  const canAccess = (feature: Feature): boolean => {
    if (isActive) return true;
    if (isTrialing && !trialExpired) return TRIAL_FEATURES.includes(feature);
    return false;
  };

  const isLocked = (feature: Feature): boolean => !canAccess(feature);

  return { canAccess, isLocked, hasAccess, isActive, isTrialing, trialExpired };
}
