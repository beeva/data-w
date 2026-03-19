"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Users, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import PostBrowseSvg from "@/components/svg/PostBrowseSvg";
import { motion } from "motion/react";
import man1 from "@/public/avatars/man1.jpg";
import man2 from "@/public/avatars/man2.jpg";
import female from "@/public/avatars/female.jpg";
import FacebookSvg from "@/components/svg/company-logos/FacebookSvg";
import MicrosoftSvg from "@/components/svg/company-logos/MicrosoftSvg";
import NetflixSvg from "@/components/svg/company-logos/NetflixSvg";
import AmazonSvg from "@/components/svg/company-logos/AmazonSvg";
import AppleMusicSvg from "@/components/svg/company-logos/AppleMusicSvg";
import ShopifySvg from "@/components/svg/company-logos/ShopifySvg";
import YoutubeSvg from "@/components/svg/company-logos/YoutubeSvg";
import MatchingSvg from "@/components/svg/MatchingSvg";
import DataCollectionSvg from "./svg/DataCollectionSvg";
import PaidSvg from "./svg/PaidSvg";
import {
  JOB_CATEGORIES,
  JOB_CATEGORY_DISPLAY,
  CATEGORY_ICON_COLOR,
} from "@/lib/categories";
import { CategorySectionBackground } from "./CategorySectionBackground";

interface Testimonial {
  name: string;
  image: StaticImageData;
  content: string;
  title: string;
  company: string;
  Logo: React.ComponentType<{ className?: string }>;
}

const testimonials: Testimonial[] = [
  {
    name: "Lucas Martinez",
    image: man1,
    content:
      "Integration with our Next.js project was seamless. The components look polished and save a lot of engineering time.",
    title: "Frontend Engineer",
    company: "Facebook",
    Logo: FacebookSvg,
  },
  {
    name: "Sara Ali",
    image: female,
    content:
      "A great balance between usability and customization. Our team loves how smooth and responsive the components feel.",
    title: "Design Engineer",
    company: "Microsoft",
    Logo: MicrosoftSvg,
  },
  {
    name: "Noah Williams",
    image: man2,
    content:
      "This UI toolkit helped us standardize our frontend quickly. The quality and attention to detail really stand out.",
    title: "Tech Lead",
    company: "Netflix",
    Logo: NetflixSvg,
  },
  {
    name: "Aarav Sharma",
    image: man1,
    content:
      "This component library made our UI development much faster. Everything feels consistent, modern, and easy to customize.",
    title: "Founder",
    company: "Amazon",
    Logo: AmazonSvg,
  },
  {
    name: "Emily Chen",
    image: female,
    content:
      "We were able to prototype an entire product interface in just a few hours. The design system is clean and very flexible.",
    title: "Product Designer",
    company: "Apple",
    Logo: AppleMusicSvg,
  },
  {
    name: "Sarah Chen",
    image: female,
    content:
      "As a data requester, I needed large volumes of medical imaging data for my AI research. Through this platform, I connected with collectors worldwide.",
    title: "Data Scientist",
    company: "Shopify",
    Logo: ShopifySvg,
  },
  {
    name: "Marcus Rodriguez",
    image: man2,
    content:
      "I've earned over $12,000 by collecting and providing data through this platform. The global reach and payment process are transparent.",
    title: "Collector",
    company: "YouTube",
    Logo: YoutubeSvg,
  },
];

const howItWorksSteps: {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  label: string;
}[] = [
  {
    step: 1,
    title: "Post or browse",
    description:
      "Requesters post data needs; collectors browse available tasks by category and location.",
    icon: PostBrowseSvg as LucideIcon,
    label: "A",
  },
  {
    step: 2,
    title: "Get matched",
    description:
      "Our platform matches requesters with qualified collectors and agents for validation.",
    icon: MatchingSvg as LucideIcon,
    label: "B",
  },
  {
    step: 3,
    title: "Collect & validate",
    description:
      "Collectors gather data; agents automatically validate quality before delivery.",
    icon: DataCollectionSvg as LucideIcon,
    label: "C",
  },
  {
    step: 4,
    title: "Deliver & get paid",
    description:
      "Data is delivered securely. Collectors get paid; requesters get verified datasets.",
    icon: PaidSvg as LucideIcon,
    label: "D",
  },
];

