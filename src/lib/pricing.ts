export interface PricingPlan {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyValue: string;
  yearlyValue: string;
  popular: boolean;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    monthlyPrice: "₹249",
    yearlyPrice: "₹2,499",
    monthlyValue: "starter_monthly",
    yearlyValue: "starter_yearly",
    popular: false,
    features: [
      "Up to 100 members",
      "WhatsApp reminders",
      "Expiry tracking",
      "Dashboard analytics",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "₹449",
    yearlyPrice: "₹4,499",
    monthlyValue: "pro_monthly",
    yearlyValue: "pro_yearly",
    popular: true,
    features: [
      "Unlimited members",
      "Attendance tracking",
      "Expense management",
      "Reports & analytics",
      "Priority support",
    ],
  },
];

export const YEARLY_DISCOUNT_LABEL = "Save 20%";
