"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWalletBalance,
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/services/walletService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WalletContent() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id;

  const fetchWalletData = useCallback(
    async (showSpinner = true) => {
      if (!userId) return;
      try {
        if (showSpinner) setLoading(true);
        setError("");

        const [balanceResult, txResult] = await Promise.all([
          getWalletBalance(userId),
          getWalletTransactions(userId),
        ]);

        if (balanceResult.error) throw balanceResult.error;
        if (txResult.error) throw txResult.error;

        setBalance(balanceResult.balance);
        setTransactions(txResult.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load wallet data");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const totalIncoming = transactions
    .filter((tx) => tx.collector_id === userId && tx.status === "completed")
    .reduce((sum, tx) => sum + parseFloat(String(tx.amount)), 0);

  const totalOutgoing = transactions
    .filter((tx) => tx.requester_id === userId && tx.status === "completed")
    .reduce(
      (sum, tx) =>
        sum + parseFloat(String(tx.amount)) + parseFloat(String(tx.platform_fee)),
      0
    );

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "pending":
        return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchWalletData()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your balance and view transaction history
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchWalletData()}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-green-500" />
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalIncoming.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-red-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ${totalOutgoing.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm text-muted-foreground mt-3">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isIncoming = tx.collector_id === userId;
                const amount = parseFloat(String(tx.amount));
                const fee = parseFloat(String(tx.platform_fee));
                const counterparty = isIncoming
                  ? tx.requester?.full_name || tx.requester?.email || "Requester"
                  : tx.collector?.full_name || tx.collector?.email || "Collector";

                return (
                  <div
                    key={tx.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 px-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isIncoming
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        )}
                      >
                        {isIncoming ? (
                          <ArrowDownRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isIncoming ? "Received from" : "Paid to"}{" "}
                          {counterparty}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(tx.status)}
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] capitalize",
                            tx.status === "completed" &&
                              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            tx.status === "pending" &&
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                            tx.status === "failed" &&
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums min-w-[80px] text-right",
                          isIncoming ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {isIncoming ? "+" : "-"}$
                        {isIncoming
                          ? amount.toFixed(2)
                          : (amount + fee).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