export default function Testimonials() {
  const testimonialCards = [...testimonials, ...testimonials];

  return (
    <div className="bg-[#28303E]">
      <div className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 space-y-16 sm:space-y-20 md:space-y-24">
        {/* ——— Section 1: Value props ——— */}
        <section className="space-y-10 md:space-y-14 container mx-auto ">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Why our{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                platform
              </span>
            </h2>
            <p className="text-[#a1a1aa] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Whether you're a data requester, collector, or agent, our platform
              streamlines your workflow with an easy-to-use, maintainable
              system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                image: "/images/global-connection.webp",
                title: "Effortless, direct connections",
                description:
                  "Make seamless connections that enhance collaboration, streamline communication, and boost efficiency in every interaction.",
              },
              {
                image: "/images/chatbot.webp",
                title: "Intelligent agents & validation",
                description:
                  "Our intelligent agents automate the data gathering process, ensuring seamless transactions and quality validation before delivery.",
              },
              {
                image: "/images/earn-money.webp",
                title: "Secure transactions & payments",
                description:
                  "Data is delivered securely. Collectors get paid; requesters get verified datasets. Transparent and reliable every step of the way.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.07] hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.2)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/10">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <h3 className="mb-3 text-lg font-bold text-white sm:text-xl">
                  {item.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed sm:text-base">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ——— Section 4: How does it work ——— */}
        <section className="relative container mx-auto ">
          <motion.div
            className="text-center mb-14 sm:mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              How does{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                it work
              </span>
            </h2>
            <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              From posting a task to getting paid or receiving data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {howItWorksSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="group"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <div className="relative cursor-pointer flex h-full flex-col rounded-2xl p-6 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-white/10 group-hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)]">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center">
                      <Icon className="h-16 w-16 text-cyan-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ——— Section 2: Testimonials (marquee) ——— */}
        <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 container mx-auto ">
          <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Infinite stream of happy{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                customers
              </span>
            </h2>
            <p className="text-[#a1a1aa] text-sm sm:text-base max-w-2xl leading-relaxed">
              Real teams using your components in production, scrolling by with
              subtle motion so the section feels alive without stealing focus.
            </p>
          </div>

          <div
            className="relative w-full"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            }}
          >
            {/* Row 1 */}
            <div className="flex mb-6 testimonial-marquee-track">
              {testimonialCards.map((t, i) => (
                <div
                  key={`row1-${i}`}
                  className="flex-shrink-0 w-[320px] sm:w-[360px] rounded-2xl bg-white/5 p-6 mx-3 flex flex-col"
                >
                  <p className="text-white text-sm sm:text-base leading-relaxed mb-6 flex-1">
                    {t.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {t.name}
                      </div>
                      <div className="text-[#a1a1aa] text-xs">
                        {t.title} · {t.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Row 2 - scrolls opposite direction */}
            <div className="flex testimonial-marquee-track-reverse">
              {testimonialCards.map((t, i) => (
                <div
                  key={`row2-${i}`}
                  className="flex-shrink-0 w-[320px] sm:w-[360px] rounded-2xl bg-white/5 p-6 mx-3 flex flex-col"
                >
                  <p className="text-white text-sm sm:text-base leading-relaxed mb-6 flex-1">
                    {t.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {t.name}
                      </div>
                      <div className="text-[#a1a1aa] text-xs">
                        {t.title} · {t.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Section 5: Explore jobs by category ——— */}
        <section className="relative isolate overflow-hidden rounded-2xl py-16 sm:py-20 md:py-24 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 min-h-[480px]">
          <CategorySectionBackground />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              className="text-center mb-14 sm:mb-16"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                Explore jobs by{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  category
                </span>
              </h2>
              <p className="text-[#a1a1aa] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Find data collection and validation tasks that match your skills
                and interests.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {JOB_CATEGORIES.map((cat, index) => {
                const meta = JOB_CATEGORY_DISPLAY[cat];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <Link
                      href={`/projects?category=${encodeURIComponent(cat)}`}
                      className="group flex items-center gap-3 p-6 rounded-2xl border border-white/10 bg-[#333B48] transition-all duration-300 hover:border-cyan-400/50 hover:bg-[#28303E] hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)]"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center [&>svg]:h-8 [&>svg]:w-8"
                        aria-hidden
                      >
                        <Icon color={CATEGORY_ICON_COLOR} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white block truncate group-hover:text-cyan-400 transition-colors">
                          {meta.label}
                        </span>
                        <span className="text-xs text-white/60">
                          Browse jobs
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
