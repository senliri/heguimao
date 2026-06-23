// NOTE: Subscription limits are client-side only for now.
// In production, enforce rate limits on the Worker side using JWT claims.
// Users can modify localStorage to bypass limits — this is acceptable for MVP.
// TODO: Move subscription state to Worker KV store with JWT enforcement.

export type PlanType = "free" | "basic" | "pro";

export interface Subscription {
  plan: PlanType;
  apiCallsUsed: number;
  apiCallsLimit: number;
  maxReports: number;
  reportsGenerated: number;
  expiresAt: number | null; // null = permanent (lifetime plan)
  createdAt: number;
}

export const PLAN_CONFIG = {
  free: {
    plan: "free" as const,
    apiCallsLimit: 10,
    maxReports: 5,
    price: 0,
    features: ["Basic compliance check", "5 reports/month"],
  },
  basic: {
    plan: "basic" as const,
    apiCallsLimit: 100,
    maxReports: 50,
    price: 9.99,
    features: ["Advanced compliance check", "50 reports/month", "Priority support"],
  },
  pro: {
    plan: "pro" as const,
    apiCallsLimit: 1000,
    maxReports: 500,
    price: 29.99,
    features: ["Full compliance suite", "Unlimited reports", "Export to CSV/PDF", "Priority support"],
  },
};

const SUBSCRIPTION_KEY = "compliance_cat_subscription";

export function getSubscription(): Subscription {
  try {
    const data = localStorage.getItem(SUBSCRIPTION_KEY);
    if (!data) {
      // Default to free plan
      return createFreePlan();
    }
    return JSON.parse(data);
  } catch {
    return createFreePlan();
  }
}

export function createFreePlan(): Subscription {
  const subscription: Subscription = {
    plan: "free",
    apiCallsUsed: 0,
    apiCallsLimit: PLAN_CONFIG.free.apiCallsLimit,
    maxReports: PLAN_CONFIG.free.maxReports,
    reportsGenerated: 0,
    expiresAt: null,
    createdAt: Date.now(),
  };
  saveSubscription(subscription);
  return subscription;
}

export function saveSubscription(subscription: Subscription): void {
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch {
    console.warn("Failed to save subscription");
  }
}

export function upgradePlan(plan: PlanType): Subscription {
  const subscription = getSubscription();
  subscription.plan = plan;
  subscription.apiCallsLimit = PLAN_CONFIG[plan].apiCallsLimit;
  subscription.maxReports = PLAN_CONFIG[plan].maxReports;
  subscription.expiresAt = null; // Lifetime upgrade
  subscription.createdAt = Date.now();
  saveSubscription(subscription);
  return subscription;
}

export function resetUsage(): Subscription {
  const subscription = getSubscription();
  subscription.apiCallsUsed = 0;
  subscription.reportsGenerated = 0;
  saveSubscription(subscription);
  return subscription;
}

export function incrementApiCall(): Subscription {
  const subscription = getSubscription();
  subscription.apiCallsUsed++;
  saveSubscription(subscription);
  return subscription;
}

export function incrementReport(): Subscription {
  const subscription = getSubscription();
  subscription.reportsGenerated++;
  saveSubscription(subscription);
  return subscription;
}

export function canMakeApiCall(): boolean {
  const subscription = getSubscription();
  return subscription.apiCallsUsed < subscription.apiCallsLimit;
}

export function canGenerateReport(): boolean {
  const subscription = getSubscription();
  return subscription.reportsGenerated < subscription.maxReports;
}

export function getRemainingApiCalls(): number {
  const subscription = getSubscription();
  return Math.max(0, subscription.apiCallsLimit - subscription.apiCallsUsed);
}

export function getRemainingReports(): number {
  const subscription = getSubscription();
  return Math.max(0, subscription.maxReports - subscription.reportsGenerated);
}
