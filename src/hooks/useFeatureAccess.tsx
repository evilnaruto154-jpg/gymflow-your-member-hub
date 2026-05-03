import { useProfile } from "@/hooks/useProfile";

export type Feature =
  | "members"
  | "whatsapp"
  | "attendance"
  | "expenses"
  | "reports"
  | "inventory"
  | "analytics";

// All features available in the system
const ALL_FEATURES: Feature[] = [
  "members",
  "attendance",
  "expenses",
  "inventory",
  "whatsapp",
  "analytics",
  "reports",
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
const PRO_FEATURES: Feature[] = ALL_FEATURES;

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
    // Trial users get FULL PRO access — no restrictions during trial
    if (isTrialing && !trialExpired) {
      return PRO_FEATURES.includes(feature);
    }

    if (isActive) {
      if (isPro) return PRO_FEATURES.includes(feature);
      if (isStarter) return STARTER_FEATURES.includes(feature);
      // Active but no specific plan — give starter access
      return STARTER_FEATURES.includes(feature);
    }

    return false;
  };

  const isLocked = (feature: Feature): boolean => !canAccess(feature);

  const getMemberLimit = (): number => {
    // Trial users get UNLIMITED members — same as Pro
    if (isTrialing && !trialExpired) return Infinity;
    if (isActive && isPro) return Infinity;
    if (isActive && isStarter) return 100;
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
