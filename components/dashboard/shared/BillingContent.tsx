"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBillingStats,
  getProjectBillings,
  getUsageData,
  getInvoices,
  getSubscriptionPlans,
  getMockPaymentMethods,
} from "@/lib/services/billingService";
import type {
  BillingStats,
  ProjectBilling,
  UsageData,
  Invoice,
  SubscriptionPlan,
  PaymentMethod,
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
  DollarSign,
  CreditCard,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Plus,
  ExternalLink,
  Receipt,
  BarChart3,
  Wallet,
  Sparkles,
  Building2,
  ChevronRight,
  FileText,
} from "lucide-react";

export default function BillingContent() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [projectBillings, setProjectBillings] = useState<ProjectBilling[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [plans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id;

  const fetchBillingData = async (showSpinner = false) => {
    if (!userId) return;

    try {
      if (showSpinner) setLoading(true);
      setError("");

      const [statsResult, projectsResult, usageResult, invoicesResult] =
        await Promise.all([
          getBillingStats(userId),
          getProjectBillings(userId),
          getUsageData(userId),
          getInvoices(userId),
        ]);

      if (statsResult.error) throw statsResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (usageResult.error) throw usageResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      setStats(statsResult.data);
      setProjectBillings(projectsResult.data || []);
      setUsageData(usageResult.data || []);
      setInvoices(invoicesResult.data || []);
      setPaymentMethods(getMockPaymentMethods());
    } catch (err: any) {
      setError(err.message || "Failed to load billing data");
      console.error("Error fetching billing data:", err);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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

  // Calculate current plan (mock - would come from subscription service)
  const currentPlan = plans[0]; // Free plan by default
  const usagePercentage = Math.min(
    ((projectBillings.length || 0) / currentPlan.max_projects) * 100,
    100
  );

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
          <p className="text-[10px] text-muted-foreground">Manage billing and spending</p>
        </div>
        <Button onClick={() => fetchBillingData(true)} variant="outline" size="sm" className="h-6 text-[10px] px-2">
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
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-semibold">{currentPlan.name} Plan</h2>
                  <Badge
                    variant="secondary"
                    className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-[8px] px-1 py-0"
                  >
                    Current
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {currentPlan.max_projects === -1 ? "Unlimited" : currentPlan.max_projects} projects • {currentPlan.storage_gb}GB • {currentPlan.support_level}
                </p>
              </div>
            </div>
            <Button size="sm" className="h-6 text-[10px] px-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
              Upgrade
            </Button>
          </div>

          {currentPlan.max_projects > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground">Projects</span>
                <span className="font-medium">{projectBillings.length}/{currentPlan.max_projects}</span>
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
                <p className="text-sm font-bold">{formatCurrency(stats?.total_spent || 0)}</p>
                <p className="text-[9px] text-muted-foreground">{formatCurrency(stats?.this_month_spent || 0)} /mo</p>
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
                <p className="text-sm font-bold text-green-600">{formatCurrency(stats?.total_earned || 0)}</p>
                <p className="text-[9px] text-muted-foreground">{formatCurrency(stats?.this_month_earned || 0)} /mo</p>
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
                <p className="text-[9px] text-muted-foreground uppercase">Pending</p>
                <p className="text-sm font-bold text-yellow-600">{formatCurrency(stats?.pending_payments || 0)}</p>
                <p className="text-[9px] text-muted-foreground">Awaiting</p>
              </div>
              <div className="w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-3 h-3 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="py-2 px-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Upcoming</p>
                <p className="text-sm font-bold">{formatCurrency(stats?.upcoming_bill || 0)}</p>
                <p className="text-[9px] text-muted-foreground">{formatDate(stats?.next_billing_date || null)}</p>
              </div>
              <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-3 h-3 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-1.5 h-7">
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
          <TabsTrigger value="payment" className="text-[10px] h-6">
            <CreditCard className="w-2.5 h-2.5 mr-0.5" />
            Payment
          </TabsTrigger>
        </TabsList>

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
                {/* Chart Legend */}
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

                {/* Bar Chart */}
                <div className="h-24 flex items-end justify-between gap-1">
                  {usageData.map((data, idx) => {
                    const maxValue = getMaxUsageValue();
                    const spentHeight = (data.amount_spent / maxValue) * 100;
                    const earnedHeight = (data.amount_earned / maxValue) * 100;

                    return (
                      <div
                        key={data.date}
                        className="flex-1 flex flex-col items-center gap-0.5"
                      >
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

                {/* Monthly Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                  {usageData.slice(-2).map((data) => (
                    <div key={data.date} className="text-center">
                      <p className="text-[9px] text-muted-foreground">{formatMonthYear(data.date)}</p>
                      <p className="text-[11px] font-semibold">{data.projects_created} proj</p>
                      <p className="text-[9px] text-muted-foreground">{data.submissions_received} sub</p>
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
                  <p className="text-[10px] text-muted-foreground">Billing appears when paying for submissions</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {projectBillings.map((billing) => (
                    <div
                      key={billing.project_id}
                      className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-semibold truncate">{billing.project_title}</h4>
                        <p className="text-[9px] text-muted-foreground">
                          {billing.submissions_paid} payments {billing.last_payment_date && `• ${formatDate(billing.last_payment_date)}`}
                        </p>
                      </div>
                      <div className="text-right ml-1.5">
                        <p className="font-bold text-[11px]">{formatCurrency(billing.total_spent)}</p>
                        {billing.pending_payments > 0 && (
                          <p className="text-[9px] text-yellow-600">+{formatCurrency(billing.pending_payments)}</p>
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
                  <p className="text-[10px] text-muted-foreground">Invoices appear after payments</p>
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
                          <p className="text-[9px] text-muted-foreground">{formatDate(invoice.invoice_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[11px]">{formatCurrency(invoice.amount)}</span>
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 text-[8px] px-1 py-0">Paid</Badge>
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

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {/* Payment Methods */}
            <Card className="dark:bg-gray-800/50 border-none">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-[11px]">Manage your payment options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 py-2 px-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-cyan-500"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">
                          {method.brand} •••• {method.last_four}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Expires {method.exp_month}/{method.exp_year}
                        </p>
                      </div>
                    </div>
                    {method.is_default && (
                      <Badge
                        variant="secondary"
                        className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-[9px] px-1 py-0"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                ))}

                <Button variant="outline" className="w-full h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Payment Links */}
            <Card className="dark:bg-gray-800/50 border-none">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-[11px]">Manage payments and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 py-2 px-4">
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-2 px-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium">Stripe Dashboard</p>
                      <p className="text-[9px] text-muted-foreground">
                        Manage via Stripe
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-2 px-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <DollarSign className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium">Withdraw Earnings</p>
                      <p className="text-[9px] text-muted-foreground">
                        Transfer to bank
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-2 px-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Receipt className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium">Billing Portal</p>
                      <p className="text-[9px] text-muted-foreground">
                        Update billing info
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-2 px-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <AlertCircle className="w-3 h-3 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium">Tax Documents</p>
                      <p className="text-[9px] text-muted-foreground">
                        Download W-9 forms
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans */}
          <Card className="dark:bg-gray-800/50 border-none">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Available Plans
              </CardTitle>
              <CardDescription className="text-[11px]">
                Choose the plan that fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-2.5 rounded-lg border transition-all ${
                      plan.tier === currentPlan.tier
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-semibold">{plan.name}</h3>
                      {plan.tier === currentPlan.tier && (
                        <Badge className="bg-cyan-500 text-[8px] px-1 py-0">Current</Badge>
                      )}
                    </div>
                    <p className="text-base font-bold">
                      ${plan.price_monthly}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                    <ul className="mt-2 space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-[10px] flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
                          <span className="truncate">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-2 h-6 text-[10px]"
                      variant={
                        plan.tier === currentPlan.tier ? "outline" : "default"
                      }
                      disabled={plan.tier === currentPlan.tier}
                    >
                      {plan.tier === currentPlan.tier
                        ? "Current"
                        : "Select"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
