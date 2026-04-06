"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/lib/services/notificationService";
import DataTunnelCanvas from "@/components/DataTunnelCanvas";
import Header from "@/components/Header";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw signInError;

      if (data.user) {
        // Create a toast-style notification for successful sign-in (stored in DB)
        try {
          await createNotification({
            userId: data.user.id,
            type: "system",
            title: "Signed in successfully",
            body: "You have signed in to your account.",
            metadata: { email: data.user.email },
          });
        } catch {
          // Ignore notification errors on login
        }

        // Redirect with a query flag so dashboard home can show a UI toast
        router.push("/dashboard/home?toast=signin-success");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      if (typeof window === "undefined") return;

      const nextPath = encodeURIComponent("/dashboard/home?toast=signin-success");
      const redirectTo = `${window.location.origin}/auth/callback?next=${nextPath}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || "Failed to continue with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex">
      <div className="absolute inset-0 w-full h-full bg-[#0a0f1e]">
        <DataTunnelCanvas />
      </div>
      <div className="lg:hidden">
        <Header />
      </div>
      {/* Floating white card: subtle shadow, sharp two-panel split (roadmap reference) */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-24 pt-28 sm:pt-32 lg:pt-24 relative z-10 flex items-center justify-center">
        <div className="w-full rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-lg bg-transparent">
          <div className="flex min-h-[70vh]">
            {/* Left: Branding + data tunnel (dark, animated) — hidden on small screens */}
            <aside className="hidden lg:flex lg:w-[44%] xl:w-[48%] flex-col justify-between relative p-10 xl:p-14 overflow-hidden bg-transparent rounded-l-2xl">
              {/* <DataTunnelCanvas /> */}
              <div className="relative z-10 flex flex-col justify-between flex-1 min-h-0">
                <Link
                  href="/"
                  className="inline-flex hover:opacity-90 transition-opacity"
                >
                  <div className="relative h-9 w-[140px]">
                    <Image
                      src="/logo.png"
                      alt="DataW"
                      fill
                      className="object-contain object-left"
                      sizes="140px"
                      loading="eager"
                      priority
                    />
                  </div>
                </Link>
                <div className="space-y-6 max-w-sm">
                  <h2 className="text-2xl xl:text-3xl font-semibold text-white tracking-tight leading-tight">
                    Sign in to your account and manage your data projects in one
                    place.
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    DataW helps you collect, organize, and share data with your
                    team securely.
                  </p>
                </div>
                <p className="text-slate-500 text-xs">
                  © DataW · Data Gathering Platform
                </p>
              </div>
            </aside>

            {/* Right: Form panel */}
            <main className="flex-1 flex flex-col justify-center bg-slate-50 px-6 py-12 sm:px-10 sm:py-16 rounded-r-2xl">
              <div className="w-full max-w-md mx-auto">
                {/* Mobile logo */}
                <div className="lg:hidden flex justify-center mb-8">
                  <Link
                    href="/"
                    className="inline-flex hover:opacity-90 transition-opacity"
                  >
                    <div className="relative h-9 w-[140px]">
                      <Image
                        src="/logo-dark.png"
                        alt="DataW"
                        fill
                        className="object-contain object-left"
                        sizes="140px"
                        priority
                      />
                    </div>
                  </Link>
                </div>

                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-slate-500 text-sm mt-1.5 mb-8">
                  Enter your credentials to continue
                </p>

                {error && (
                  <div
                    className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3"
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

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full mb-5 py-3 px-4 rounded-xl bg-white border border-slate-300 text-slate-800 font-medium text-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/15 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm inline-flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.24 1.27-.96 2.34-2.04 3.06l3.3 2.56c1.93-1.78 3.04-4.39 3.04-7.5 0-.72-.06-1.42-.19-2.1H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.08.97-3.46.97-2.66 0-4.91-1.79-5.72-4.2l-3.4 2.63C4.56 19.78 8.02 22 12 22z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M6.28 13.74a5.98 5.98 0 010-3.48l-3.4-2.63a10 10 0 000 8.74l3.4-2.63z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 6.06c1.5 0 2.84.52 3.9 1.53l2.93-2.93C17.06 2.99 14.75 2 12 2 8.02 2 4.56 4.22 2.88 7.63l3.4 2.63c.81-2.41 3.06-4.2 5.72-4.2z"
                    />
                  </svg>
                  {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-500">or</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                      placeholder="name@company.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full px-4 py-3 pr-11 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full mt-3 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-8">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
