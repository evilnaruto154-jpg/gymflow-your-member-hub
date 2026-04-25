import { useProfile } from "@/hooks/useProfile";

export type Feature =
  | "members"
  | "whatsapp"
  | "attendance"
  | "expenses"
  | "reports"
  | "inventory"
  | "analytics";

// Trial: access to all core features
const TRIAL_FEATURES: Feature[] = [
  "members",
  "attendance",
  "expenses",
  "inventory",
];

// Starter: adds analytics + whatsapp
const STARTER_FEATURES: Feature[] = [
  "members",
  "attendance",
  "expenses",
  "inventory",
  "whatsapp",
  "analytics",
];

// Pro: all features
const PRO_FEATURES: Feature[] = [
  "members",
  "attendance",
  "expenses",
  "inventory",
  "whatsapp",
  "analytics",
  "reports",
];

export function useFeatureAccess() {
  const { isActive, isTrialing, trialExpired, hasAccess, profile } =
    useProfile();

  const isPro =
    isActive &&
    (profile?.subscription_plan?.includes("pro") ||
      profile?.subscription_plan?.includes("yearly"));

  const isStarter =
    isActive && profile?.subscription_plan?.includes("starter");

  const canAccess = (feature: Feature): boolean => {
    if (isActive) {
      if (isPro) return PRO_FEATURES.includes(feature);
      if (isStarter) return STARTER_FEATURES.includes(feature);
      // Active but no specific plan — give starter access
      return STARTER_FEATURES.includes(feature);
    }
    if (isTrialing && !trialExpired) {
      return TRIAL_FEATURES.includes(feature);
    }
    return false;
  };

  const isLocked = (feature: Feature): boolean => !canAccess(feature);

  const getMemberLimit = (): number => {
    if (isActive && isPro) return Infinity;
    if (isActive && isStarter) return 100;
    if (isTrialing && !trialExpired) return 50;
    return 0;
  };

  return {
    canAccess,
    isLocked,
    hasAccess,
    isActive,
    isTrialing,
    trialExpired,
    isPro,
    isStarter,
    getMemberLimit,
  };
}
