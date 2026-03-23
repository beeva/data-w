"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  FolderKanban,
  CreditCard,
  User,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Getting Started": Rocket,
  Payments: CreditCard,
  Projects: FolderKanban,
  Account: User,
};

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "How do I create my first project?",
    answer:
      "Navigate to Projects > Create New Project. Fill in the project details including title, description, data requirements, budget, and deadline. Once submitted, collectors can start working on your project.",
  },
  {
    category: "Getting Started",
    question: "What are the different user roles?",
    answer:
      "DataW has 4 roles: Requesters (create projects and pay for data), Collectors (gather data and earn money), Agents (validate submissions), and Admins (manage the platform).",
  },
  {
    category: "Getting Started",
    question: "How do I invite collectors to my project?",
    answer:
      "After creating a project, collectors can browse and submit proposals. You can also share your project link directly or set it to public so it appears in the project discovery feed. Review proposals and accept the collectors you want to work with.",
  },
  {
    category: "Getting Started",
    question: "What types of data can I collect?",
    answer:
      "DataW supports multiple data categories including Photography, Video, Audio, Text, Survey, Location Data, and Sensor Data. Choose the category that best fits your project when creating it.",
  },
  {
    category: "Getting Started",
    question: "Is there a mobile app for collectors?",
    answer:
      "Yes, collectors can access projects and submit data through our mobile-friendly web interface. We're also working on native mobile apps for iOS and Android.",
  },
  {
    category: "Getting Started",
    question: "How does the proposal process work?",
    answer:
      "Collectors submit proposals with their rates and approach. As a requester, you review proposals, compare offers, and accept the collectors that best fit your project. Accepted collectors are then assigned and can begin submitting data.",
  },
  // Payments
  {
    category: "Payments",
    question: "How do payments work?",
    answer:
      "Requesters fund their projects upfront. When a collector's submission is validated and approved, payment is automatically released to their account. You can withdraw funds once they reach the minimum threshold.",
  },
  {
    category: "Payments",
    question: "What payment methods are accepted?",
    answer:
      "We accept major credit cards (Visa, MasterCard, AmEx), PayPal, and bank transfers. Collectors can receive payments via PayPal or direct bank deposit.",
  },
  {
    category: "Payments",
    question: "When am I charged as a requester?",
    answer:
      "Your budget is reserved when you create or fund a project. Actual charges occur when submissions are validated and approved. You only pay for work that meets your quality standards.",
  },
  {
    category: "Payments",
    question: "What is the minimum withdrawal amount for collectors?",
    answer:
      "Collectors can withdraw once their balance reaches the minimum threshold (typically $10). Withdrawals are processed within 3-5 business days depending on the payment method.",
  },
  {
    category: "Payments",
    question: "Are there any platform fees?",
    answer:
      "DataW charges a service fee on completed transactions. The fee is transparently shown before you confirm a project. There are no hidden charges.",
  },
  {
    category: "Payments",
    question: "Can I get a refund for rejected submissions?",
    answer:
      "Yes. When a submission is rejected, the allocated payment is returned to your project budget and can be used for other validated submissions or withdrawn if the project is completed.",
  },
  // Projects
  {
    category: "Projects",
    question: "How long does validation take?",
    answer:
      "Most submissions are validated within 24-48 hours. AI-assisted validation helps speed up the process by pre-screening submissions for quality and compliance.",
  },
  {
    category: "Projects",
    question: "Can I edit my project after publishing?",
    answer:
      "Yes, you can edit project details while it's open. However, certain fields like budget cannot be reduced below already committed amounts. Go to Active Projects and click Edit.",
  },
  {
    category: "Projects",
    question: "How do I pause or resume a project?",
    answer:
      "Go to your project dashboard and use the Actions menu. Select 'Pause Project' to temporarily halt new work. When ready, select 'Resume Project' to reactivate it. Paused projects retain all existing data and assignments.",
  },
  {
    category: "Projects",
    question: "What happens when I reject a submission?",
    answer:
      "Rejected submissions are returned to the collector with your feedback. They can revise and resubmit if allowed by your project settings. The allocated payment is not charged and stays in your project budget.",
  },
  {
    category: "Projects",
    question: "Can I set a deadline for my project?",
    answer:
      "Yes. When creating a project, you can set an optional deadline. Collectors see this deadline when viewing your project. You can extend deadlines on active projects if needed.",
  },
  {
    category: "Projects",
    question: "How many collectors can work on one project?",
    answer:
      "You define the maximum number of collectors when creating a project. This helps you control costs and ensure adequate coverage. You can accept proposals until you reach this limit.",
  },
  {
    category: "Projects",
    question: "What if I need to cancel my project?",
    answer:
      "You can cancel a project from the Actions menu. Cancelled projects stop accepting new work. Any pending submissions will be reviewed, and funds for uncompleted work remain in your wallet.",
  },
  // Account
  {
    category: "Account",
    question: "How do I change my account settings?",
    answer:
      "Go to Account Settings from the sidebar menu. You can update your profile picture, personal information, notification preferences, and security settings.",
  },
  {
    category: "Account",
    question: "How do I delete my account?",
    answer:
      "Contact our support team to request account deletion. Note that pending projects must be completed or cancelled, and all funds withdrawn before deletion.",
  },
  {
    category: "Account",
    question: "How do I update my notification preferences?",
    answer:
      "Go to Account Settings > Notifications. You can choose to receive email alerts for new proposals, validated submissions, project deadlines, and support updates.",
  },
  {
    category: "Account",
    question: "How do I reset my password?",
    answer:
      "Click 'Forgot password' on the login page and enter your email. You'll receive a link to reset your password. The link expires after 24 hours for security.",
  },
  {
    category: "Account",
    question: "What is the Pro subscription and what does it include?",
    answer:
      "Pro subscribers get higher project limits, priority support, advanced analytics, and exclusive features. Upgrade from your billing page or dashboard sidebar.",
  },
  {
    category: "Account",
    question: "How do I view my transaction history?",
    answer:
      "Go to Wallet from the sidebar or dashboard. Your transaction history shows all deposits, project charges, refunds, and withdrawals with dates and amounts.",
  },
];

