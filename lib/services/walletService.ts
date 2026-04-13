/**
 * Supabase service functions for Wallet operations
 */

import { supabase } from "@/lib/supabase/client";

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
  requester?: { full_name: string | null; email: string; avatar_url: string | null };
  collector?: { full_name: string | null; email: string; avatar_url: string | null };
}

/**
 * Get transaction history for a user (as requester or collector)
 */
export async function getWalletTransactions(
  userId: string,
  limit = 50
): Promise<{ data: WalletTransaction[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      // Avoid embedded profile joins here; strict profile RLS can suppress rows
      // for requester accounts even when the base transaction is visible.
      .select("*")
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
    const { data, error } = await supabase.rpc("transfer_funds", {
      p_requester_id: requesterId,
      p_collector_id: collectorId,
      p_submission_id: submissionId,
      p_amount: amount,
      p_platform_fee: platformFee,
    });

    if (error) {
      return { transactionId: null, error: new Error(error.message) };
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
 * Credit collector when a submission is approved (records payout + stats; settlement is on-chain DATAW).
 */
export async function creditCollector(
  requesterId: string,
  collectorId: string,
  submissionId: string,
  amount: number
): Promise<{ transactionId: string | null; error: Error | null }> {
  try {
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
