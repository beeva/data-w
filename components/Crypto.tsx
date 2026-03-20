"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./Header";
import PageHero from "./PageHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Zap,
  Shield,
  ArrowRight,
  Coins,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart,
  Banknote,
  RefreshCw,
} from "lucide-react";

// Mock price data for the chart
const generateMockPriceData = () => {
  const data = [];
  let price = 0.85;
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.48) * 0.05;
    price = Math.max(0.5, Math.min(1.5, price + change));
    data.push({
      day: i + 1,
      price: price,
    });
  }
  return data;
};

export default function Crypto() {
  const [priceData, setPriceData] = useState<{ day: number; price: number }[]>(
    [],
  );
  const [currentPrice, setCurrentPrice] = useState(0.92);
  const [priceChange, setPriceChange] = useState(3.45);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setPriceData(generateMockPriceData());

    // Simulate live price updates
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.01;
      setCurrentPrice((prev) => Math.max(0.5, Math.min(1.5, prev + change)));
      setPriceChange((prev) => prev + (Math.random() - 0.5) * 0.5);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const timeframes = ["24H", "7D", "30D", "90D", "1Y", "ALL"];

  const tokenStats = [
    { label: "Market Cap", value: "$45.2M", icon: PieChart },
    { label: "Circulating Supply", value: "48.5M DTW", icon: Coins },
    { label: "Total Supply", value: "100M DTW", icon: BarChart3 },
    { label: "24h Volume", value: "$2.8M", icon: Activity },
  ];

  const benefits = [
    {
      icon: Globe,
      title: "Global Access",
      description:
        "Anyone in the world can receive payments instantly, regardless of their location or banking infrastructure.",
    },
    {
      icon: Zap,
      title: "Instant Settlements",
      description:
        "No more waiting 3-5 business days. Payments settle in minutes, not days.",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description:
        "Built on blockchain technology ensuring every transaction is secure and verifiable.",
    },
    {
      icon: Banknote,
      title: "Low Fees",
      description:
        "Minimal transaction fees compared to traditional payment processors and international transfers.",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Complete Tasks",
      description: "Collect data and complete projects on the DataW platform.",
    },
    {
      step: 2,
      title: "Earn DTW Tokens",
      description:
        "Receive DTW tokens directly to your wallet upon validation.",
    },
    {
      step: 3,
      title: "Convert or Hold",
      description:
        "Exchange DTW for local currency or hold for potential appreciation.",
    },
  ];

  const maxPrice = Math.max(...priceData.map((d) => d.price));
  const minPrice = Math.min(...priceData.map((d) => d.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />

      <PageHero
        title="DataW Crypto"
        subtitle="Payments Without Borders"
        description="Get paid anywhere in the world with DTW tokens. No bank account required, no complex payment setups, just instant global payments."
      />

      <main className="pb-20 pt-8">
        <div className="container mx-auto px-6">
          {/* Live Price Section */}
          <div className="mb-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              {/* Price Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Coins className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">
                          DataW Token
                        </h2>
                        <Badge className="bg-white/10 text-white/70 border-0">
                          DTW
                        </Badge>
                        {isLive && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 inline-block" />
                            Live
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/50 text-sm mt-1">
                        The native token of the DataW ecosystem
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">
                      ${currentPrice.toFixed(4)}
                    </p>
                    <div
                      className={`flex items-center justify-end gap-1 ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {priceChange >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {Math.abs(priceChange).toFixed(2)}%
                      </span>
                      <span className="text-white/40 text-sm ml-1">24h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="p-6">
                {/* Timeframe Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {timeframes.map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setSelectedTimeframe(tf)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          selectedTimeframe === tf
                            ? "bg-cyan-500 text-white"
                            : "text-white/50 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPriceData(generateMockPriceData())}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {/* Simple Chart */}
                <div className="h-64 relative">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-right pr-3 text-xs text-white/40">
                    <span>${maxPrice.toFixed(2)}</span>
                    <span>${((maxPrice + minPrice) / 2).toFixed(2)}</span>
                    <span>${minPrice.toFixed(2)}</span>
                  </div>

                  {/* Chart SVG */}
                  <div className="ml-16 h-full pb-8">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgb(6, 182, 212)"
                            stopOpacity="0.3"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgb(6, 182, 212)"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      {/* Area fill */}
                      <path
                        d={`
                          M 0 ${((maxPrice - priceData[0]?.price || 0) / priceRange) * 100}%
                          ${priceData
                            .map((d, i) => {
                              const x = (i / (priceData.length - 1)) * 100;
                              const y =
                                priceRange > 0
                                  ? ((maxPrice - d.price) / priceRange) * 100
                                  : 50;
                              return `L ${x}% ${y}%`;
                            })
                            .join(" ")}
                          L 100% 100%
                          L 0% 100%
                          Z
                        `}
                        fill="url(#chartGradient)"
                      />

                      {/* Line */}
                      <path
                        d={`
                          M 0 ${((maxPrice - priceData[0]?.price || 0) / priceRange) * 100}%
                          ${priceData
                            .map((d, i) => {
                              const x = (i / (priceData.length - 1)) * 100;
                              const y =
                                priceRange > 0
                                  ? ((maxPrice - d.price) / priceRange) * 100
                                  : 50;
                              return `L ${x}% ${y}%`;
                            })
                            .join(" ")}
                        `}
                        fill="none"
                        stroke="rgb(6, 182, 212)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-16 right-0 flex justify-between text-xs text-white/40">
                    <span>30d ago</span>
                    <span>20d ago</span>
                    <span>10d ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>

              {/* Token Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
                {tokenStats.map((stat, idx) => (
                  <div
                    key={stat.label}
                    className={`p-4 ${idx < tokenStats.length - 1 ? "border-r border-white/10" : ""}`}
                  >
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <stat.icon className="w-4 h-4" />
                      {stat.label}
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Why Crypto Payments Section */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                Why DTW?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Payments for Everyone, Everywhere
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Traditional payment systems exclude billions of people
                worldwide. DataW Token ensures that every contributor can get
                paid instantly, regardless of where they live.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, idx) => (
                <div
                  key={benefit.title}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-cyan-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                    <benefit.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* The Problem We Solve */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-2xl border border-white/10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
                    The Problem
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Traditional Payments Are Broken
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Bank Account Required
                        </p>
                        <p className="text-white/50 text-sm">
                          1.7 billion adults remain unbanked globally
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">High Fees</p>
                        <p className="text-white/50 text-sm">
                          International transfers cost 5-10% on average
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Slow Processing
                        </p>
                        <p className="text-white/50 text-sm">
                          Cross-border payments take 3-5 business days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Geographic Restrictions
                        </p>
                        <p className="text-white/50 text-sm">
                          PayPal, Stripe unavailable in many countries
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
                    Our Solution
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    DTW Token Changes Everything
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Just a Wallet</p>
                        <p className="text-white/50 text-sm">
                          Create a wallet in seconds, no ID required
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Near-Zero Fees</p>
                        <p className="text-white/50 text-sm">
                          Transaction fees under $0.01
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Instant Settlement
                        </p>
                        <p className="text-white/50 text-sm">
                          Payments confirmed in under 2 minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Truly Global</p>
                        <p className="text-white/50 text-sm">
                          Works in every country, no restrictions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start Earning in 3 Simple Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {howItWorks.map((item, idx) => (
                <div key={item.step} className="relative">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm">{item.description}</p>
                  </div>
                  {idx < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Token Distribution */}
          <div className="mb-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Token Distribution
                </h2>
                <p className="text-white/60">How DTW tokens are allocated</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Simple visual */}
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Community Rewards - 40% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgb(6, 182, 212)"
                        strokeWidth="20"
                        strokeDasharray="100.53 150.79"
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                      {/* Platform Development - 25% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="20"
                        strokeDasharray="62.83 188.49"
                        strokeDashoffset="-100.53"
                        transform="rotate(-90 50 50)"
                      />
                      {/* Team & Advisors - 15% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgb(168, 85, 247)"
                        strokeWidth="20"
                        strokeDasharray="37.7 213.62"
                        strokeDashoffset="-163.36"
                        transform="rotate(-90 50 50)"
                      />
                      {/* Liquidity & Exchange - 12% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgb(236, 72, 153)"
                        strokeWidth="20"
                        strokeDasharray="30.16 221.16"
                        strokeDashoffset="-201.06"
                        transform="rotate(-90 50 50)"
                      />
                      {/* Reserve - 8% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgb(245, 158, 11)"
                        strokeWidth="20"
                        strokeDasharray="20.11 231.22"
                        strokeDashoffset="-231.22"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-cyan-500" />
                      <span className="text-white">Community Rewards</span>
                    </div>
                    <span className="text-white font-semibold">40%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <span className="text-white">Platform Development</span>
                    </div>
                    <span className="text-white font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-purple-500" />
                      <span className="text-white">Team & Advisors</span>
                    </div>
                    <span className="text-white font-semibold">15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-pink-500" />
                      <span className="text-white">Liquidity & Exchange</span>
                    </div>
                    <span className="text-white font-semibold">12%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-amber-500" />
                      <span className="text-white">Reserve</span>
                    </div>
                    <span className="text-white font-semibold">8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  q: "How do I get a crypto wallet?",
                  a: "You can create a wallet directly in the DataW app or use popular wallets like MetaMask, Trust Wallet, or Coinbase Wallet. We'll guide you through the setup process.",
                },
                {
                  q: "Can I convert DTW to my local currency?",
                  a: "Yes! DTW can be exchanged for USDT, ETH, or other cryptocurrencies on supported exchanges, which you can then convert to your local currency.",
                },
                {
                  q: "Are there any minimum withdrawal amounts?",
                  a: "The minimum withdrawal is 10 DTW tokens to ensure transaction fees don't consume your earnings. There's no maximum limit.",
                },
                {
                  q: "Which countries is this available in?",
                  a: "DTW is available globally. Anyone with internet access can participate and receive payments, regardless of their country.",
                },
                {
                  q: "Is my data secure?",
                  a: "Absolutely. All transactions are recorded on the blockchain, providing full transparency and security. Your wallet keys are yours alone.",
                },
                {
                  q: "What blockchain is DTW built on?",
                  a: "DTW is built on Ethereum (ERC-20) with layer 2 scaling for fast, low-cost transactions. We're also exploring multi-chain support.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
                >
                  <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-[#0F131A] rounded-2xl p-8 md:p-12 border border-white/10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Join thousands of data collectors around the world getting paid
                instantly with DTW tokens.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup?role=collector">
                  <Button
                    size="lg"
                    className="bg-slate-700 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] px-8"
                  >
                    Start Collecting
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button
                    size="lg"
                    className="bg-slate-700 border border-slate-600 text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] px-8"
                  >
                    Browse Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
