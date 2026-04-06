"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Header from "./Header";
import PageHero from "./PageHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  ArrowRight,
  Coins,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Banknote,
  RefreshCw,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Sector,
} from "recharts";
import { GlobalSvg } from "./svg/GlobalSvg";
import { CryptoPaySvg } from "./svg/CryptoPaySvg";
import { TransparencySvg } from "./svg/TransparencySvg";
import Footer from "./Footer";
import { InstantSvg } from "./svg/InstantSvg";
import { LowFeeSvg } from "./svg/LowFeeSvg";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -24 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const fadeInRight = {
  initial: { opacity: 0, x: 24 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const problemItems = [
  {
    title: "Bank Account Required",
    desc: "1.7 billion adults remain unbanked globally",
  },
  {
    title: "High Fees",
    desc: "International transfers cost 5-10% on average",
  },
  {
    title: "Slow Processing",
    desc: "Cross-border payments take 3-5 business days",
  },
  {
    title: "Geographic Restrictions",
    desc: "PayPal, Stripe unavailable in many countries",
  },
];

const solutionItems = [
  {
    title: "Just a Wallet",
    desc: "Create a wallet in seconds, no ID required",
  },
  {
    title: "Near-Zero Fees",
    desc: "Transaction fees under $0.01",
  },
  {
    title: "Instant Settlement",
    desc: "Payments confirmed in under 2 minutes",
  },
  {
    title: "Truly Global",
    desc: "Works in every country, no restrictions",
  },
];

// Mock price data for the chart
const generateMockPriceData = () => {
  const data = [];
  let price = 0.85;
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.48) * 0.05;
    price = Math.max(0.5, Math.min(1.5, price + change));
    data.push({
      day: i + 1,
      price,
    });
  }
  return data;
};

const xAxisTickFormatter = (day: number) => {
  if (day === 1) return "30d ago";
  if (day === 10) return "20d ago";
  if (day === 20) return "10d ago";
  if (day === 30) return "Today";
  return "";
};

const TOKEN_DISTRIBUTION_DATA = [
  { name: "Community Rewards", value: 40, color: "#22d3ee" },
  { name: "Platform Development", value: 25, color: "#64748b" },
  { name: "Team & Advisors", value: 15, color: "#475569" },
  { name: "Liquidity & Exchange", value: 12, color: "#334155" },
  { name: "Reserve", value: 8, color: "#1e293b" },
];

function renderPieNameLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  payload?: { name?: string };
  name?: string;
}) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const outerRadius = Number(props.outerRadius ?? 50);
  const name = String(props.payload?.name ?? props.name ?? "");
  if (!name) return <g />;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 24;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const shortName = name.length > 16 ? name.split(" ")[0] : name;
  const bubbleWidth = Math.max(56, shortName.length * 7);
  return (
    <g>
      <rect
        x={x - bubbleWidth / 2}
        y={y - 10}
        width={bubbleWidth}
        height={20}
        rx={6}
        fill="white"
        fillOpacity={0.95}
      />
      <polygon
        points={`${x},${y + 4} ${x - 6},${y + 12} ${x + 6},${y + 12}`}
        fill="white"
        fillOpacity={0.95}
      />
      <text
        x={x}
        y={y + 2}
        textAnchor="middle"
        fill="#0f172a"
        fontSize={10}
        fontWeight="bold"
      >
        {shortName}
      </text>
    </g>
  );
}

