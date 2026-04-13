"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDatawBalance } from "@/lib/hooks/useDatawBalance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeftRight,
  ChevronRight,
  CreditCard,
  FolderSearch,
  LifeBuoy,
  MapPin,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { UserRole } from "@/config/navigation";

function roleLabel(role: UserRole | undefined): string {
  if (role === "company") return "Company";
  if (role === "personal") return "Personal";
  return "Account";
}

export default function PersonalCompanyDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { amount: datawAmount, loading: datawLoading } = useDatawBalance();
  const role = profile?.role as UserRole | undefined;

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = (
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  return (
    <div className="p-1 sm:p-2">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 pt-1 sm:pt-2">
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-3 sm:gap-4">
          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-4 sm:px-6">
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 sm:w-20 sm:h-20">
                      <AvatarImage
                        src={profile?.avatar_url || "/default-avatar.svg"}
                      />
                      <AvatarFallback className="p-0 overflow-hidden text-2xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                        <img
                          src="/default-avatar.svg"
                          alt={initials}
                          className="w-full h-full object-cover"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-400 border-[3px] sm:border-[4px] border-white dark:border-gray-800" />
                  </div>

                  <div className="flex flex-col gap-1.5 justify-center">
                    <h2 className="font-semibold text-base text-foreground leading-tight">
                      {displayName}
                    </h2>
                    <Badge className="text-[10px] capitalize bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-0 w-fit">
                      {roleLabel(role)}
                    </Badge>

                    {profile?.location?.address ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate text-sm max-w-[9rem] sm:max-w-[12rem]">
                          {[profile.location.city, profile.location.country]
                            .filter(Boolean)
                            .join(", ") || profile.location.address}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate text-sm max-w-[9rem] sm:max-w-[12rem]">
                          No location set
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(() => {
                  const fields = [
                    { label: "Phone number", done: !!profile?.phone },
                    { label: "Bio", done: !!profile?.bio },
                    { label: "Location", done: !!profile?.location?.address },
                  ];
                  const baseScore = profile?.full_name ? 40 : 0;
                  const extraScore = fields.filter((f) => f.done).length * 20;
                  const pct = baseScore + extraScore;
                  const missing = fields.filter((f) => !f.done);
                  if (pct === 100) return null;
                  return (
                    <div className="w-full pt-3 mt-1 text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-foreground">
                          Profile completion
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            pct === 100
                              ? "text-emerald-500"
                              : pct >= 60
                                ? "text-cyan-500"
                                : "text-amber-500"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-1.5 bg-gray-100 dark:bg-gray-700"
                      />
                      {missing.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/settings")}
                            className="mt-1.5 w-full text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline text-left"
                          >
                            Complete your profile →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {profile?.subscription_tier !== "pro" && (
                  <div className="mt-1 w-full flex flex-col gap-2">
                    <Link
                      href="/dashboard/billing"
                      className="btn-gelatine w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700 text-white hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Upgrade to Pro
                    </Link>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Higher limits and priority support for your account.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  DATAW Balance
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground mb-0.5">
                {datawLoading ? (
                  <span className="inline-block h-8 w-28 animate-pulse rounded-md bg-muted" />
                ) : datawAmount === null ? (
                  <span className="text-base font-medium text-muted-foreground">
                    Connect wallet
                  </span>
                ) : (
                  `${datawAmount.toFixed(4)} DATAW`
                )}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mb-3">
                <TrendingUp className="w-3 h-3" />
                <span>Use the Data Pool to discover and purchase datasets</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm h-10 rounded-xl dark:bg-[#18212F] hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-200 dark:border-gray-700"
                onClick={() => router.push("/dashboard/wallet")}
              >
                View Transactions
              </Button>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/50 border-none shadow-sm">
            <CardContent className="px-4 sm:px-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    icon: FolderSearch,
                    label: "Data Pool",
                    href: "/datapool",
                  },
                  {
                    icon: LifeBuoy,
                    label: "Help Center",
                    href: "/dashboard/faq",
                  },
                  {
                    icon: CreditCard,
                    label: "Billing & Subscription",
                    href: "/dashboard/billing",
                  },
                  {
                    icon: Settings,
                    label: "Account Settings",
                    href: "/dashboard/settings",
                  },
                ].map(({ icon: Icon, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 font-medium">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Welcome back!
              </h1>
              <p className="text-xs text-muted-foreground">
                Explore the Data Pool, manage your DATAW in Wallet, and keep your
                account up to date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="dark:bg-gray-800/50 border-none shadow-sm overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-cyan-500/10 p-2.5">
                    <FolderSearch className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      Data Pool
                    </h2>
                    <p className="text-xs text-muted-foreground mb-3">
                      Search, filter, and purchase datasets that match your
                      needs.
                    </p>
                    <Button
                      size="sm"
                      className="btn-gelatine rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                      onClick={() => router.push("/datapool")}
                    >
                      Open Data Pool
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800/50 border-none shadow-sm overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5">
                    <ArrowLeftRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      Transactions
                    </h2>
                    <p className="text-xs text-muted-foreground mb-3">
                      Review payments, top-ups, and purchase history.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => router.push("/dashboard/wallet")}
                    >
                      View wallet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
