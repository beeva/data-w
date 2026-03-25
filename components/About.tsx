"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView, animate } from "motion/react";
import { useRef, useState, useEffect } from "react";
import Header from "./Header";
import PageHero from "./PageHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Globe,
  Shield,
  TrendingUp,
  ArrowRight,
  Linkedin,
  Twitter,
  Mail,
  Building2,
} from "lucide-react";
import { GlobalSvg } from "./svg/GlobalSvg";
import { DataQualitySvg } from "./svg/DataQualitySvg";
import { CryptoPaySvg } from "./svg/CryptoPaySvg";
import { TransparencySvg } from "./svg/TransparencySvg";
import CTASceneCanvas from "./CTASceneCanvas";
import Footer from "./Footer";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 1,
  duration = 1.5,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [isInView, value, duration]);

  const formatted = displayValue.toFixed(decimals);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

function TimelineSection({
  timeline,
}: {
  timeline: { year: string; title: string; description: string }[];
}) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const pos = window.scrollY + window.innerHeight / 2 - 80;
      let found = false;
      for (let i = 0; i < timeline.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const min = rect.top + window.scrollY;
        const max = min + rect.height;
        if (pos >= min && pos <= max - 40) {
          setActiveIndex(i);
          found = true;
          break;
        }
      }
      if (!found) {
        const firstEl = itemRefs.current[0];
        const lastEl = itemRefs.current[timeline.length - 1];
        if (
          firstEl &&
          pos < firstEl.getBoundingClientRect().top + window.scrollY
        ) {
          setActiveIndex(0);
        } else if (
          lastEl &&
          pos >
            lastEl.getBoundingClientRect().top +
              window.scrollY +
              lastEl.offsetHeight / 2
        ) {
          setActiveIndex(timeline.length - 1);
        }
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [timeline.length]);

  return (
    <motion.section {...fadeInUp} className="py-20 md:py-24">
      <div className="text-center mb-16 md:mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          The DataW{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Story
          </span>
        </h2>
        <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Our Journey
        </p>
      </div>

      <div className="relative max-w-[700px] mx-auto px-4 md:px-0">
        {/* Vertical center line - left 40px on mobile, center on desktop */}
        <div
          className="absolute left-10 md:left-1/2 w-0.5 h-full min-h-full md:-translate-x-1/2 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        <div className="flex flex-col">
          {timeline.map((item, idx) => {
            const isActive = activeIndex === idx;
            const isEven = idx % 2 === 0;
            return (
              <div
                key={item.year}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                data-text="OUR JOURNEY"
                className={`
                  relative flex w-full md:w-[calc(50%-40px)] py-10
                  transition-all duration-500 ease-out box-border
                  ${isEven ? "md:mr-auto md:pr-10" : "md:ml-auto md:pl-10 md:self-end"}
                  pl-[80px] pr-[30px] md:pl-0 md:pr-0
                  ${idx === timeline.length - 1 ? "pb-10" : "pb-[150px] md:pb-10"}
                  ${isActive ? "opacity-100 blur-0 translate-y-0" : "opacity-30 blur-[2px] -translate-y-20"}
                `}
              >
                {/* data-text label - visible when active */}
                {isActive && (
                  <div
                    className={`
                      hidden md:block absolute top-1/2 -translate-y-1/2
                      text-white/50 text-[13px] tracking-[3px] font-medium uppercase w-64
                      ${isEven ? "right-[calc(-95%)] border-l-2 border-white/50 pl-4" : "left-[calc(-95%)] border-r-2 border-white/50 pr-4 text-right"}
                    `}
                  >
                    {item.title}
                  </div>
                )}

                <div className="w-full">
                  <h3
                    className={`
                      font-normal text-white transition-all duration-500
                      ${isActive ? "text-5xl sm:text-6xl md:text-[66px] -mt-3 mb-5" : "text-4xl md:text-5xl -mt-2 mb-0"}
                    `}
                  >
                    {item.year}
                  </h3>
                  <p className="text-[15px] text-white/70 leading-[25px] font-normal m-0">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

export default function About() {
  const stats = [
    { value: "50K+", label: "Data Collectors", icon: Users },
    { value: "120+", label: "Countries", icon: Globe },
    { value: "10M+", label: "Data Points Collected", icon: TrendingUp },
    { value: "99.2%", label: "Validation Accuracy", icon: Shield },
  ];

  const values = [
    {
      icon: <GlobalSvg color="#22d3ee" />,
      title: "Global Inclusion",
      description:
        "We believe everyone deserves access to economic opportunities, regardless of location or banking status.",
    },
    {
      icon: <DataQualitySvg color="#22d3ee" />,
      title: "Data Quality",
      description:
        "We maintain the highest standards for data collection, validation, and delivery to our clients.",
    },
    {
      icon: <CryptoPaySvg color="#22d3ee" />,
      title: "Fair Compensation",
      description:
        "Contributors are paid fairly for their work, with transparent pricing and instant crypto payments.",
    },
    {
      icon: <TransparencySvg color="#22d3ee" />,
      title: "Transparency",
      description:
        "Every transaction, validation, and payment is recorded on-chain for full accountability.",
    },
  ];

  const timeline = [
    {
      year: "2023",
      title: "The Beginning",
      description:
        "DataW was founded with a mission to democratize data collection and create economic opportunities globally.",
    },
    {
      year: "2024",
      title: "Platform Launch",
      description:
        "Launched our beta platform with 1,000 data collectors across 30 countries.",
    },
    {
      year: "2025",
      title: "DTW Token",
      description:
        "Introduced DTW token for instant, borderless payments to our global contributor network.",
    },
    {
      year: "2026",
      title: "Global Expansion",
      description:
        "Reached 50,000+ collectors in 120+ countries with enterprise-grade data solutions.",
    },
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      roleText: "CEO",
      image: "/team/sarah.png",
      bio: "Former ML lead at Google. Stanford CS PhD. Passionate about ethical AI.",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "Michael Roberts",
      role: "CTO & Co-Founder",
      roleText: "CTO",
      image: "/team/michael.png",
      bio: "15+ years in distributed systems. Ex-Amazon. Blockchain enthusiast.",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "David Park",
      role: "Head of Operations",
      roleText: "Ops",
      image: "/team/david.png",
      bio: "Operations expert with experience scaling startups from 10 to 10,000.",
      linkedin: "#",
      twitter: "#",
    },
  ];

  const publicLogos: { name: string; slug: string; file: string }[] = [
    { name: "Spotify", slug: "spotify", file: "Bellomy-logo.png" },
    { name: "Stripe", slug: "stripe", file: "Clariti Logo.png" },
    { name: "Slack", slug: "slack", file: "ElevenMR Logo.png" },
    { name: "enosanswers", slug: "enosanswers", file: "enosanswers logo.png" },
    { name: "Fieldwork", slug: "fieldwork", file: "Fieldwork Logo.png" },
    {
      name: "Full-Circle-Research-Logo",
      slug: "full-circle",
      file: "Full-Circle-Research-Logo.png",
    },
    { name: "Harmon", slug: "harmon", file: "Harmon Research Logo.png" },
    { name: "Indiefield", slug: "indiefield", file: "Indiefield Logo.png" },
    { name: "KANTAR", slug: "kantar", file: "KANTAR-Logo.png" },
    { name: "Quantifyai", slug: "quantifyai", file: "Quantifyai Logo.png" },
    { name: "Quest", slug: "quest", file: "Quest Mindshare.png" },
  ];

  const trustedByLogos = publicLogos.map((p) => ({
    name: p.name,
    slug: p.slug,
    src: `/company-logos/${p.file}`,
  }));

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />

      <PageHero
        title="About"
        subtitle="DataW"
        description="We're building the world's most accessible data collection platform, empowering people everywhere to contribute to AI development."
      />

      <main className="pb-24 pt-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Mission Section */}
          <motion.section {...fadeInUp} className="mb-24">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12">
              <div>
                <Badge className="mb-4 bg-cyan-500/15 text-cyan-400 border-cyan-500/25 text-xs font-medium tracking-wide uppercase">
                  MISSION
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  <span className="text-white/70">Our Focus is Simple</span>
                  <br />
                  <span className="text-white">Data for Everyone</span>
                </h2>
              </div>
              <p className="text-white/60 text-sm sm:text-base max-w-sm lg:text-right">
                We promise to deliver beyond your expectations for your data
                needs and AI development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:min-h-[480px] gap-5 lg:gap-6 md:items-stretch">
              <div className="flex flex-col gap-5 lg:gap-6 md:min-h-0">
                <motion.div
                  {...stagger}
                  transition={{ delay: 0 }}
                  className="rounded-2xl border border-white/10 p-5 flex items-center gap-4 transition-all duration-300 md:h-[88px] md:min-h-[88px] md:shrink-0"
                >
                  <div className="flex -space-x-2">
                    {[
                      "/avatars/avatar1.jpg",
                      "/avatars/avatar2.jpg",
                      "/avatars/avatar.png",
                      "/avatars/avatar3.jpg",
                      "/avatars/avatar4.png",
                    ].map((src, i) => (
                      <div
                        key={i}
                        className="relative w-11 h-11 rounded-full border-2 border-[#0f1419] overflow-hidden shrink-0"
                      >
                        <Image
                          src={src}
                          alt="Partner"
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-white/50 text-sm font-medium tracking-wide uppercase">
                    100+ Partners
                  </span>
                </motion.div>
                <motion.div
                  {...stagger}
                  transition={{ delay: 0.16 }}
                  className="rounded-2xl border border-white/10 p-6 flex flex-col justify-between transition-all duration-300 md:min-h-0 md:flex-1"
                >
                  <p className="text-white/60 text-base mb-2">
                    Earn back on your investment within 30 days
                  </p>
                  <div className="flex flex-col gap-4">
                    <p className="text-5xl lg:text-6xl font-bold text-white tabular-nums tracking-tight">
                      <CountUp value={99.2} suffix="%" duration={1.5} />
                    </p>
                    <p className="text-white/50 text-base font-medium">
                      Validation accuracy
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Column 2: Revenue (tall) + Available (short) - flex column */}
              <div className="flex flex-col gap-5 lg:gap-6 md:min-h-0">
                <motion.div
                  {...stagger}
                  transition={{ delay: 0.08 }}
                  className="rounded-2xl border border-white/10 p-6 flex flex-col justify-between transition-all duration-300 md:min-h-0 md:flex-1"
                >
                  <p className="text-white/60 text-base mb-2">
                    Through our global data collection network
                  </p>
                  <div className="flex flex-col gap-4">
                    <p className="text-5xl lg:text-6xl font-bold text-white tabular-nums tracking-tight">
                      <CountUp value={2.5} prefix="$" suffix="M+" duration={1.5} />
                    </p>
                    <p className="text-white/50 text-base font-medium">
                      Revenue generated
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  {...stagger}
                  transition={{ delay: 0.24 }}
                  className="rounded-2xl border border-white/10 p-5 flex items-center gap-3 transition-all duration-300 md:h-[88px] md:min-h-[88px] md:shrink-0"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-400 shrink-0" />
                  <span className="text-white/50 text-base font-medium tracking-wide uppercase">
                    Available for 2026 January
                  </span>
                </motion.div>
              </div>

              {/* Column 3: Full-height featured card */}
              <motion.div
                {...stagger}
                transition={{ delay: 0.32 }}
                className="rounded-2xl bg-white/10 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-cyan-400/20 md:min-h-0"
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute bottom-24 left-0 w-[80%] h-[55%] -translate-x-[10%]"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 0 100 L 28 52 L 48 72 L 100 0" />
                  </svg>
                </div>
                <p className="text-white/80 text-base leading-relaxed relative z-10">
                  We delivered 50+ projects worldwide, helping AI companies
                  build better, more representative models.
                </p>
                <div className="flex items-end justify-between mt-6 relative z-10">
                  <p className="text-5xl lg:text-6xl font-bold text-white tabular-nums tracking-tight">
                    <CountUp value={4.8} suffix="/5" duration={1.5} />
                  </p>
                  <span className="text-white/60 text-base font-medium tracking-wide uppercase text-right">
                    Trusted by clients worldwide
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Section divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" />

          {/* How It Works */}
          <motion.section {...fadeInUp} className="py-24">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
              <div>
                <Badge className="mb-4 bg-cyan-500/15 text-cyan-400 border-cyan-500/25 text-xs font-medium tracking-wide uppercase">
                  How It Works
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  Connecting Data Needs with{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Global Contributors
                  </span>
                </h2>
                <p className="text-white/55 max-w-lg text-base">
                  Our platform bridges the gap between organizations that need
                  data and people who can provide it.
                </p>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm font-medium tracking-wide uppercase shrink-0">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-white/20" />
                3 simple steps
              </div>
            </div>

            <div className="relative">
              {/* Flow connector line - desktop */}

              <div className="grid md:grid-cols-3 gap-8 lg:gap-6 relative">
                {[
                  {
                    title: "Requesters Post Projects",
                    desc: "Companies and researchers define their data needs, set budgets, and specify quality requirements for their AI training datasets.",
                    step: "01",
                  },
                  {
                    title: "Collectors Contribute Data",
                    desc: "Our global network of contributors collects images, audio, text, and other data types according to project specifications.",
                    step: "02",
                  },
                  {
                    title: "AI Validates & Pays",
                    desc: "Our AI-powered validation system checks data quality. Approved submissions trigger instant crypto payments to collectors.",
                    step: "03",
                  },
                ].map(({ title, desc, step }, idx) => (
                  <motion.div
                    key={title}
                    {...stagger}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative flex flex-col pr-24"
                  >
                    <div className="relative flex flex-col transition-all duration-300 h-full min-h-[240px] overflow-hidden">
                      {/* Large watermark number - background */}
                      <svg
                        viewBox="0 0 140 100"
                        className="absolute top-0 -left-8 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 pointer-events-none"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id={`step-stroke-${step}`}
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
                            id={`step-opacity-mask-${step}`}
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
                          <mask id={`step-mask-${step}`}>
                            <rect
                              x="0"
                              y="0"
                              width="140"
                              height="100"
                              fill={`url(#step-opacity-mask-${step})`}
                            />
                          </mask>
                        </defs>
                        <text
                          x="50%"
                          y="72"
                          textAnchor="middle"
                          fill="none"
                          stroke={`url(#step-stroke-${step})`}
                          strokeWidth="1.5"
                          fontSize="96"
                          fontFamily="system-ui, sans-serif"
                          fontWeight="bold"
                          mask={`url(#step-mask-${step})`}
                        >
                          {step}
                        </text>
                      </svg>

                      {/* Content - sits over lower portion of number */}
                      <div className="relative z-10 flex flex-col flex-1 pt-32">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 uppercase tracking-tight">
                          {title}
                        </h3>
                        <p className="text-white/70 text-base leading-relaxed flex-1">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Our Values */}
          <motion.section {...fadeInUp} className="py-24">
            <div className="text-center mb-14 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                What We{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Stand For
                </span>
              </h2>
              <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                The principles that guide everything we do at DataW.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {values.map((value, idx) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="group"
                >
                  <div className="relative cursor-pointer flex h-full flex-col rounded-2xl p-6 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-white/10 group-hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)]">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center">
                      {value.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white tracking-tight">
                      {value.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Our Story Timeline */}
          <TimelineSection timeline={timeline} />

          {/* Team Section */}
          <motion.section {...fadeInUp} className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Meet the People Behind{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  DataW
                </span>
              </h2>
              <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                A passionate team of engineers, researchers, and operators
                building the future of data collection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {team.map((member, idx) => (
                <motion.div
                  key={member.name}
                  {...stagger}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#0f1419] text-center transition-all duration-500"
                >
                  {/* Image Section - full width, slide effect on hover */}
                  <div className="relative h-56 sm:h-64 md:h-80 overflow-hidden bg-white/10">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out -translate-x-12 group-hover:translate-x-0"
                    />
                    {/* Glasses sweep effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                    {/* Watermark role text */}
                    <div className="absolute -bottom-2 -right-2 sm:-right-4">
                      <span
                        className="text-[#0F1419] text-4xl sm:text-6xl md:text-[88px] font-bold block rotate-180 select-none"
                        style={{
                          textOrientation: "mixed",
                          writingMode: "vertical-rl",
                        }}
                      >
                        {member.roleText}
                      </span>
                    </div>
                  </div>

                  {/* Text Section */}
                  <div className="pt-8 sm:pt-10 pb-6 sm:pb-8 px-4 sm:px-6 flex flex-col flex-1 rounded-b-2xl items-start border-r border-l border-b border-white/10">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                      {member.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-cyan-400 mb-4">
                      / {member.role} /
                    </p>
                    <p className="text-white/60 text-sm mb-6 leading-relaxed sm:text-base min-h-[3.5rem] text-left">
                      {member.bio}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Partners Section - Companies Ticker */}
          <motion.section {...fadeInUp} className="mb-24">
            {/* <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Trusted By Our{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Partners & Clients
                </span>
              </h2>
            </div> */}

            <div className="relative overflow-hidden">
              <div className="logo-ticker-track flex items-center gap-10 sm:gap-14 md:gap-20 w-max">
                {[...trustedByLogos, ...trustedByLogos].map((client, i) => (
                  <div
                    key={`${client.slug}-${i}`}
                    className="group flex-shrink-0 flex items-center justify-center h-8 md:h-10 opacity-80 hover:opacity-100 transition-all duration-300 [&_svg]:brightness-0 [&_svg]:invert [&_img]:brightness-0 [&_img]:invert group-hover:[&_svg]:!filter-none group-hover:[&_img]:!filter-none"
                    title={client.name}
                  >
                    {client.src ? (
                      <img
                        src={client.src}
                        alt={client.name}
                        className="h-full w-auto object-contain max-w-[140px] transition-all duration-300"
                      />
                    ) : (
                      <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white/80 whitespace-nowrap">
                        {client.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Contact Section - CTA style from Projects */}
          <motion.section {...fadeInUp} className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141a24] to-[#0d1117]">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[320px]">
                {/* Left: content + CTA */}
                <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                  <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-medium uppercase tracking-widest text-cyan-400/90">
                        Get In Touch
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Want to Learn More?
                      </h2>
                      <p className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed">
                        Whether you're a company looking for data solutions or
                        someone interested in becoming a contributor, we'd love
                        to hear from you.
                      </p>
                      <div className="flex flex-wrap gap-6 pt-2">
                        <div className="flex items-center gap-3 text-white/60">
                          <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                          <span>hello@dataw.io</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                          <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
                          <span>San Francisco, CA & Remote</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href="/signup?role=requester" className="flex-1">
                        <Button
                          size="lg"
                          className="group w-full rounded-xl py-6 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 transition-all duration-200 hover:scale-[1.02]"
                        >
                          Post a Project
                        </Button>
                      </Link>
                      <Link href="/signup?role=collector" className="flex-1">
                        <Button
                          size="lg"
                          className="group w-full rounded-xl py-6 bg-transparent hover:bg-white/10 text-white font-semibold border border-white/10 hover:border-white transition-all duration-200 hover:scale-[1.02]"
                        >
                          Become a Collector
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Right: Three.js wireframe scene */}
                <div className="relative rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl overflow-hidden py-12">
                  <CTASceneCanvas />
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
