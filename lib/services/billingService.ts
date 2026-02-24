/**
 * Supabase service functions for Billing operations
 */

import { supabase } from "@/lib/supabase/client";
import type {
  BillingStats,
  ProjectBilling,
  UsageData,
  Invoice,
  SubscriptionPlan,
  UserSubscription,
  BillingCycle,
} from "@/types/billing";

type TransactionRow = {
  id: string;
  created_at: string;
  requester_id: string | null;
  collector_id: string | null;
  submission_id?: string | null;
  amount: string;
  platform_fee: string;
  status: string;
  completed_at?: string | null;
  currency?: string | null;
  stripe_payment_intent_id?: string | null;
};

type ProjectRow = {
  id: string;
  title?: string;
  created_at?: string;
};

type SubmissionRow = {
  id: string;
  request_id: string;
  submitted_at?: string;
};

/**
 * Get billing statistics for a user
 */
export async function getBillingStats(
  userId: string
): Promise<{ data: BillingStats | null; error: Error | null }> {
  try {
    // Fetch transactions for this user
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .or(`requester_id.eq.${userId},collector_id.eq.${userId}`);

    if (txError) {
      return { data: null, error: new Error(txError.message) };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let totalSpent = 0;
    let totalEarned = 0;
    let pendingPayments = 0;
    let thisMonthSpent = 0;
    let thisMonthEarned = 0;

    (transactions || []).forEach((tx: TransactionRow) => {
      const txDate = new Date(tx.created_at);
      const isThisMonth = txDate >= startOfMonth && txDate <= endOfMonth;

      if (tx.requester_id === userId) {
        // User is paying
        if (tx.status === "completed") {
          totalSpent += parseFloat(tx.amount) + parseFloat(tx.platform_fee);
          if (isThisMonth) {
            thisMonthSpent += parseFloat(tx.amount) + parseFloat(tx.platform_fee);
          }
        } else if (tx.status === "pending") {
          pendingPayments += parseFloat(tx.amount) + parseFloat(tx.platform_fee);
        }
      } else if (tx.collector_id === userId) {
        // User is earning
        if (tx.status === "completed") {
          totalEarned += parseFloat(tx.amount);
          if (isThisMonth) {
            thisMonthEarned += parseFloat(tx.amount);
          }
        }
      }
    });

    // Calculate upcoming bill (pending + estimated based on active projects)
    const upcomingBill = pendingPayments;

    // Get next billing date (end of current month for simplicity)
    const nextBillingDate = endOfMonth.toISOString();

    const stats: BillingStats = {
      total_spent: totalSpent,
      total_earned: totalEarned,
      pending_payments: pendingPayments,
      this_month_spent: thisMonthSpent,
      this_month_earned: thisMonthEarned,
      active_projects_cost: pendingPayments,
      upcoming_bill: upcomingBill,
      next_billing_date: nextBillingDate,
    };

    return { data: stats, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to fetch billing stats"),
    };
  }
}

/**
 * Get billing breakdown per project
 */
export async function getProjectBillings(
  userId: string
): Promise<{ data: ProjectBilling[] | null; error: Error | null }> {
  try {
    // Fetch user's projects
    const { data: projects, error: projError } = await supabase
      .from("requests")
      .select("id, title")
      .eq("requester_id", userId);

    if (projError) {
      return { data: null, error: new Error(projError.message) };
    }

    if (!projects || projects.length === 0) {
      return { data: [], error: null };
    }

    // Fetch transactions for these projects
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("requester_id", userId);

    if (txError) {
      return { data: null, error: new Error(txError.message) };
    }

    // Get submissions to map to projects
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, request_id")
      .in(
        "request_id",
        projects.map((p: ProjectRow) => p.id)
      );

    if (subError) {
      return { data: null, error: new Error(subError.message) };
    }

    // Create submission to project mapping
    const submissionToProject: Record<string, string> = {};
    (submissions || []).forEach((sub: SubmissionRow) => {
      submissionToProject[sub.id] = sub.request_id;
    });

    // Aggregate billing per project
    const projectBillings: Record<string, ProjectBilling> = {};

    projects.forEach((project: ProjectRow) => {
      projectBillings[project.id] = {
        project_id: project.id,
        project_title: project.title || "Untitled Project",
        total_spent: 0,
        submissions_paid: 0,
        pending_payments: 0,
        last_payment_date: null,
      };
    });

    (transactions || []).forEach((tx: TransactionRow) => {
      if (tx.submission_id && submissionToProject[tx.submission_id]) {
        const projectId = submissionToProject[tx.submission_id];
        if (projectBillings[projectId]) {
          const amount = parseFloat(tx.amount) + parseFloat(tx.platform_fee);
          if (tx.status === "completed") {
            projectBillings[projectId].total_spent += amount;
            projectBillings[projectId].submissions_paid += 1;
            if (tx.completed_at) {
              if (
                !projectBillings[projectId].last_payment_date ||
                new Date(tx.completed_at) >
                  new Date(projectBillings[projectId].last_payment_date!)
              ) {
                projectBillings[projectId].last_payment_date = tx.completed_at;
              }
            }
          } else if (tx.status === "pending") {
            projectBillings[projectId].pending_payments += amount;
          }
        }
      }
    });

    return { data: Object.values(projectBillings), error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch project billings"),
    };
  }
}

/**
 * Get usage data for charts (last 6 months)
 */
export async function getUsageData(
  userId: string
): Promise<{ data: UsageData[] | null; error: Error | null }> {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .or(`requester_id.eq.${userId},collector_id.eq.${userId}`)
      .gte("created_at", sixMonthsAgo.toISOString());

    if (txError) {
      return { data: null, error: new Error(txError.message) };
    }

    // Fetch projects created
    const { data: projects, error: projError } = await supabase
      .from("requests")
      .select("id, created_at")
      .eq("requester_id", userId)
      .gte("created_at", sixMonthsAgo.toISOString());

    if (projError) {
      return { data: null, error: new Error(projError.message) };
    }

    // Fetch submissions received
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, submitted_at, request_id")
      .gte("submitted_at", sixMonthsAgo.toISOString());

    // Filter submissions to only include those for user's projects
    const userProjectIds =
      projects?.map((p: ProjectRow) => p.id) || [];
    const userSubmissions =
      submissions?.filter((s: SubmissionRow) => userProjectIds.includes(s.request_id)) || [];

    // Generate monthly usage data
    const usageData: UsageData[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthKey = monthStart.toISOString().slice(0, 7); // YYYY-MM

      let amountSpent = 0;
      let amountEarned = 0;

      (transactions || []).forEach((tx: TransactionRow) => {
        const txDate = new Date(tx.created_at);
        if (txDate >= monthStart && txDate <= monthEnd && tx.status === "completed") {
          if (tx.requester_id === userId) {
            amountSpent += parseFloat(tx.amount) + parseFloat(tx.platform_fee);
          } else if (tx.collector_id === userId) {
            amountEarned += parseFloat(tx.amount);
          }
        }
      });

      const projectsCreated = (projects || []).filter((p: ProjectRow) => {
        if (!p.created_at) return false;
        const pDate = new Date(p.created_at);
        return pDate >= monthStart && pDate <= monthEnd;
      }).length;

      const submissionsReceived = userSubmissions.filter((s: SubmissionRow) => {
        if (!s.submitted_at) return false;
        const sDate = new Date(s.submitted_at);
        return sDate >= monthStart && sDate <= monthEnd;
      }).length;

      usageData.push({
        date: monthKey,
        projects_created: projectsCreated,
        submissions_received: submissionsReceived,
        amount_spent: amountSpent,
        amount_earned: amountEarned,
      });
    }

    return { data: usageData, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to fetch usage data"),
    };
  }
}

