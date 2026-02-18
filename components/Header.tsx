"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/?toast=signout-success");
    router.refresh();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0B1020]/80 backdrop-blur-xl"
          : "bg-[#0B1020]/80 backdrop-blur-xl md:bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={100}
              className="w-24 sm:w-32 md:w-36 h-auto"
            />
          </Link>

          <div className="flex items-center gap-4 sm:gap-8">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="/projects"
                className={`hover:text-cyan-500 hover:scale-105 transition-all duration-300 font-medium ${
                  isActive('/projects') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                Projects
              </Link>
              <Link
                href="/datapool"
                className={`hover:text-cyan-500 hover:scale-105 transition-all duration-300 font-medium ${
                  isActive('/datapool') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                DataPool
              </Link>
              <Link
                href="/about"
                className={`hover:text-cyan-500 hover:scale-105 transition-all duration-300 font-medium ${
                  isActive('/about') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                About
              </Link>
              <Link
                href="/crypto"
                className={`hover:text-cyan-500 hover:scale-105 transition-all duration-300 font-medium ${
                  isActive('/crypto') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                Crypto
              </Link>
            </nav>

            {/* Desktop Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-3 sm:gap-4">
              {loading ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-3 sm:px-4 py-2 text-white/90 hover:text-cyan-400 transition-colors font-medium text-sm sm:text-base"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 sm:px-6 py-2 bg-white/20 border border-white text-white hover:scale-105 transition-all duration-300 font-semibold rounded-md hover:opacity-90 shadow-lg text-sm sm:text-base"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 sm:px-4 py-2 text-white/90 hover:text-cyan-400 transition-colors font-medium text-sm sm:text-base"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 sm:px-6 py-2 bg-white/20 border border-white text-white hover:scale-105 transition-all duration-300 font-semibold rounded-md hover:opacity-90 shadow-lg text-sm sm:text-base"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-cyan-400 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col gap-4">
              <Link
                href="/projects"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`hover:text-cyan-500 transition-colors font-medium py-2 ${
                  isActive('/projects') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                Projects
              </Link>
              <Link
                href="/datapool"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`hover:text-cyan-500 transition-colors font-medium py-2 ${
                  isActive('/datapool') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                DataPool
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`hover:text-cyan-500 transition-colors font-medium py-2 ${
                  isActive('/about') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                About
              </Link>
              <Link
                href="/crypto"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`hover:text-cyan-500 transition-colors font-medium py-2 ${
                  isActive('/crypto') ? 'text-cyan-400' : 'text-white/90'
                }`}
              >
                Crypto
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-white/90 hover:text-cyan-400 transition-colors font-medium"
                >
                  Dashboard
                </Link>
              )}{" "}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                ) : user ? (
                  <>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="py-2 text-white hover:opacity-90 transition-all duration-300 font-semibold rounded-md text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2 text-white/90 hover:text-cyan-400 transition-colors font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2 text-white hover:opacity-90 transition-all duration-300 font-semibold rounded-md text-left"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