const TokenDistributionChart = memo(function TokenDistributionChart() {
  return (
    <div className="flex items-center justify-center">
      {/* Legend with full names */}
      <div className="flex flex-col justify-center gap-6">
        {TOKEN_DISTRIBUTION_DATA.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 text-sm text-white/90"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
            <span className="font-semibold text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
      <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-[400px] md:h-[400px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 400, height: 400 }}
        >
          <PieChart>
            <Pie
              data={TOKEN_DISTRIBUTION_DATA}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              shape={(props, index) => (
                <Sector
                  {...props}
                  outerRadius={
                    index === 0
                      ? (Number(props.outerRadius) || 50) + 14
                      : props.outerRadius
                  }
                />
              )}
            >
              {TOKEN_DISTRIBUTION_DATA.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
              <LabelList
                dataKey="value"
                position="inside"
                formatter={(val: unknown) => `${val}%`}
                fill="white"
                fontSize={14}
                fontWeight="bold"
              />
              <LabelList
                dataKey="name"
                position="outside"
                content={renderPieNameLabel as never}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default function Crypto() {
  const [priceData, setPriceData] = useState<{ day: number; price: number }[]>(
    [],
  );
  const [currentPrice, setCurrentPrice] = useState(0.92);
  const [priceChange, setPriceChange] = useState(3.45);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");
  const [isLive, setIsLive] = useState(true);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

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
    { label: "Market Cap", value: "$45.2M", icon: PieChartIcon },
    { label: "Circulating Supply", value: "48.5M DTW", icon: Coins },
    { label: "Total Supply", value: "100M DTW", icon: BarChart3 },
    { label: "24h Volume", value: "$2.8M", icon: Activity },
  ];

  const benefits = [
    {
      icon: <GlobalSvg color="#22d3ee" />,
      title: "Global Access",
      description:
        "Anyone in the world can receive payments instantly, regardless of their location or banking infrastructure.",
    },
    {
      icon: <InstantSvg color="#22d3ee" />,
      title: "Instant Settlements",
      description:
        "No more waiting 3-5 business days. Payments settle in minutes, not days.",
    },
    {
      icon: <TransparencySvg color="#22d3ee" />,
      title: "Secure & Transparent",
      description:
        "Built on blockchain technology ensuring every transaction is secure and verifiable.",
    },
    {
      icon: <LowFeeSvg color="#22d3ee" />,
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

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />

      <PageHero
        title="DataW Crypto"
        subtitle="Payments Without Borders"
        description="Get paid anywhere in the world with DTW tokens. No bank account required, no complex payment setups, just instant global payments."
      />

      <main className="pb-24 pt-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Live Price Section */}
          <motion.div {...fadeInUp} className="mb-20">
            <motion.div
              className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-cyan-500/5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ scale: 1.002 }}
            >
              {/* Price Header */}
              <div className="p-6 md:p-8 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <Coins className="w-7 h-7 text-white" />
                    </motion.div>
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
                    <motion.p
                      key={currentPrice.toFixed(4)}
                      initial={{ opacity: 0.7, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-3xl md:text-4xl font-bold text-white tabular-nums"
                    >
                      ${currentPrice.toFixed(4)}
                    </motion.p>
                    <motion.div
                      key={priceChange.toFixed(2)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
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
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="p-6">
                {/* Timeframe Selector */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {timeframes.map((tf) => (
                      <motion.button
                        key={tf}
                        onClick={() => setSelectedTimeframe(tf)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                          selectedTimeframe === tf
                            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                            : "text-white/50 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {tf}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    onClick={() => setPriceData(generateMockPriceData())}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-white/50 hover:text-cyan-400 hover:bg-white/5 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </motion.button>
                </div>

                {/* Chart */}
                <motion.div
                  className="h-64 w-full min-h-[256px] min-w-0"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    initialDimension={{ width: 800, height: 256 }}
                  >
                    <AreaChart
                      data={priceData}
                      margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgb(6, 182, 212)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="rgb(6, 182, 212)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        tickFormatter={xAxisTickFormatter}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v.toFixed(2)}`}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 20, 25, 0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                        formatter={(value: number | undefined) =>
                          value != null
                            ? [`$${value.toFixed(4)}`, "Price"]
                            : null
                        }
                        labelFormatter={(day) =>
                          day === 1
                            ? "30d ago"
                            : day === 10
                              ? "20d ago"
                              : day === 20
                                ? "10d ago"
                                : day === 30
                                  ? "Today"
                                  : `Day ${day}`
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="rgb(6, 182, 212)"
                        strokeWidth={2}
                        fill="url(#chartGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Token Stats */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10"
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: "-20px" }}
              >
                {tokenStats.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    variants={{
                      initial: { opacity: 0, y: 12 },
                      whileInView: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    className={`p-5 md:p-6 ${idx < tokenStats.length - 1 ? "border-r border-white/10" : ""}`}
                  >
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1.5">
                      <motion.span
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <stat.icon className="w-4 h-4 text-cyan-400/70" />
                      </motion.span>
                      {stat.label}
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Why Crypto Payments Section - styled like About "Our Values" */}
          <motion.section {...fadeInUp} className="mb-24">
            <div className="text-center mb-14 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/25 text-xs font-medium tracking-wide uppercase">
                  Why DTW?
                </Badge>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight"
              >
                Payments for{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Everyone, Everywhere
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
              >
                Traditional payment systems exclude billions of people
                worldwide. DataW Token ensures that every contributor can get
                paid instantly, regardless of where they live.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <div className="relative cursor-pointer flex h-full flex-col rounded-2xl p-6 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-white/10 group-hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)] border border-white/10">
                    <motion.div
                      className="mb-4 flex h-16 w-16 items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {benefit.icon}
                    </motion.div>
                    <h3 className="mb-2 text-lg font-semibold text-white tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Section divider - from About */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0.5 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ originX: 0 }}
            className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24"
          />

          {/* The Problem We Solve */}
          <motion.section {...fadeInUp} className="mb-24">
            <div className="text-center mb-14 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/25 text-xs font-medium tracking-wide uppercase">
                  The Problem We Solve
                </Badge>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight"
              >
                Traditional Payments vs{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  DTW Token
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
              >
                Billions are excluded from traditional payment systems. DTW
                Token removes these barriers.
              </motion.p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Problem Card */}
              <motion.div
                {...staggerItem}
                transition={{ delay: 0, ...staggerItem.transition }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <div className="relative flex h-full flex-col rounded-2xl bg-white/5 p-6 sm:p-12 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.04] group-hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.15)] overflow-hidden">
                  {/* Watermark role text - like team cards on About */}
                  <div className="absolute -bottom-2 -right-2 sm:-right-4">
                    <span
                      className="text-[#0F1419] text-3xl sm:text-5xl md:text-[88px] font-bold block rotate-180 select-none tracking-tight"
                      style={{
                        textOrientation: "mixed",
                        writingMode: "vertical-rl",
                      }}
                    >
                      Problem
                    </span>
                  </div>
                  <div className="mb-6 flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white tracking-tight">
                        Traditional Payments Are Broken
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {problemItems.map((item, idx) => (
                      <li key={item.title} className="flex gap-4">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
                          <X className="h-7 w-7 text-rose-400/80" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.title}</p>
                          <p className="mt-0.5 text-sm text-white/55 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Solution Card */}
              <motion.div
                {...staggerItem}
                transition={{ delay: 0.1, ...staggerItem.transition }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <div className="relative flex h-full flex-col rounded-2xl bg-white/5 p-6 sm:p-12 transition-all duration-300 group-hover:border-cyan-400/30 group-hover:bg-white/[0.04] group-hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.15)] overflow-hidden">
                  {/* Watermark role text - like team cards on About */}
                  <div className="absolute -bottom-2 -right-2 sm:-right-4">
                    <span
                      className="text-[#0F1419] text-3xl sm:text-5xl md:text-[88px] font-bold block rotate-180 select-none tracking-tight"
                      style={{
                        textOrientation: "mixed",
                        writingMode: "vertical-rl",
                      }}
                    >
                      Solution
                    </span>
                  </div>
                  <div className="mb-6 flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white tracking-tight">
                        DTW Token Changes Everything
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {solutionItems.map((item, idx) => (
                      <li key={item.title} className="flex gap-4">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
                          <Check className="h-7 w-7 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.title}</p>
                          <p className="mt-0.5 text-sm text-white/55 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* How It Works - styled like About with watermark numbers */}
          <motion.section {...fadeInUp} className="py-24">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
              <div>
                <Badge className="mb-4 bg-cyan-500/15 text-cyan-400 border-cyan-500/25 text-xs font-medium tracking-wide uppercase">
                  How It Works
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  Start Earning in{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    3 Simple Steps
                  </span>
                </h2>
                <p className="text-white/55 max-w-lg text-base">
                  Complete tasks, earn DTW tokens, and get paid—no bank account
                  required.
                </p>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm font-medium tracking-wide uppercase shrink-0">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-white/20" />
                3 simple steps
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-6 relative">
              {howItWorks.map((item, idx) => {
                const step = String(item.step).padStart(2, "0");
                return (
                  <motion.div
                    key={item.step}
                    {...staggerItem}
                    transition={{ delay: idx * 0.1, ...staggerItem.transition }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="group relative flex flex-col pr-24"
                  >
                    <div className="relative flex flex-col transition-all duration-300 h-full min-h-[240px] overflow-hidden">
                      {/* Large watermark number - from About */}
                      <svg
                        viewBox="0 0 140 100"
                        className="absolute top-0 -left-8 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 pointer-events-none"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id={`crypto-step-stroke-${step}`}
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="50%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                          <linearGradient
                            id={`crypto-step-opacity-mask-${step}`}
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              stopColor="white"
                              stopOpacity="1"
                            />
                            <stop
                              offset="52%"
                              stopColor="white"
                              stopOpacity="0"
                            />
                            <stop
                              offset="100%"
                              stopColor="white"
                              stopOpacity="0"
                            />
                          </linearGradient>
                          <mask id={`crypto-step-mask-${step}`}>
                            <rect
                              x="0"
                              y="0"
                              width="140"
                              height="100"
                              fill={`url(#crypto-step-opacity-mask-${step})`}
                            />
                          </mask>
                        </defs>
                        <text
                          x="50%"
                          y="72"
                          textAnchor="middle"
                          fill="none"
                          stroke={`url(#crypto-step-stroke-${step})`}
                          strokeWidth="1.5"
                          fontSize="96"
                          fontFamily="system-ui, sans-serif"
                          fontWeight="bold"
                          mask={`url(#crypto-step-mask-${step})`}
                        >
                          {step}
                        </text>
                      </svg>

                      <div className="relative z-10 flex flex-col flex-1 pt-32">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 uppercase tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-white/70 text-base leading-relaxed flex-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Section divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0.5 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ originX: 0 }}
            className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24"
          />

          {/* Token Distribution - Survey-style layout */}
          <motion.section {...fadeInUp} className="py-24">
            <div className="rounded-2xl">
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center">
                <motion.div
                  className="flex-1 w-full lg:max-w-2xl space-y-6"
                  {...fadeInLeft}
                >
                  <div className="flex flex-col items-start gap-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight leading-tight">
                      How are DTW tokens allocated across categories?
                    </h2>
                    <p className="text-[#a1a1aa] text-base sm:text-lg">
                      Community Rewards, Platform Development, Team & more
                    </p>
                  </div>
                </motion.div>

                {/* Right: Donut chart with tooltip labels */}
                <motion.div
                  className="flex-1 flex justify-center lg:justify-end min-w-0"
                  {...fadeInRight}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <TokenDistributionChart />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* FAQ Section - homepage accordion style */}
          <motion.section {...fadeInUp} className="py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-start">
              <motion.div
                className="md:sticky md:top-24"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                  Frequently asked{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    questions
                  </span>
                </h2>
                <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl leading-relaxed">
                  Everything you need to know about DTW and crypto payments.
                </p>
              </motion.div>

              {/* Right: Accordion FAQs */}
              <div className="space-y-3 sm:space-y-4">
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
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      faqOpenIndex === index
                        ? "border-cyan-400/40 bg-white/[0.07] shadow-[0_0_24px_-8px_rgba(34,211,238,0.2)]"
                        : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div
                      className="flex items-start sm:items-center justify-between p-5 sm:p-6 cursor-pointer gap-3"
                      onClick={() =>
                        setFaqOpenIndex(faqOpenIndex === index ? null : index)
                      }
                    >
                      <h3 className="text-base sm:text-lg font-semibold text-white flex-1 pr-2 leading-tight">
                        {faq.q}
                      </h3>
                      <button
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
                        aria-expanded={faqOpenIndex === index}
                        aria-label={
                          faqOpenIndex === index ? "Collapse" : "Expand"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setFaqOpenIndex(
                            faqOpenIndex === index ? null : index,
                          );
                        }}
                      >
                        <svg
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                            faqOpenIndex === index ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {faqOpenIndex === index && (
                        <motion.div
                          key={`faq-${index}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 text-sm sm:text-base text-white/70 leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* CTA Section - styled like About Contact */}
          <motion.section {...fadeInUp} className="mb-8">
            <motion.div
              className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141a24] to-[#0d1117] border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-1 min-h-[280px]">
                <div className="relative flex flex-col justify-center items-center text-center p-8 sm:p-10 lg:p-12">
                  <motion.div
                    className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl pointer-events-none"
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                  <div className="relative z-10 flex flex-col gap-6 max-w-xl">
                    <motion.div
                      className="flex flex-col gap-3"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        staggerChildren: 0.1,
                        delayChildren: 0.2,
                      }}
                    >
                      <p className="text-sm font-medium uppercase tracking-widest text-cyan-400/90">
                        Get Started
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Ready to Start Earning?
                      </h2>
                      <p className="text-white/60 text-base sm:text-lg leading-relaxed">
                        Join thousands of data collectors around the world
                        getting paid instantly with DTW tokens.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex flex-col sm:flex-row gap-4 justify-center"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Link
                        href="/signup?role=collector"
                        className="flex-1 sm:flex-initial"
                      >
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            size="lg"
                            className="group w-full sm:w-auto rounded-xl py-6 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 transition-all duration-200"
                          >
                            Start Collecting
                          </Button>
                        </motion.div>
                      </Link>
                      <Link href="/projects" className="flex-1 sm:flex-initial">
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            size="lg"
                            className="group w-full sm:w-auto rounded-xl py-6 bg-transparent hover:bg-white/10 text-white font-semibold border border-white/10 hover:border-white transition-all duration-200"
                          >
                            Browse Projects
                          </Button>
                        </motion.div>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
