"use client";

import Link from "next/link";
import Image from "next/image";

type FooterProps = {
  compact?: boolean;
};

export default function Footer({ compact = false }: FooterProps) {
  const platformLinks = [
    { href: "/projects", label: "Projects" },
    { href: "/datapool", label: "DataPool" },
    { href: "/usecases", label: "Use Cases" },
    { href: "/about", label: "About" },
    { href: "/crypto", label: "Crypto Payments" },
  ];

  const accountLinks = [
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Create Account" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/support", label: "Support Center" },
    { href: "/dashboard/faq", label: "FAQ" },
  ];

  if (compact) {
    return (
      <footer className="h-16 bg-muted/80 dark:bg-muted border-t border-border text-foreground">
        <div className="container mx-auto h-full px-4 sm:px-6">
          <div className="flex h-full items-center justify-between gap-4">
            <div className="flex justify-center">
              <div className="relative w-20 sm:w-24 aspect-[7/5] dark:hidden">
                <Image
                  src="/logo-dark.png"
                  alt="DataW"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              </div>
              <div className="relative hidden w-20 sm:w-24 aspect-[7/5] dark:block">
                <Image
                  src="/logo.png"
                  alt="DataW"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              </div>
            </div>
            <div className="text-muted-foreground text-xs text-right">
              © {new Date().getFullYear()} DataW. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-[#0f1419] to-[#0a0f16] text-white">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-9 lg:grid-cols-4 lg:gap-12">
          {/* Logo and Description */}
          <div className="space-y-3 text-center sm:col-span-2 sm:space-y-4 sm:text-left lg:col-span-1">
            <Link href="/" className="inline-flex mx-auto sm:mx-0">
              <div className="relative w-24 sm:w-28 md:w-32 aspect-[7/5]">
                <Image
                  src="/logo.png"
                  alt="DataW"
                  fill
                  className="object-contain object-left"
                  sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                />
              </div>
            </Link>
            <p className="mx-auto max-w-[17.5rem] text-[13px] leading-5 text-white/70 sm:mx-0 sm:max-w-xs sm:text-sm sm:leading-6">
              DataW connects organizations with verified global data collectors
              and enables secure crypto payouts for fast, reliable field data
              operations.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-start sm:gap-3">
              <Link
                href="/signup?role=requester"
                className="w-full rounded-md bg-cyan-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-400 sm:w-auto"
              >
                Post a project
              </Link>
              <Link
                href="/projects"
                className="w-full rounded-md border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/10 sm:w-auto"
              >
                Browse jobs
              </Link>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-sm sm:tracking-wide">
              Platform
            </h4>
            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2.5">
              {platformLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-cyan-400 sm:px-0 sm:py-1"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account and Help Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-sm sm:tracking-wide">
              Account & Help
            </h4>
            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2.5">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-cyan-400 sm:px-0 sm:py-1"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-sm sm:tracking-wide">
              Contact
            </h4>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:mt-4 sm:p-5">
              <p className="text-sm text-white/70">Need help with onboarding?</p>
              <a
                href="mailto:support@dataw.io"
                className="mt-2 block break-all text-sm font-medium text-cyan-400 hover:text-cyan-300 sm:break-normal"
              >
                support@dataw.io
              </a>
              <a
                href="mailto:hello@dataw.io"
                className="mt-1 block break-all text-sm text-white/70 hover:text-cyan-400 sm:break-normal"
              >
                hello@dataw.io
              </a>
              <p className="mt-4 text-xs leading-relaxed text-white/50">
                Response times are typically within 1 business day.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright and Secure Payouts */}
        <div className="mt-8 border-t border-white/10 pt-4 sm:mt-10 sm:pt-6">
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-16 sm:w-20 aspect-[7/5]">
                <Image
                  src="/logo.png"
                  alt="DataW"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 64px, 80px"
                />
              </div>
              <div className="text-xs text-white/50 sm:text-sm">
                © {new Date().getFullYear()} DataW. All rights reserved.
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/50 sm:justify-end sm:text-sm">
              <span>Secure payouts</span>
              <span>Verified contributors</span>
              <span>Global coverage</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
