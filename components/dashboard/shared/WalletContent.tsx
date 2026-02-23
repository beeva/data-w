"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWalletBalance,
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/services/walletService";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Plus,
  Copy,
  Check,
  Bitcoin,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DepositPayment {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  amount_usd: number;
  status: string;
  expiration_estimate_date?: string;
}

const CRYPTO_OPTIONS = [
  { value: "btc", label: "Bitcoin", symbol: "BTC" },
  { value: "eth", label: "Ethereum", symbol: "ETH" },
  { value: "ltc", label: "Litecoin", symbol: "LTC" },
  { value: "trx", label: "TRON", symbol: "TRX" },
  { value: "usdttrc20", label: "USDT (TRC-20)", symbol: "USDT" },
  { value: "usdterc20", label: "USDT (ERC-20)", symbol: "USDT" },
  { value: "usdtbsc", label: "USDT (BEP-20)", symbol: "USDT" },
  { value: "bnbbsc", label: "BNB (BSC)", symbol: "BNB" },
  { value: "matic", label: "Polygon", symbol: "MATIC" },
  { value: "sol", label: "Solana", symbol: "SOL" },
  { value: "doge", label: "Dogecoin", symbol: "DOGE" },
  { value: "xrp", label: "Ripple", symbol: "XRP" },
  { value: "ada", label: "Cardano", symbol: "ADA" },
];

