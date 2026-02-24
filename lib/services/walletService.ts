/**
 * Supabase service functions for Wallet operations
 */

import { createClient, supabase } from "@/lib/supabase/client";

export interface WalletTransaction {
  id: string;
  submission_id: string | null;
  requester_id: string;
  collector_id: string;
  amount: number;
  platform_fee: number;
  validator_fee: number;
  currency: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  // Joined fields
  requester?: { full_name: string | null; email: string };
  collector?: { full_name: string | null; email: string };
}

/**
 * Get wallet balance for a user
 */
export async function getWalletBalance(
  userId: string
): Promise<{ balance: number; error: Error | null }> {
  try {
    // const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (error) {
      return { balance: 0, error: new Error(error.message) };
    }

    return { balance: parseFloat(data.balance) || 0, error: null };
  } catch (err) {
    return {
      balance: 0,
      error: err instanceof Error ? err : new Error("Failed to fetch balance"),
    };
  }
}

/**
 * Get transaction history for a user (as requester or collector)
 */
export async function getWalletTransactions(
  userId: string,
  limit = 50
): Promise<{ data: WalletTransaction[] | null; error: Error | null }> {
  try {
    // const supabase = createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "*, requester:profiles!transactions_requester_id_fkey(full_name, email), collector:profiles!transactions_collector_id_fkey(full_name, email)"
      )
      .or(`requester_id.eq.${userId},collector_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as WalletTransaction[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch transactions"),
    };
  }
}

/**
 * Transfer funds from requester to collector via the database RPC.
 * Called when a requester approves (validates) a submission.
 */
export async function transferFunds(
  requesterId: string,
  collectorId: string,
  submissionId: string,
  amount: number,
  platformFee = 0
): Promise<{ transactionId: string | null; error: Error | null }> {
  try {
    // const supabase = createClient();
    const { data, error } = await supabase.rpc("transfer_funds", {
      p_requester_id: requesterId,
      p_collector_id: collectorId,
      p_submission_id: submissionId,
      p_amount: amount,
      p_platform_fee: platformFee,
    });

    if (error) {
      const message = error.message.includes("Insufficient balance")
        ? "Insufficient balance to approve this submission"
        : error.message;
      return { transactionId: null, error: new Error(message) };
    }

    return { transactionId: data as string, error: null };
  } catch (err) {
    return {
      transactionId: null,
      error:
        err instanceof Error ? err : new Error("Failed to transfer funds"),
    };
  }
}

/**
 * Deduct project budget from requester's balance at project creation.
 */
export async function deductProjectBudget(
  requesterId: string,
  amount: number
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // const supabase = createClient();
    const { error } = await supabase.rpc("deduct_project_budget", {
      p_requester_id: requesterId,
      p_amount: amount,
    });

    if (error) {
      const message = error.message.includes("Insufficient balance")
        ? "Insufficient balance to create this project"
        : error.message;
      return { success: false, error: new Error(message) };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err : new Error("Failed to deduct budget"),
    };
  }
}

/**
 * Credit collector when a submission is approved.
 * The requester's budget was already deducted at project creation.
 */
export async function creditCollector(
  requesterId: string,
  collectorId: string,
  submissionId: string,
  amount: number
): Promise<{ transactionId: string | null; error: Error | null }> {
  try {
    // const supabase = createClient();
    const { data, error } = await supabase.rpc("credit_collector", {
      p_requester_id: requesterId,
      p_collector_id: collectorId,
      p_submission_id: submissionId,
      p_amount: amount,
    });

    if (error) {
      return { transactionId: null, error: new Error(error.message) };
    }

    return { transactionId: data as string, error: null };
  } catch (err) {
    return {
      transactionId: null,
      error:
        err instanceof Error ? err : new Error("Failed to credit collector"),
    };
  }
}
