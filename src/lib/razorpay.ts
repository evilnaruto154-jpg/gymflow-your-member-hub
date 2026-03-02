// Razorpay placeholder integration structure
// Activate with live keys in Phase 2

export interface RazorpaySubscriptionOptions {
  plan_id: string;
  customer_id?: string;
  total_count: number;
  quantity: number;
}

export interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

// Placeholder: Create subscription via edge function
export async function createSubscription(_planId: string): Promise<{ subscriptionId: string }> {
  // TODO Phase 2: Call edge function to create Razorpay subscription
  console.log("[Razorpay] createSubscription placeholder called");
  return { subscriptionId: "sub_placeholder" };
}

// Placeholder: Open Razorpay checkout
export function openCheckout(_options: RazorpayCheckoutOptions): void {
  // TODO Phase 2: Load Razorpay script and open checkout
  console.log("[Razorpay] openCheckout placeholder called");
}

// Placeholder: Cancel subscription
export async function cancelSubscription(_subscriptionId: string): Promise<void> {
  // TODO Phase 2: Call edge function to cancel
  console.log("[Razorpay] cancelSubscription placeholder called");
}
