"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import DataTunnelCanvas from "@/components/DataTunnelCanvas";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setError(
            "This reset link is invalid or has expired. Please request a new password reset email."
          );
        }
      } finally {
        setChecking(false);
      }
    };

    void checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess("Your password has been updated. You can now sign in.");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex">
      <div className="absolute inset-0 w-full h-full bg-[#0a0f1e]">
        <DataTunnelCanvas />
      </div>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-24 relative z-10 flex items-center justify-center">
        <div className="w-full rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-lg bg-transparent">
          <div className="flex min-h-[70vh]">
            <aside className="hidden lg:flex lg:w-[44%] xl:w-[48%] flex-col justify-between relative p-10 xl:p-14 overflow-hidden bg-transparent rounded-l-2xl">
              <div className="relative z-10 flex flex-col justify-between flex-1 min-h-0">
                <Link
                  href="/"
                  className="inline-flex hover:opacity-90 transition-opacity"
                >
                  <Image
                    src="/logo.png"
                    alt="DataW"
                    width={140}
                    height={38}
                    loading="eager"
                    className="h-9 w-auto"
                    priority
                  />
                </Link>
                <div className="space-y-6 max-w-sm">
                  <h2 className="text-2xl xl:text-3xl font-semibold text-white tracking-tight leading-tight">
                    Choose a new password to secure your account.
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Use a strong password that you don&apos;t reuse on other
                    sites to keep your projects safe.
                  </p>
                </div>
                <p className="text-slate-500 text-xs">
                  © DataW · Data Gathering Platform
                </p>
              </div>
            </aside>

            <main className="flex-1 flex flex-col justify-center bg-slate-50 px-6 py-12 sm:px-10 sm:py-16 rounded-r-2xl">
              <div className="w-full max-w-md mx-auto">
                <div className="lg:hidden flex justify-center mb-8">
                  <Link
                    href="/"
                    className="inline-flex hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src="/logo-dark.png"
                      alt="DataW"
                      width={140}
                      height={38}
                      className="h-9 w-auto"
                      priority
                    />
                  </Link>
                </div>

                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Reset your password
                </h1>
                <p className="text-slate-500 text-sm mt-1.5 mb-8">
                  Enter a new password for your account.
                </p>

                {checking && (
                  <p className="text-sm text-slate-500 mb-4">
                    Verifying your reset link...
                  </p>
                )}

                {error && (
                  <div
                    className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3"
                    role="alert"
                  >
                    <svg
                      className="w-5 h-5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div
                    className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3"
                    role="status"
                  >
                    <svg
                      className="w-5 h-5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      New password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                      placeholder="••••••••"
                      disabled={checking}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                      placeholder="••••••••"
                      disabled={checking}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || checking}
                    className="w-full mt-3 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  >
                    {loading ? "Updating password..." : "Update password"}
                  </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-8">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Back to sign in
                  </button>
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