const groupedFaqs = faqs.reduce(
  (acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  },
  {} as Record<string, FAQItem[]>,
);

const categories = Object.keys(groupedFaqs);

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0],
  );
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const currentFaqs = groupedFaqs[selectedCategory] ?? [];

  return (
    <div className="p-2">
      {/* Page header */}
      <div className="pt-2 mb-4">
        <h1 className="text-lg font-bold text-foreground">Help Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Find answers to common questions about DataW
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left - Category navigation */}
        <aside className="w-full lg:w-60 xl:w-64 shrink-0">
          <Card className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden">
            <CardHeader className="pt-4 pb-3 px-5 border-b border-gray-100 dark:border-gray-700/50">
              <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Browse by category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="flex flex-col gap-0.5">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] ?? FolderKanban;
                  const isActive = selectedCategory === cat;
                  const count = groupedFaqs[cat]?.length ?? 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setExpandedIdx(null);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all duration-200",
                        isActive
                          ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 font-semibold shadow-sm"
                          : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          isActive
                            ? "bg-cyan-500/20"
                            : "bg-gray-100 dark:bg-gray-700/50",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isActive
                              ? "text-cyan-500"
                              : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm truncate">{cat}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {count} questions
                        </span>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Right - FAQ content + support sidebar */}
        <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-6">
          {/* Main - FAQs for selected category */}
          <section className="flex-1 min-w-0 flex flex-col gap-4">
            <Card className="dark:bg-gray-800/50 border-none shadow-md overflow-hidden flex-1 flex flex-col">
              <CardHeader className="pt-4 pb-3 px-5 border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    {(() => {
                      const Icon =
                        CATEGORY_ICONS[selectedCategory] ?? HelpCircle;
                      return <Icon className="w-5 h-5 text-cyan-500" />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {selectedCategory}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentFaqs.length} question
                      {currentFaqs.length !== 1 ? "s" : ""} in this category
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-0 pb-0 flex-1 min-h-0">
                {currentFaqs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-5">
                    <HelpCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      No FAQs in this category
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select another category above
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {currentFaqs.map((faq) => {
                      const globalIdx = faqs.indexOf(faq);
                      const isExpanded = expandedIdx === globalIdx;
                      return (
                        <div
                          key={globalIdx}
                          className={cn(
                            "transition-colors",
                            isExpanded && "bg-gray-50/80 dark:bg-gray-700/20",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedIdx(isExpanded ? null : globalIdx)
                            }
                            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground leading-snug">
                              {faq.question}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isExpanded
                                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                  : "bg-gray-100 dark:bg-gray-700/50 text-muted-foreground",
                              )}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          </button>
                          <div
                            className={cn(
                              "grid transition-all duration-200 ease-out overflow-hidden",
                              isExpanded
                                ? "grid-rows-[1fr]"
                                : "grid-rows-[0fr]",
                            )}
                          >
                            <div className="min-h-0">
                              <div className="px-5 pb-5 pt-0">
                                <p className="text-sm text-muted-foreground leading-relaxed pl-0">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Right sidebar - Quick links */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-6">
            <Card className="dark:bg-gray-800/50 border-none shadow-sm">
              <CardContent className="px-6 pt-6">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Need more help?
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard/support"
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium block">Contact Support</span>
                      <span className="text-xs text-muted-foreground">
                        Submit a ticket or chat with us
                      </span>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <LifeBuoy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium block">
                        Account Settings
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Manage your profile & preferences
                      </span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800/50 border-none shadow-sm bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
              <CardContent className="px-6 py-4">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Can&apos;t find your answer?
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Our support team typically responds within 2 hours during
                  business hours.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-600 dark:to-teal-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Link href="/dashboard/support">Go to Support</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