/**
 * Get invoices for a user
 */
export async function getInvoices(
  userId: string
): Promise<{ data: Invoice[] | null; error: Error | null }> {
  try {
    // Fetch completed transactions as invoices
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("requester_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (txError) {
      return { data: null, error: new Error(txError.message) };
    }

    const invoices: Invoice[] = (transactions || []).map((tx: TransactionRow) => ({
      id: tx.id,
      user_id: tx.requester_id ?? userId,
      amount: parseFloat(tx.amount) + parseFloat(tx.platform_fee),
      currency: tx.currency || "USD",
      status: tx.status as "completed",
      description: `Payment for submission`,
      invoice_date: tx.created_at,
      due_date: tx.created_at,
      paid_at: tx.completed_at ?? null,
      stripe_invoice_id: tx.stripe_payment_intent_id ?? null,
    }));

    return { data: invoices, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch invoices"),
    };
  }
}

/**
 * Get subscription plans (static for now)
 */
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return [
    {
      id: "free",
      name: "Free",
      tier: "free",
      price_monthly: 0,
      price_yearly: 0,
      features: [
        "Up to 3 projects",
        "Basic analytics",
        "Community support",
        "1 GB storage",
      ],
      max_projects: 3,
      max_collectors: 10,
      storage_gb: 1,
      support_level: "Community",
    },
    {
      id: "starter",
      name: "Starter",
      tier: "starter",
      price_monthly: 29,
      price_yearly: 290,
      features: [
        "Up to 10 projects",
        "Advanced analytics",
        "Email support",
        "10 GB storage",
        "API access",
      ],
      max_projects: 10,
      max_collectors: 50,
      storage_gb: 10,
      support_level: "Email",
    },
    {
      id: "professional",
      name: "Professional",
      tier: "professional",
      price_monthly: 99,
      price_yearly: 990,
      features: [
        "Unlimited projects",
        "Real-time analytics",
        "Priority support",
        "100 GB storage",
        "Advanced API",
        "Custom integrations",
      ],
      max_projects: -1,
      max_collectors: 500,
      storage_gb: 100,
      support_level: "Priority",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      tier: "enterprise",
      price_monthly: 299,
      price_yearly: 2990,
      features: [
        "Everything in Professional",
        "Dedicated support",
        "Unlimited storage",
        "Custom SLA",
        "On-premise option",
        "White-label option",
      ],
      max_projects: -1,
      max_collectors: -1,
      storage_gb: -1,
      support_level: "Dedicated",
    },
  ];
}

