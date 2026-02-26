"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBillingStats,
  getProjectBillings,
  getUsageData,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Subscription dialog
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Cancel dialog
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const userId = user?.id;

  const fetchBillingData = async (showSpinner = false) => {
    if (!userId) return;

    try {
      if (showSpinner) setLoading(true);
      setError("");

      const [statsResult, projectsResult, usageResult, invoicesResult, subResult, balanceResult] =
        await Promise.all([
          getBillingStats(userId),
          getProjectBillings(userId),
          getUsageData(userId),
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
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString + "-01");
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const getMaxUsageValue = () => {
    if (usageData.length === 0) return 100;
    const maxSpent = Math.max(...usageData.map((d) => d.amount_spent));
    const maxEarned = Math.max(...usageData.map((d) => d.amount_earned));
    return Math.max(maxSpent, maxEarned, 100);
  };

  const currentTier = subscription?.tier || profile?.subscription_tier || "free";
  const currentPlan = plans.find((p) => p.tier === currentTier) || plans[0];
  const usagePercentage =
    currentPlan.max_projects > 0
      ? Math.min(((projectBillings.length || 0) / currentPlan.max_projects) * 100, 100)
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
        price
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
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Billing & Subscription</h1>
          <p className="text-[10px] text-muted-foreground">
            Manage your plan, billing and spending
          </p>
        </div>
        <Button
          onClick={() => fetchBillingData(true)}
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
        >
          <RefreshCw className="w-2.5 h-2.5 mr-1" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px]">
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      <Card className="dark:bg-gray-800/50 border-none bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <CardContent className="py-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-md bg-gradient-to-br flex items-center justify-center",
                  TIER_GRADIENTS[currentTier] || TIER_GRADIENTS.free
                )}
              >
                {TIER_ICONS[currentTier] || TIER_ICONS.free}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-semibold">{currentPlan.name} Plan</h2>
                  <Badge
                    variant="secondary"
                    className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-[8px] px-1 py-0"
                  >
                    Active
                  </Badge>
                  {subscription?.cancel_at_period_end && (
                    <Badge className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 text-[8px] px-1 py-0">
                      Cancels {formatDate(subscription.current_period_end)}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {currentPlan.max_projects === -1
                    ? "Unlimited"
                    : currentPlan.max_projects}{" "}
                  projects
                  {subscription &&
                    ` • Renews ${formatDate(subscription.current_period_end)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {currentTier !== "free" && !subscription?.cancel_at_period_end && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setShowCancel(true)}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                className="h-6 text-[10px] px-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() =>
                  document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                {currentTier === "free" ? "Upgrade" : "Change Plan"}
              </Button>
            </div>
          </div>

          {currentPlan.max_projects > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground">Projects</span>
                <span className="font-medium">
                  {projectBillings.length}/{currentPlan.max_projects}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Spent</p>
                <p className="text-sm font-bold">
                  {formatCurrency(stats?.total_spent || 0)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {formatCurrency(stats?.this_month_spent || 0)} /mo
                </p>
              </div>
              <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Earned</p>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(stats?.total_earned || 0)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {formatCurrency(stats?.this_month_earned || 0)} /mo
                </p>
              </div>
              <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowDownRight className="w-3 h-3 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Balance</p>
                <p className="text-sm font-bold text-blue-600">
                  {formatCurrency(walletBalance)}
                </p>
                <p className="text-[9px] text-muted-foreground">Available</p>
              </div>
              <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Pending</p>
                <p className="text-sm font-bold text-yellow-600">
                  {formatCurrency(stats?.pending_payments || 0)}
                </p>
                <p className="text-[9px] text-muted-foreground">Awaiting</p>
              </div>
              <div className="w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-3 h-3 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-1.5 h-7">
          <TabsTrigger value="plans" className="text-[10px] h-6">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="usage" className="text-[10px] h-6">
            <BarChart3 className="w-2.5 h-2.5 mr-0.5" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-[10px] h-6">
            <FileText className="w-2.5 h-2.5 mr-0.5" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-[10px] h-6">
            <Receipt className="w-2.5 h-2.5 mr-0.5" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-2" id="plans-section">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant={billingCycle === "monthly" ? "default" : "outline"}
              className="h-6 text-[10px] px-3"
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>
            <Button
              size="sm"
              variant={billingCycle === "yearly" ? "default" : "outline"}
              className="h-6 text-[10px] px-3"
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
              <Badge className="ml-1 bg-green-500 text-white text-[8px] px-1 py-0">
                Save 17%
              </Badge>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {plans.map((plan) => {
              const isCurrentPlan = plan.tier === currentTier;
              const price = getPrice(plan);
              const tierOrder = ["free", "starter", "professional", "enterprise"];
              const isDowngrade = tierOrder.indexOf(plan.tier) < tierOrder.indexOf(currentTier);

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative transition-all hover:shadow-md",
                    isCurrentPlan
                      ? cn("ring-2", TIER_BORDERS[plan.tier])
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                  )}
                >
                  {plan.tier === "professional" && !isCurrentPlan && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] px-2 py-0">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="py-3 px-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-md bg-gradient-to-br flex items-center justify-center",
                          TIER_GRADIENTS[plan.tier]
                        )}
                      >
                        {TIER_ICONS[plan.tier]}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold">{plan.name}</h3>
                        {isCurrentPlan && (
                          <Badge className="bg-cyan-500 text-white text-[7px] px-1 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xl font-bold">
                        ${billingCycle === "yearly" ? Math.round(plan.price_yearly / 12) : plan.price_monthly}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /mo
                        </span>
                      </p>
                      {billingCycle === "yearly" && plan.price_yearly > 0 && (
                        <p className="text-[9px] text-muted-foreground">
                          ${plan.price_yearly}/year billed annually
                        </p>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
                      {plan.max_projects === -1 ? "Unlimited projects" : `Up to ${plan.max_projects} projects`}
                    </p>

                    <Button
                      className={cn(
                        "w-full h-7 text-[10px]",
                        !isCurrentPlan &&
                          plan.tier === "professional" &&
                          "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      )}
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isCurrentPlan
                        ? "Current Plan"
                        : isDowngrade
                          ? "Downgrade"
                          : plan.price_monthly === 0
                            ? "Switch to Free"
                            : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Wallet reminder */}
          <Card className="dark:bg-gray-800/50 border-none bg-gradient-to-r from-orange-500/10 to-amber-500/10">
            <CardContent className="py-2 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bitcoin className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-[11px] font-medium">
                      Pay with crypto — Wallet balance: {formatCurrency(walletBalance)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Subscription fees are charged from your wallet balance
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2"
                  onClick={() => router.push("/dashboard/wallet")}
                >
                  <Wallet className="w-2.5 h-2.5 mr-1" />
                  Deposit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-1.5">
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Spending & Earnings
              </CardTitle>
              <CardDescription className="text-[10px]">Last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="py-1.5 px-3">
              <div className="space-y-2">
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-[9px] text-muted-foreground">Spent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-[9px] text-muted-foreground">Earned</span>
                  </div>
                </div>

                <div className="h-24 flex items-end justify-between gap-1">
                  {usageData.map((data) => {
                    const maxValue = getMaxUsageValue();
                    const spentHeight = (data.amount_spent / maxValue) * 100;
                    const earnedHeight = (data.amount_earned / maxValue) * 100;

                    return (
                      <div key={data.date} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end justify-center gap-px h-20">
                          <div
                            className="w-2 bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600"
                            style={{ height: `${Math.max(spentHeight, 2)}%` }}
                            title={`Spent: ${formatCurrency(data.amount_spent)}`}
                          ></div>
                          <div
                            className="w-2 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                            style={{ height: `${Math.max(earnedHeight, 2)}%` }}
                            title={`Earned: ${formatCurrency(data.amount_earned)}`}
                          ></div>
                        </div>
                        <span className="text-[8px] text-muted-foreground">
                          {formatMonthYear(data.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                  {usageData.slice(-2).map((data) => (
                    <div key={data.date} className="text-center">
                      <p className="text-[9px] text-muted-foreground">
                        {formatMonthYear(data.date)}
                      </p>
                      <p className="text-[11px] font-semibold">{data.projects_created} proj</p>
                      <p className="text-[9px] text-muted-foreground">
                        {data.submissions_received} sub
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-1.5">
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Per-Project Billing
              </CardTitle>
              <CardDescription className="text-[10px]">Spending by project</CardDescription>
            </CardHeader>
            <CardContent className="py-1.5 px-3">
              {projectBillings.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                  <h3 className="text-[11px] font-semibold mb-0.5">No billing yet</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Billing appears when paying for submissions
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {projectBillings.map((billing) => (
                    <div
                      key={billing.project_id}
                      className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-semibold truncate">
                          {billing.project_title}
                        </h4>
                        <p className="text-[9px] text-muted-foreground">
                          {billing.submissions_paid} payments{" "}
                          {billing.last_payment_date &&
                            `• ${formatDate(billing.last_payment_date)}`}
                        </p>
                      </div>
                      <div className="text-right ml-1.5">
                        <p className="font-bold text-[11px]">
                          {formatCurrency(billing.total_spent)}
                        </p>
                        {billing.pending_payments > 0 && (
                          <p className="text-[9px] text-yellow-600">
                            +{formatCurrency(billing.pending_payments)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground ml-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-1.5">
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs flex items-center gap-1">
                    <Receipt className="w-3 h-3" />
                    Recent Invoices
                  </CardTitle>
                  <CardDescription className="text-[10px]">Payment history</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5">
                  <Download className="w-2.5 h-2.5 mr-0.5" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-1.5 px-3">
              {invoices.length === 0 ? (
                <div className="text-center py-4">
                  <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                  <h3 className="text-[11px] font-semibold mb-0.5">No invoices yet</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Invoices appear after payments
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium">{invoice.description}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {formatDate(invoice.invoice_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[11px]">
                          {formatCurrency(invoice.amount)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 dark:bg-green-900/30 text-green-700 text-[8px] px-1 py-0"
                        >
                          Paid
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <Download className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Subscribe Confirmation Dialog ─── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {selectedPlan && (
                <div
                  className={cn(
                    "w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center",
                    TIER_GRADIENTS[selectedPlan.tier]
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
                  <span className="font-semibold capitalize">{billingCycle}</span>
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
                      walletBalance >= getPrice(selectedPlan) ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
              </div>

              {walletBalance < getPrice(selectedPlan) && getPrice(selectedPlan) > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Insufficient balance
                    </p>
                    <p className="text-[10px] text-red-500">
                      You need {formatCurrency(getPrice(selectedPlan) - walletBalance)} more.{" "}
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
                    (walletBalance < getPrice(selectedPlan) && getPrice(selectedPlan) > 0)
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
                      Confirm {getPrice(selectedPlan) > 0 ? `& Pay ${formatCurrency(getPrice(selectedPlan))}` : "Switch"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Cancel Subscription Dialog ─── */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-xs">
              Your subscription will remain active until the end of the current billing period.
              After that, you&apos;ll be downgraded to the Free plan.
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
