"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBillingStats,
  getProjectBillings,
  getUsageData,
  getWeeklyUsageData,
  getDailyUsageData,
  getInvoices,
  getSubscriptionPlans,
  getUserSubscription,
  subscribeToPlan,
  cancelSubscription,
} from "@/lib/services/billingService";
import { getWalletBalance } from "@/lib/services/walletService";
import type {
  BillingStats,
  ProjectBilling,
  UsageData,
  WeeklyUsageData,
  DailyUsageData,
  Invoice,
  SubscriptionPlan,
  UserSubscription,
  BillingCycle,
} from "@/types/billing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Receipt,
  BarChart3,
  Wallet,
  Sparkles,
  Building2,
  ChevronRight,
  FileText,
  Bitcoin,
  XCircle,
  Shield,
  Zap,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FreeSvg } from "@/components/svg/pricing/FreeSvg";
import { StarterSvg } from "@/components/svg/pricing/StarterSvg";
import { ProfessionalSvg } from "@/components/svg/pricing/ProfessionalSvg";
import { EnterpriseSvg } from "@/components/svg/pricing/EnterpriseSvg";
import { EmptyDataSvg } from "@/components/svg/EmptyDataSvg";

const PLAN_SVG_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#22d3ee",
  professional: "#06b6d4",
  enterprise: "#0e7490",
};

const PLAN_ICON_BG: Record<string, string> = {
  free: "bg-slate-100 dark:bg-slate-800/60",
  starter: "bg-cyan-100/70 dark:bg-cyan-900/20",
  professional: "bg-cyan-100/70 dark:bg-cyan-900/20",
  enterprise: "bg-cyan-600/20 dark:bg-cyan-950/30",
};

const PLAN_SVGS: Record<string, React.ComponentType<{ color: string }>> = {
  free: FreeSvg,
  starter: StarterSvg,
  professional: ProfessionalSvg,
  enterprise: EnterpriseSvg,
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-4 h-4 text-white" />,
  starter: <Shield className="w-4 h-4 text-white" />,
  professional: <Sparkles className="w-4 h-4 text-white" />,
  enterprise: <Crown className="w-4 h-4 text-white" />,
};

const TIER_GRADIENTS: Record<string, string> = {
  free: "from-gray-500 to-gray-600",
  starter: "from-blue-500 to-cyan-600",
  professional: "from-purple-500 to-pink-600",
  enterprise: "from-amber-500 to-orange-600",
};

const TIER_BORDERS: Record<string, string> = {
  free: "border-gray-300 dark:border-gray-600",
  starter: "border-blue-500",
  professional: "border-purple-500",
  enterprise: "border-amber-500",
};

