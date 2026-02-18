/**
 * Billing and subscription related types
 */

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_projects: number;
  max_collectors: number;
  storage_gb: number;
  support_level: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  status: "active" | "cancelled" | "past_due" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  invoice_date: string;
  due_date: string;
  paid_at: string | null;
  stripe_invoice_id: string | null;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: "card" | "bank_account" | "paypal";
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

export interface ProjectBilling {
  project_id: string;
  project_title: string;
  total_spent: number;
  submissions_paid: number;
  pending_payments: number;
  last_payment_date: string | null;
}

export interface UsageData {
  date: string;
  projects_created: number;
  submissions_received: number;
  amount_spent: number;
  amount_earned: number;
}

export interface BillingStats {
  total_spent: number;
  total_earned: number;
  pending_payments: number;
  this_month_spent: number;
  this_month_earned: number;
  active_projects_cost: number;
  upcoming_bill: number;
  next_billing_date: string | null;
}
