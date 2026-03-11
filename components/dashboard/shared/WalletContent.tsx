"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWalletBalance,
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/services/walletService";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Copy,
  Check,
  Bitcoin,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  TrendingDown,
  MoreVertical,
  Sparkles,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { EmptyDataSvg } from "@/components/svg/EmptyDataSvg";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

const PAGE_SIZE = 10;

function DonutChart({ income, expense }: { income: number; expense: number }) {
  const size = 148;
  const radius = 54;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const total = income + expense;

  const totalLabel =
    total >= 1000 ? `${Math.round(total / 1000)}K` : `$${Math.round(total)}`;

  if (total === 0) {
    return (
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-bold text-foreground">$0</p>
          <p className="text-[10px] text-muted-foreground">Total Balance</p>
        </div>
      </div>
    );
  }

  const incomeDash = (income / total) * circumference;
  const expenseDash = (expense / total) * circumference;

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {expenseDash > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary) / 0.35)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${expenseDash} ${circumference - expenseDash}`}
            strokeDashoffset={-incomeDash}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {incomeDash > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeDasharray={`${incomeDash} ${circumference - incomeDash}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-base font-bold text-foreground leading-tight">
          {totalLabel}
        </p>
        <p className="text-[10px] text-muted-foreground">Total Balance</p>
      </div>
    </div>
  );
}