export default function BillingContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [projectBillings, setProjectBillings] = useState<ProjectBilling[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [weeklyUsageData, setWeeklyUsageData] = useState<WeeklyUsageData[]>([]);
  const [dailyUsageData, setDailyUsageData] = useState<DailyUsageData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [usagePeriod, setUsagePeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");

  const userId = user?.id;
  const role = profile?.role || "";

  const fetchBillingData = async (showSpinner = false) => {
    if (!userId) return;

    try {
      if (showSpinner) setLoading(true);
      setError("");

      const [
        statsResult,
        projectsResult,
        usageResult,
        weeklyUsageResult,
        dailyUsageResult,
        invoicesResult,
        subResult,
        balanceResult,
      ] = await Promise.all([
        getBillingStats(userId),
        getProjectBillings(userId),
        getUsageData(userId),
        getWeeklyUsageData(userId),
        getDailyUsageData(userId),
        getInvoices(userId),
        getUserSubscription(userId),
        getWalletBalance(userId),
      ]);

      if (statsResult.error) throw statsResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (usageResult.error) throw usageResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      setStats(statsResult.data);
      setProjectBillings(projectsResult.data || []);
      setUsageData(usageResult.data || []);
      setWeeklyUsageData(weeklyUsageResult.data || []);
      setDailyUsageData(dailyUsageResult.data || []);
      setInvoices(invoicesResult.data || []);
      setSubscription(subResult.data);
      setWalletBalance(balanceResult.balance);
    } catch (err: any) {
      setError(err.message || "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBillingData(true);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getMaxUsageValue = () => {
    if (usageData.length === 0) return 100;
    const maxSpent = Math.max(...usageData.map((d) => d.amount_spent));
    const maxEarned = Math.max(...usageData.map((d) => d.amount_earned));
    return Math.max(maxSpent, maxEarned, 100);
  };

  const chartData = useMemo(() => {
    if (usagePeriod === "daily") {
      return dailyUsageData.map((d) => ({
        label: d.label,
        spent: d.amount_spent,
        earned: d.amount_earned,
      }));
    }

    if (usagePeriod === "weekly") {
      return weeklyUsageData.map((d) => ({
        label: d.label,
        spent: d.amount_spent,
        earned: d.amount_earned,
      }));
    }

    if (!usageData.length) return [];

    if (usagePeriod === "monthly") {
      return usageData.map((d) => ({
        label: formatMonthYear(d.date),
        spent: d.amount_spent,
        earned: d.amount_earned,
      }));
    }

    // yearly — aggregate monthly data by year
    const byYear: Record<string, { spent: number; earned: number }> = {};
    usageData.forEach((d) => {
      const year = d.date.slice(0, 4);
      if (!byYear[year]) byYear[year] = { spent: 0, earned: 0 };
      byYear[year].spent += d.amount_spent;
      byYear[year].earned += d.amount_earned;
    });
    return Object.entries(byYear).map(([year, vals]) => ({
      label: year,
      spent: vals.spent,
      earned: vals.earned,
    }));
  }, [usageData, weeklyUsageData, dailyUsageData, usagePeriod]);

  const hasEarnings = chartData.some((d) => d.earned > 0);

  const currentTier =
    subscription?.tier || profile?.subscription_tier || "free";
  const currentPlan = plans.find((p) => p.tier === currentTier) || plans[0];
  const usagePercentage =
    currentPlan.max_projects > 0
      ? Math.min(
          ((projectBillings.length || 0) / currentPlan.max_projects) * 100,
          100,
        )
      : 0;

  const getPrice = (plan: SubscriptionPlan) =>
    billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.tier === currentTier) return;
    setSelectedPlan(plan);
    setSubscribeError("");
    setShowConfirm(true);
  };

  const handleSubscribe = async () => {
    if (!userId || !selectedPlan) return;
    const price = getPrice(selectedPlan);

    setSubscribing(true);
    setSubscribeError("");

    try {
      const { error: subError } = await subscribeToPlan(
        userId,
        selectedPlan.id,
        selectedPlan.tier,
        billingCycle,
        price,
      );

      if (subError) throw subError;

      setShowConfirm(false);
      setSelectedPlan(null);
      await fetchBillingData(false);
    } catch (err: any) {
      setSubscribeError(err.message || "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!userId) return;
    setCancelling(true);

    try {
      const { error: cancelError } = await cancelSubscription(userId, false);
      if (cancelError) throw cancelError;

      setShowCancel(false);
      await fetchBillingData(false);
    } catch (err: any) {
      setError(err.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen pt-2")}>
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-6">
              <CardHeader className="px-6 pb-0">
                {/* Plan icon + info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-28" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                </div>
                {/* Action button */}
                <div className="flex gap-2 mt-1">
                  <Skeleton className="flex-1 h-9 rounded-xl" />
                </div>
              </CardHeader>

              <CardContent className="px-6 pt-3 pb-3">
                {/* Nav label */}
                <Skeleton className="h-3 w-20 mb-3" />
                {/* Nav items */}
                <div className="flex flex-col gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <Skeleton className="w-8 h-8 rounded-md shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-14" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Wallet section */}
                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700 space-y-2">
                  <Skeleton className="h-2.5 w-24" />
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-9 w-full rounded-xl !mt-4" />
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Main Section */}
          <section className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  className="bg-white dark:bg-gray-800/50 border-none shadow-md"
                >
                  <CardContent className="px-4">
                    <div className="flex items-end justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Plans Tab Skeleton (default visible tab) */}
            <div className="space-y-8">
              {/* Header + billing toggle */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3.5 w-52" />
                </div>
                <Skeleton className="h-9 w-44 rounded-lg" />
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-5 bg-white dark:bg-gray-800/50 space-y-4"
                  >
                    <div className="mt-1 mb-3">
                      <Skeleton className="w-14 h-14 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <div className="border-t border-gray-200 dark:border-gray-700" />
                    <div className="space-y-2.5">
                      {[40, 56, 48, 60, 44].map((w, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                          <Skeleton
                            className="h-3"
                            style={{ width: `${w}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compare table */}
              <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-gray-800/50">
                <div className="px-6 py-4 border-b border-border space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="p-4">
                  {/* Table header */}
                  <div className="flex gap-4 pb-3 border-b border-border/50">
                    <Skeleton className="w-1/3 h-4" />
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="flex-1 h-4" />
                    ))}
                  </div>
                  {/* Table rows */}
                  {[55, 48, 52, 60, 45, 58, 50, 44].map((w, i) => (
                    <div
                      key={i}
                      className="flex gap-4 py-3 border-b border-border/50 last:border-0"
                    >
                      <Skeleton
                        className="h-4"
                        style={{ width: `${w / 3}%` }}
                      />
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton key={j} className="flex-1 h-4" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pt-2")}>
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your plan, track spending and view payment history
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="plans" className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left Sidebar ── */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-6">
              <CardHeader className="px-6 pb-0">
                {/* Current Plan */}
                <div className={cn("overflow-hidden")}>
                  {/* Tier-tinted background */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {/* Plan SVG icon */}
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center p-3",
                          PLAN_ICON_BG[currentTier] || PLAN_ICON_BG.free,
                        )}
                      >
                        {(() => {
                          const SvgComponent =
                            PLAN_SVGS[currentTier] || PLAN_SVGS.free;
                          return (
                            <SvgComponent
                              color={
                                PLAN_SVG_COLORS[currentTier] ||
                                PLAN_SVG_COLORS.free
                              }
                            />
                          );
                        })()}
                      </div>

                      {/* Label + status */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Your current plan is
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold leading-none">
                            {currentPlan.name}
                          </p>
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0.5 leading-none shrink-0">
                            Active
                          </Badge>
                        </div>
                        {subscription?.cancel_at_period_end ? (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>
                              Cancels{" "}
                              {formatDate(subscription.current_period_end)}
                            </span>
                          </p>
                        ) : subscription ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              Renews{" "}
                              {formatDate(subscription.current_period_end)}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {/* Project usage progress */}
                    {currentPlan.max_projects > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">
                            Projects used
                          </span>
                          <span className="font-semibold">
                            {projectBillings.length}/
                            {currentPlan.max_projects === -1
                              ? "∞"
                              : currentPlan.max_projects}
                          </span>
                        </div>
                        <Progress value={usagePercentage} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan action buttons */}
                <div className="flex gap-2 mt-1">
                  {currentTier !== "free" &&
                    !subscription?.cancel_at_period_end && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setShowCancel(true)}
                      >
                        Cancel
                      </Button>
                    )}
                  <button
                    className="btn-gelatine flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700 text-white hover:opacity-90 transition-opacity shadow-sm"
                    onClick={() => {
                      const el = document.querySelector(
                        '[data-value="plans"]',
                      ) as HTMLElement;
                      el?.click();
                    }}
                  >
                    {currentTier === "free" ? "Upgrade" : "Change"}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="px-6 pt-3 pb-3">
                {/* Navigation label */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Navigation
                </p>

                {/* Tabs nav list */}
                <TabsList className="flex flex-col h-auto bg-transparent gap-0.5 p-0 w-full">
                  {[
                    {
                      value: "plans",
                      icon: Sparkles,
                      label: "Plans",
                      desc: "Subscription tiers",
                    },
                    {
                      value: "usage",
                      icon: BarChart3,
                      label: "Usage",
                      desc: "Spending & earnings",
                    },
                    {
                      value: "projects",
                      icon: Building2,
                      label: "Projects",
                      desc: "Per-project billing",
                    },
                    {
                      value: "invoices",
                      icon: Receipt,
                      label: "Invoices",
                      desc: "Payment history",
                    },
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      data-value={value}
                      className={cn(
                        "group w-full justify-start gap-3 px-3 py-2.5 h-auto rounded-lg text-left border-none",
                        "data-[state=active]:bg-cyan-500/10 dark:data-[state=active]:bg-cyan-900/20 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400",
                        "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800/50 data-[state=inactive]:hover:text-foreground",
                        "transition-colors",
                      )}
                    >
                      <div className="w-8 h-8 rounded-md group-data-[state=active]:bg-cyan-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {desc}
                        </p>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Wallet info */}
                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Available Balance
                  </p>
                  <p className="text-2xl font-bold text-foreground leading-none mb-1.5">
                    {formatCurrency(walletBalance)}
                  </p>
                  {stats?.total_earned !== undefined && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-4">
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      {formatCurrency(stats.total_earned)} total earned
                    </p>
                  )}
                  <button
                    className="btn-gelatine w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => router.push("/dashboard/wallet")}
                  >
                    View Transactions
                  </button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* ── Right Main Section ── */}
          <section className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
                <CardContent className="px-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(stats?.total_spent || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(stats?.this_month_spent || 0)} this
                        month
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
                <CardContent className="px-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        Total Earned
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats?.total_earned || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(stats?.this_month_earned || 0)} this
                        month
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
                <CardContent className="px-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        Balance
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(walletBalance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Available in wallet
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800/50 border-none shadow-md">
                <CardContent className="px-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(stats?.pending_payments || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Awaiting processing
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Plans Tab ── */}
            <TabsContent value="plans" className="mt-0 space-y-8">
              {/* Header + Billing Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-semibold">Choose Your Plan</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Save up to 17% with annual billing
                  </p>
                </div>
                <div className="flex items-center gap-0.5 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <button
                    className={cn(
                      "btn-gelatine px-4 py-1.5 text-sm rounded-md font-medium transition-all",
                      billingCycle === "monthly"
                        ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    className={cn(
                      "btn-gelatine px-4 py-1.5 text-sm rounded-md font-medium transition-all flex items-center gap-2",
                      billingCycle === "yearly"
                        ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Yearly
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                        billingCycle === "monthly"
                          ? "bg-gray-100 dark:bg-gray-800/50 text-black dark:text-white"
                          : "bg-white dark:bg-black text-black dark:text-white",
                      )}
                    >
                      −17%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const isCurrentPlan = plan.tier === currentTier;
                  const tierOrder = [
                    "free",
                    "starter",
                    "professional",
                    "enterprise",
                  ];
                  const isDowngrade =
                    tierOrder.indexOf(plan.tier) <
                    tierOrder.indexOf(currentTier);
                  const isFeatured = plan.tier === "professional";

                  const PLAN_DESCRIPTIONS: Record<string, string> = {
                    free: "Perfect for getting started with small projects.",
                    starter: "Great for individuals scaling their work.",
                    professional: "Best for teams and growing businesses.",
                    enterprise: "Fitting the needs of large organizations.",
                  };

                  const PlanIcon = PLAN_SVGS[plan.tier];
                  const iconColor = PLAN_SVG_COLORS[plan.tier];

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative flex flex-col rounded-xl p-5 transition-all",
                        isFeatured
                          ? "bg-white dark:bg-gray-800/50 border-2 border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]"
                          : "bg-white dark:bg-gray-800/50 border border-none hover:shadow-sm",
                        isCurrentPlan && !isFeatured && "border-none",
                      )}
                    >
                      {/* Top row: icon + current badge */}
                      <div className="flex items-start justify-between mb-3 mt-1">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center p-2.5",
                            PLAN_ICON_BG[plan.tier],
                          )}
                        >
                          <PlanIcon color={iconColor} />
                        </div>
                        {isCurrentPlan && (
                          <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                            Current
                          </span>
                        )}
                        {isFeatured && (
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                            Most popular
                          </span>
                        )}
                      </div>

                      {/* Plan name + description */}
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-foreground">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {PLAN_DESCRIPTIONS[plan.tier]}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="mb-1">
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          $
                          {billingCycle === "yearly"
                            ? Math.round(plan.price_yearly / 12)
                            : plan.price_monthly}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          / month
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-5">
                        {billingCycle === "yearly" && plan.price_yearly > 0
                          ? `$${plan.price_yearly} billed annually`
                          : "Billed monthly"}
                      </p>

                      {/* CTA Button */}
                      <Button
                        className={cn(
                          "w-full h-9 text-sm font-medium mb-5 btn-gelatine",
                          isFeatured && !isCurrentPlan
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : isCurrentPlan
                              ? "bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                              : "",
                        )}
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {isCurrentPlan
                          ? "Current plan"
                          : isDowngrade
                            ? "Downgrade"
                            : plan.price_monthly === 0
                              ? "Switch to Free"
                              : "Upgrade plan"}
                      </Button>

                      {/* Divider */}
                      <div className="border-t border-gray-200 dark:border-gray-700 mb-4" />

                      {/* Features */}
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className={cn(
                                "w-3.5 h-3.5 shrink-0 mt-0.5",
                                isFeatured
                                  ? "text-primary"
                                  : "text-muted-foreground/60",
                              )}
                            />
                            <span className="text-xs text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Compare features table */}
              {/* <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-gray-800/50">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Compare features by plan
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Easily compare features across all available plans.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-1/3">
                          Feature
                        </th>
                        {plans.map((plan) => {
                          const TableIcon = PLAN_SVGS[plan.tier];
                          return (
                            <th key={plan.id} className="text-left px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 shrink-0 inline-flex">
                                  <TableIcon
                                    color={PLAN_SVG_COLORS[plan.tier]}
                                  />
                                </span>
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    plan.tier === "professional"
                                      ? "text-primary"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {plan.name}
                                </span>
                                {plan.tier === currentTier && (
                                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                    Current
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: "Projects",
                          values: plans.map((p) =>
                            p.max_projects === -1
                              ? "Unlimited"
                              : `${p.max_projects}`,
                          ),
                        },
                        {
                          label: "Collectors",
                          values: plans.map((p) =>
                            p.max_collectors === -1
                              ? "Unlimited"
                              : `${p.max_collectors}`,
                          ),
                        },
                        {
                          label: "Storage",
                          values: plans.map((p) =>
                            p.storage_gb === -1
                              ? "Unlimited"
                              : `${p.storage_gb} GB`,
                          ),
                        },
                        {
                          label: "Support",
                          values: plans.map((p) => p.support_level),
                        },
                        {
                          label: "Analytics",
                          values: [
                            "Basic",
                            "Advanced",
                            "Real-time",
                            "Real-time",
                          ],
                        },
                        {
                          label: "API Access",
                          values: [false, true, true, true],
                        },
                        {
                          label: "Custom Branding",
                          values: [false, false, true, true],
                        },
                        {
                          label: "SLA Guarantee",
                          values: [false, false, false, true],
                        },
                      ].map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {row.label}
                          </td>
                          {row.values.map((val, colIdx) => (
                            <td key={colIdx} className="px-4 py-3">
                              {typeof val === "boolean" ? (
                                val ? (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                ) : (
                                  <span className="text-muted-foreground/30 text-base leading-none">
                                    —
                                  </span>
                                )
                              ) : (
                                <span className="text-sm text-foreground font-medium">
                                  {val}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div> */}
            </TabsContent>

            {/* ── Usage Tab ── */}
            <TabsContent value="usage" className="mt-0">
              <Card className="dark:bg-gray-800/50 border-none shadow-sm">
                <CardHeader className="px-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Spending & Earnings
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Overview of your spending and earnings over time
                      </CardDescription>
                    </div>

                    {/* Period select */}
                    <Select
                      value={usagePeriod}
                      onValueChange={(v) =>
                        setUsagePeriod(
                          v as "daily" | "weekly" | "monthly" | "yearly",
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-32 text-xs bg-gray-50 dark:bg-gray-800/50 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-50 dark:bg-[#111827] border-none">
                        <SelectItem
                          value="daily"
                          className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        >
                          Daily
                        </SelectItem>
                        <SelectItem
                          value="weekly"
                          className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        >
                          Weekly
                        </SelectItem>
                        <SelectItem
                          value="monthly"
                          className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        >
                          Monthly
                        </SelectItem>
                        <SelectItem
                          value="yearly"
                          className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        >
                          Yearly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pt-0">
                  {chartData.length === 0 || !hasEarnings ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-24 h-24">
                        <EmptyDataSvg />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        No earnings yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Earnings will appear here once you receive payments
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Line chart */}
                      <ResponsiveContainer
                        width="100%"
                        height={240}
                        initialDimension={{ width: 800, height: 240 }}
                      >
                        <LineChart
                          data={chartData}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tickFormatter={(v) => `$${v}`}
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            width={48}
                          />
                          <Tooltip
                            formatter={(
                              value: number | undefined,
                              name: string | undefined,
                            ) => [
                              formatCurrency(value ?? 0),
                              name === "spent" ? "Spent" : "Earned",
                            ]}
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                              color: "hsl(var(--foreground))",
                            }}
                            cursor={{
                              stroke: "hsl(var(--border))",
                              strokeWidth: 1,
                            }}
                          />
                          <Legend
                            formatter={(value) =>
                              value === "spent" ? "Spent" : "Earned"
                            }
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="spent"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="earned"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Summary stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {usageData.slice(-2).map((data) => (
                          <div
                            key={data.date}
                            className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              {formatMonthYear(data.date)}
                            </p>
                            <p className="text-sm font-semibold">
                              {data.projects_created} projects
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {data.submissions_received} submissions
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Projects Tab ── */}
            <TabsContent value="projects" className="mt-0">
              <Card className="dark:bg-gray-800/50 border-none shadow-sm">
                <CardHeader className="px-6">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Per-Project Billing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Spending breakdown by project
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pt-0">
                  {projectBillings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-24 h-24">
                        <EmptyDataSvg />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        No billing yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Billing appears when you pay for submissions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projectBillings.map((billing) => (
                        <div
                          key={billing.project_id}
                          className="group flex items-center gap-4 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all p-4"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              {billing.project_title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {billing.submissions_paid} payments
                              {billing.last_payment_date &&
                                ` · Last paid ${formatDate(billing.last_payment_date)}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm">
                              {formatCurrency(billing.total_spent)}
                            </p>
                            {billing.pending_payments > 0 && (
                              <p className="text-xs text-yellow-600 mt-0.5">
                                +{formatCurrency(billing.pending_payments)}{" "}
                                pending
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Invoices Tab ── */}
            <TabsContent value="invoices" className="mt-0">
              <Card className="dark:bg-gray-800/50 border-none shadow-sm">
                <CardHeader className="px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Recent Invoices
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Your payment history
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3"
                    >
                      <Download className="w-3 h-3 mr-1.5" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pt-0">
                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-24 h-24">
                        <EmptyDataSvg />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        No invoices yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Invoices appear after completed payments
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors p-4"
                        >
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {invoice.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(invoice.invoice_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-semibold text-sm">
                              {formatCurrency(invoice.amount)}
                            </span>
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-500/20 text-[10px] px-2 py-0.5">
                              Paid
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </section>
        </div>
      </Tabs>

      {/* ── Subscribe Confirmation Dialog ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {selectedPlan && (
                <div
                  className={cn(
                    "w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center",
                    TIER_GRADIENTS[selectedPlan.tier],
                  )}
                >
                  {TIER_ICONS[selectedPlan.tier]}
                </div>
              )}
              {selectedPlan?.name} Plan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm your subscription change
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-3 pt-1">
              <div className="rounded-lg bg-accent/50 p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-semibold capitalize">
                    {billingCycle}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold">
                    {formatCurrency(getPrice(selectedPlan))}
                  </span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">Wallet Balance</span>
                  <span
                    className={cn(
                      "font-semibold",
                      walletBalance >= getPrice(selectedPlan)
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
              </div>

              {walletBalance < getPrice(selectedPlan) &&
                getPrice(selectedPlan) > 0 && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Insufficient balance
                      </p>
                      <p className="text-[10px] text-red-500">
                        You need{" "}
                        {formatCurrency(getPrice(selectedPlan) - walletBalance)}{" "}
                        more.{" "}
                        <button
                          className="underline font-medium"
                          onClick={() => {
                            setShowConfirm(false);
                            router.push("/dashboard/wallet");
                          }}
                        >
                          Deposit funds
                        </button>
                      </p>
                    </div>
                  </div>
                )}

              {subscribeError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {subscribeError}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setShowConfirm(false)}
                  disabled={subscribing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-8 text-xs"
                  onClick={handleSubscribe}
                  disabled={
                    subscribing ||
                    (walletBalance < getPrice(selectedPlan) &&
                      getPrice(selectedPlan) > 0)
                  }
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Confirm
                      {getPrice(selectedPlan) > 0
                        ? ` & Pay ${formatCurrency(getPrice(selectedPlan))}`
                        : " Switch"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription Dialog ── */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-xs">
              Your subscription will remain active until the end of the current
              billing period. After that, you&apos;ll be downgraded to the Free
              plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {subscription && (
              <div className="rounded-lg bg-accent/50 p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Plan</span>
                  <span className="font-semibold">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Active Until</span>
                  <span className="font-semibold">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => setShowCancel(false)}
                disabled={cancelling}
              >
                Keep Plan
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-8 text-xs"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