export default function WalletContent() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Deposit dialog state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<"form" | "payment" | "done">("form");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("btc");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [depositPayment, setDepositPayment] = useState<DepositPayment | null>(null);
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Deposit history
  const [deposits, setDeposits] = useState<any[]>([]);

  const userId = user?.id;

  const fetchWalletData = useCallback(
    async (showSpinner = true) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        if (showSpinner) setLoading(true);
        setError("");

        const supabase = createClient();
        const [balanceResult, txResult, depositResult] = await Promise.all([
          getWalletBalance(userId),
          getWalletTransactions(userId),
          supabase
            .from("crypto_deposits")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (balanceResult.error) throw balanceResult.error;
        if (txResult.error) throw txResult.error;

        setBalance(balanceResult.balance);
        setTransactions(txResult.data || []);
        setDeposits(depositResult.data || []);
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
      case "confirmed":
      case "finished":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "pending":
      case "waiting":
      case "confirming":
      case "sending":
        return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const handleCreateDeposit = async () => {
    if (!user) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1) {
      setDepositError("Minimum deposit is $1.00");
      return;
    }

    setDepositLoading(true);
    setDepositError("");

    try {
      const res = await fetch("/api/crypto/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount,
          currency: depositCurrency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      setDepositPayment({
        payment_id: data.payment_id,
        pay_address: data.pay_address,
        pay_amount: data.pay_amount,
        pay_currency: data.pay_currency,
        amount_usd: data.amount_usd,
        status: data.status,
        expiration_estimate_date: data.expiration_estimate_date,
      });
      setPaymentStatus(data.status || "waiting");
      setDepositStep("payment");

      startPolling(data.payment_id);
    } catch (err: any) {
      setDepositError(err.message || "Failed to create deposit");
    } finally {
      setDepositLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/crypto/payment-status?payment_id=${paymentId}`
        );
        const data = await res.json();

        if (res.ok) {
          setPaymentStatus(data.status);

          if (
            data.status === "finished" ||
            data.status === "confirmed"
          ) {
            if (pollRef.current) clearInterval(pollRef.current);
            setDepositStep("done");
            fetchWalletData(false);
          } else if (
            data.status === "failed" ||
            data.status === "expired" ||
            data.status === "refunded"
          ) {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        // Silently retry on next poll
      }
    }, 15000);
  };

  const copyToClipboard = async (text: string, type: "address" | "amount") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const resetDeposit = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setDepositStep("form");
    setDepositAmount("");
    setDepositCurrency("btc");
    setDepositError("");
    setDepositPayment(null);
    setPaymentStatus("");
    setCopied(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetDeposit();
    setDepositOpen(open);
  };

  const getCryptoLabel = (value: string) =>
    CRYPTO_OPTIONS.find((c) => c.value === value)?.label || value.toUpperCase();

  const getCryptoSymbol = (value: string) =>
    CRYPTO_OPTIONS.find((c) => c.value === value)?.symbol || value.toUpperCase();

  const getDepositStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "finished":
        return (
          <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-[10px]">
            Confirmed
          </Badge>
        );
      case "waiting":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 text-[10px]">
            Waiting
          </Badge>
        );
      case "confirming":
      case "sending":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
            Confirming
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30 text-[10px]">
            Expired
          </Badge>
        );
      case "failed":
      case "refunded":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {status}
          </Badge>
        );
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWalletData()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setDepositOpen(true)}
            className="gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
          >
            <Bitcoin className="w-3.5 h-3.5" />
            Deposit Crypto
          </Button>
        </div>
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

      {/* Deposit History */}
      {deposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bitcoin className="w-4 h-4 text-orange-500" />
              Crypto Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deposits.map((dep) => (
                <div
                  key={dep.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 px-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                      <Bitcoin className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Deposit via {dep.pay_currency?.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dep.created_at).toLocaleDateString("en-US", {
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
                    {getDepositStatusBadge(dep.status)}
                    <p className="text-sm font-semibold tabular-nums min-w-[80px] text-right text-green-600">
                      +${parseFloat(dep.amount_usd).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* ─── Deposit Dialog ─── */}
      <Dialog open={depositOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              {depositStep === "done" ? "Deposit Confirmed" : "Deposit via Crypto"}
            </DialogTitle>
            <DialogDescription>
              {depositStep === "form" &&
                "Choose a cryptocurrency and enter the amount to deposit."}
              {depositStep === "payment" &&
                "Send the exact amount to the address below."}
              {depositStep === "done" &&
                "Your deposit has been confirmed and credited to your balance."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Form */}
          {depositStep === "form" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="deposit-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="100.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pay with</Label>
                <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_OPTIONS.map((crypto) => (
                      <SelectItem key={crypto.value} value={crypto.value}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{crypto.symbol}</span>
                          <span className="text-muted-foreground">
                            {crypto.label}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100, 250, 500].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs",
                      depositAmount === String(amt) &&
                        "border-orange-500 bg-orange-500/10 text-orange-600"
                    )}
                    onClick={() => setDepositAmount(String(amt))}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>

              {depositError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {depositError}
                </p>
              )}

              <Button
                onClick={handleCreateDeposit}
                disabled={depositLoading || !depositAmount}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                {depositLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Payment Address
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Payment Address */}
          {depositStep === "payment" && depositPayment && (
            <div className="space-y-4 pt-2">
              {/* Amount summary */}
              <div className="rounded-lg bg-accent/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-semibold">
                    ${depositPayment.amount_usd.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pay</span>
                  <span className="font-semibold">
                    {depositPayment.pay_amount} {getCryptoSymbol(depositPayment.pay_currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1.5">
                    {paymentStatus === "waiting" || paymentStatus === "confirming" || paymentStatus === "sending" ? (
                      <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                    ) : null}
                    <span className="capitalize font-medium">{paymentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Crypto amount to send */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Amount to send ({getCryptoSymbol(depositPayment.pay_currency)})
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono select-all">
                    {depositPayment.pay_amount}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      copyToClipboard(
                        String(depositPayment.pay_amount),
                        "amount"
                      )
                    }
                  >
                    {copied === "amount" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Send to address
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-xs font-mono break-all select-all">
                    {depositPayment.pay_address}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      copyToClipboard(depositPayment.pay_address, "address")
                    }
                  >
                    {copied === "address" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Send exactly <strong>{depositPayment.pay_amount} {getCryptoSymbol(depositPayment.pay_currency)}</strong> to
                  the address above. Your balance will be credited once the
                  payment is confirmed on the blockchain. This page will update
                  automatically.
                </p>
              </div>

              {(paymentStatus === "failed" || paymentStatus === "expired") && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Payment {paymentStatus}. Please try creating a new deposit.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={resetDeposit}
              >
                {paymentStatus === "failed" || paymentStatus === "expired"
                  ? "Create New Deposit"
                  : "Close"}
              </Button>
            </div>
          )}

          {/* Step 3: Done */}
          {depositStep === "done" && depositPayment && (
            <div className="space-y-4 pt-2 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  +${depositPayment.amount_usd.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  has been added to your balance
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => handleDialogClose(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