export default function WalletContent() {
  const { user, profile } = useAuth();
  const role = profile?.role || "";
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Table state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);

  // Deposit dialog state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<"form" | "payment" | "done">(
    "form",
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("btc");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [depositPayment, setDepositPayment] = useState<DepositPayment | null>(
    null,
  );
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    [userId],
  );

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

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
        sum +
        parseFloat(String(tx.amount)) +
        parseFloat(String(tx.platform_fee)),
      0,
    );

  const totalTxAmount = transactions.reduce(
    (sum, tx) => sum + parseFloat(String(tx.amount)),
    0,
  );

  // Filtered & sorted transactions
  const filteredTransactions = transactions
    .filter((tx) => {
      const isIncoming = tx.collector_id === userId;
      const counterparty = isIncoming
        ? tx.requester?.full_name || tx.requester?.email || "Requester"
        : tx.collector?.full_name || tx.collector?.email || "Collector";
      const matchesSearch =
        !search ||
        counterparty.toLowerCase().includes(search.toLowerCase()) ||
        tx.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "latest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortOrder === "oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      return 0;
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / PAGE_SIZE),
  );
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const formatTxId = (id: string) =>
    `TXN-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-0 text-xs font-medium gap-1 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-0 text-xs font-medium gap-1 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-0 text-xs font-medium gap-1 px-3 py-1.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="text-xs capitalize gap-1 px-3 py-1.5 rounded-full"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </Badge>
        );
    }
  };

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
      if (!res.ok) throw new Error(data.error || "Failed to create payment");
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
          `/api/crypto/payment-status?payment_id=${paymentId}`,
        );
        const data = await res.json();
        if (res.ok) {
          setPaymentStatus(data.status);
          if (data.status === "finished" || data.status === "confirmed") {
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
        // Silently retry
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

  const getCryptoSymbol = (value: string) =>
    CRYPTO_OPTIONS.find((c) => c.value === value)?.symbol ||
    value.toUpperCase();

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (loading) {
    return (
      <div
        className={cn(
          "space-y-6 pt-2",
          role !== "collector" && "ml-2 mr-2 pt-0",
        )}
      >
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6 items-start">
          {/* Left column */}
          <div className="space-y-6">
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="bg-white dark:bg-gray-800/50 border-none shadow-md"
                >
                  <CardContent className="px-6">
                    <div className="flex items-end justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transactions table skeleton */}
            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-10 w-80 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Table header */}
                <div className="border-y bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 grid grid-cols-[1.2fr_1.2fr_0.8fr_1fr_0.8fr_40px] px-5 py-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full max-w-[80px]" />
                  ))}
                </div>
                {/* Table rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1.2fr_1.2fr_0.8fr_1fr_0.8fr_40px] px-5 py-3.5 gap-4 border-b last:border-0 items-center border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                ))}
                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t">
                  <Skeleton className="h-4 w-36" />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-md" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar skeleton */}
          <div className="space-y-4">
            {/* Category Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="pb-4 flex flex-col items-center gap-3">
                <Skeleton className="w-[148px] h-[148px] rounded-full" />
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-2.5 h-2.5 rounded-full" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-2.5 h-2.5 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insight */}
            <Card className="border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
                <Skeleton className="h-7 w-28 rounded-md mt-1" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-64 gap-3",
          role !== "collector" && "ml-2 mr-2",
        )}
      >
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchWalletData()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-6 pt-2", role !== "collector" && "ml-2 mr-2 pt-0")}
    >
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your balance and view transaction history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setDepositOpen(true)}
            className="gap-1.5 h-10 rounded-xl btn-gelatine"
          >
            <Bitcoin className="w-3.5 h-3.5" />
            Deposit Crypto
          </Button>
        </div>
      </div>

      {/* ── Two-column body: left (stats + table) | right (sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6 items-start">
        {/* ── LEFT column ── */}
        <div className="space-y-6">
          {/* Stats Cards — styled like BillingContent cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Transactions */}
            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalTxAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transactions.length} transactions
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Income */}
            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      Total Income
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalIncoming)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total received
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
              <CardContent className="px-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {formatCurrency(totalOutgoing)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total spent</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
            <CardHeader className="">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Transactions</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by transaction ID or payment name..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 h-10 text-sm placeholder:text-xs w-80 bg-gray-50 dark:bg-gray-800/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="!h-10 text-sm w-32 bg-gray-50 dark:bg-gray-800/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-50 dark:bg-[#111827] border-none">
                      <SelectItem
                        value="all"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 focus:bg-gray-100 dark:focus:bg-gray-800/50"
                      >
                        All Status
                      </SelectItem>
                      <SelectItem
                        value="completed"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      >
                        Completed
                      </SelectItem>
                      <SelectItem
                        value="pending"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      >
                        Pending
                      </SelectItem>
                      <SelectItem
                        value="failed"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      >
                        Failed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="!h-10 text-sm w-28 bg-gray-50 dark:bg-gray-800/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-50 dark:bg-[#111827] border-none">
                      <SelectItem
                        value="latest"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      >
                        Latest
                      </SelectItem>
                      <SelectItem
                        value="oldest"
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      >
                        Oldest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="icon-lg"
                    className="rounded-lg btn-gelatine"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-gray-100 dark:hover:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="px-5 text-xs">
                      Transaction ID
                    </TableHead>
                    <TableHead className="px-5 text-xs">Payment Name</TableHead>
                    <TableHead className="px-5 text-xs">Amount</TableHead>
                    <TableHead className="px-5 text-xs">Date</TableHead>
                    <TableHead className="px-5 text-xs">Status</TableHead>
                    <TableHead className="px-5 w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow className="hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <TableCell colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-24 h-24">
                            <EmptyDataSvg />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No transactions found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((tx) => {
                      const isIncoming = tx.collector_id === userId;
                      const amount = parseFloat(String(tx.amount));
                      const fee = parseFloat(String(tx.platform_fee));
                      const counterpartyProfile = isIncoming
                        ? tx.requester
                        : tx.collector;
                      const counterparty =
                        counterpartyProfile?.full_name ||
                        counterpartyProfile?.email ||
                        (isIncoming ? "Requester" : "Collector");
                      const avatarUrl = counterpartyProfile?.avatar_url || null;
                      const displayAmount = isIncoming ? amount : amount + fee;

                      return (
                        <TableRow
                          key={tx.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        >
                          {/* Transaction ID */}
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  isIncoming
                                    ? "bg-green-500/10"
                                    : "bg-red-500/10",
                                )}
                              >
                                {isIncoming ? (
                                  <ArrowDownRight className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-foreground truncate">
                                {formatTxId(tx.id)}
                              </span>
                            </div>
                          </TableCell>

                          {/* Payment Name */}
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar>
                                <AvatarImage
                                  src={avatarUrl ?? undefined}
                                  alt={counterparty}
                                />
                                <AvatarFallback>
                                  <img
                                    src="/default-avatar.svg"
                                    alt={counterparty}
                                    className="size-full"
                                  />
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground truncate">
                                {counterparty}
                              </span>
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="px-5 py-3.5">
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                isIncoming ? "text-green-600" : "text-red-500",
                              )}
                            >
                              {isIncoming ? "+" : "-"}$
                              {displayAmount.toFixed(2)}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-5 py-3.5">
                            {getStatusBadge(tx.status)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-5 py-3.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-muted-foreground">
                  Show data{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(PAGE_SIZE, filteredTransactions.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {filteredTransactions.length}
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT sidebar ── */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Category Breakdown
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <DonutChart income={totalIncoming} expense={totalOutgoing} />

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/35" />
                  <span className="text-xs text-muted-foreground">Expense</span>
                </div>
              </div>

              {/* Spending insight row */}
              {totalOutgoing > 0 && totalIncoming > 0 && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your expenses are{" "}
                    <span className="font-semibold text-foreground">
                      {Math.round((totalOutgoing / totalIncoming) * 100)}%
                    </span>{" "}
                    of your total income.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insight */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground overflow-hidden relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 opacity-80" />
                <CardTitle className="text-sm font-semibold text-primary-foreground">
                  AI Insight
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative pb-4">
              <p className="text-xs opacity-85 leading-relaxed mb-3">
                {totalIncoming > 0
                  ? `You have received ${formatCurrency(totalIncoming)} so far. Allocating an additional 5% to savings can help you reach your financial goals faster.`
                  : "Start transacting to receive personalized AI insights about your spending patterns and savings opportunities."}
              </p>
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 text-xs h-7 gap-1.5"
              >
                Auto Save Now
                <ArrowRight className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Deposit Dialog ── */}
      <Dialog open={depositOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              {depositStep === "done"
                ? "Deposit Confirmed"
                : "Deposit via Crypto"}
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
                <Select
                  value={depositCurrency}
                  onValueChange={setDepositCurrency}
                >
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
                        "border-orange-500 bg-orange-500/10 text-orange-600",
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

          {depositStep === "payment" && depositPayment && (
            <div className="space-y-4 pt-2">
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
                    {depositPayment.pay_amount}{" "}
                    {getCryptoSymbol(depositPayment.pay_currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1.5">
                    {(paymentStatus === "waiting" ||
                      paymentStatus === "confirming" ||
                      paymentStatus === "sending") && (
                      <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                    )}
                    <span className="capitalize font-medium">
                      {paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Amount to send ({getCryptoSymbol(depositPayment.pay_currency)}
                  )
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
                        "amount",
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
                  Send exactly{" "}
                  <strong>
                    {depositPayment.pay_amount}{" "}
                    {getCryptoSymbol(depositPayment.pay_currency)}
                  </strong>{" "}
                  to the address above. Your balance will be credited once the
                  payment is confirmed.
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

          {depositStep === "done" && depositPayment && (
            <div className="space-y-4 pt-2 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
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
