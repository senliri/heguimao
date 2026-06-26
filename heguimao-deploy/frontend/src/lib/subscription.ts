// NOTE: Subscription limits are enforced server-side via JWT + KV.
// Client-side localStorage is a cache/optimization; the Worker is the source of truth.
// Users can modify localStorage to bypass limits — the Worker prevents this.

import { getAuthToken } from './auth';
import { translateError } from "./i18n.js";

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

// ─── Server-Sync ────────────────────────────────────────────────────

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://heguimao-api.senliri028.workers.dev';

export async function syncSubscriptionFromServer(): Promise<Subscription | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${WORKER_URL}/subscription`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'get' }),
    });

    if (!response.ok) {
      console.warn(`Subscription sync failed: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const subscription: Subscription = {
      plan: data.plan || 'free',
      apiCallsUsed: data.apiCallsUsed || 0,
      apiCallsLimit: data.apiCallsLimit || 10,
      maxReports: data.maxReports || 5,
      reportsGenerated: data.reportsGenerated || 0,
      expiresAt: null,
      createdAt: Date.now(),
    };
    saveSubscription(subscription);
    return subscription;
  } catch (e) {
    console.error('Subscription sync error:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function upgradePlanOnServer(plan: PlanType): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${WORKER_URL}/subscription`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'upgrade', plan }),
    });

    if (!response.ok) {
      let errorMsg = 'Upgrade failed';
      try {
        const data = await response.json();
        errorMsg = translateError(data.error) || errorMsg;
      } catch { /* ignore parse error */ }
      console.error(`Subscription upgrade failed: HTTP ${response.status} - ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    if (data.success) {
      upgradePlan(plan);
      return { success: true };
    }
    return { success: false, error: translateError(data.error) || 'Unknown error' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Subscription upgrade error:', msg);
    return { success: false, error: msg };
  }
}