/**
 * Get the user's active subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<{ data: UserSubscription | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (data) {
      return {
        data: {
          id: data.id,
          user_id: data.user_id,
          plan_id: data.plan_id,
          tier: data.tier,
          billing_cycle: data.billing_cycle as BillingCycle,
          status: data.status,
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          cancel_at_period_end: data.cancel_at_period_end,
          created_at: data.created_at,
        } as UserSubscription,
        error: null,
      };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch subscription"),
    };
  }
}

/**
 * Subscribe to a plan using wallet balance
 */
export async function subscribeToPlan(
  userId: string,
  planId: string,
  tier: string,
  billingCycle: BillingCycle,
  price: number
): Promise<{ subscriptionId: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("subscribe_to_plan", {
      p_user_id: userId,
      p_plan_id: planId,
      p_tier: tier,
      p_billing_cycle: billingCycle,
      p_price: price,
    });

    if (error) {
      const message = error.message.includes("Insufficient balance")
        ? "Insufficient balance. Please deposit funds first."
        : error.message;
      return { subscriptionId: null, error: new Error(message) };
    }

    return { subscriptionId: data as string, error: null };
  } catch (err) {
    return {
      subscriptionId: null,
      error:
        err instanceof Error ? err : new Error("Failed to subscribe to plan"),
    };
  }
}

/**
 * Cancel the user's subscription
 */
export async function cancelSubscription(
  userId: string,
  immediate = false
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.rpc("cancel_subscription", {
      p_user_id: userId,
      p_immediate: immediate,
    });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to cancel subscription"),
    };
  }
}
