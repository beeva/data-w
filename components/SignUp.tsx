"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import DataTunnelCanvas from "@/components/DataTunnelCanvas";
import EmailVerification from "@/components/EmailVerification";

type UserRole = "requester" | "collector" | "agent";

export default function SignUp() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as UserRole | null;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: (roleParam && ["requester", "collector", "agent"].includes(roleParam)
      ? roleParam
      : "collector") as UserRole,
  });

  // Update role when URL param changes
  useEffect(() => {
    if (roleParam && ["requester", "collector", "agent"].includes(roleParam)) {
      setFormData((prev) => ({ ...prev, role: roleParam }));
    }
  }, [roleParam]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const router = useRouter();
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Before starting verification, check if the email is already registered.
    // If it is, don't proceed to the verification step.
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
        },
      });
      console.log(data);

      if (signUpError) throw signUpError;
      setVerificationStep(true);
    } catch(error: any) {
      setError(error.message);
      console.error(error);
    }
    finally {
      setLoading(false);
    }
  };

  const performSignup = async () => {
    setError("");
    router.push("/login");
    setLoading(true);
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams({
        next: "/dashboard/home",
        role: formData.role,
      });

      const fullName = formData.fullName.trim();
      if (fullName) {
        params.set("full_name", fullName);
      }

      const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) throw oauthError;
    } catch (oauthError: any) {
      setError(oauthError.message || "Failed to continue with Google");
      setGoogleLoading(false);
    }
  };
  return (
    <div className="signup-page h-screen min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[#0a0f1e]">
        <DataTunnelCanvas />
      </div>
      {/* Floating white card: scrollable within viewport */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 relative z-10 flex items-center justify-center overflow-y-auto scrollbar-hide">
        <div className="w-full my-auto rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-lg bg-transparent max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]">
          <div className="flex min-h-0 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]">
            {/* Left: Branding — hidden on small screens (same structure as login) */}
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
                    className="h-9 w-auto"
                    priority
                  />
                </Link>
                <div className="space-y-6 max-w-sm">
                  <h2 className="text-2xl xl:text-3xl font-semibold text-white tracking-tight leading-tight">
                    Join DataW and start collecting or requesting data with your
                    team.
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Create an account to access projects, earn as a collector,
                    or request data collection.
                  </p>
                </div>
                <p className="text-slate-500 text-xs">
                  © DataW · Data Gathering Platform
                </p>
              </div>
            </aside>

            {/* Right: Form panel — scrolls when content overflows */}
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide bg-slate-50 px-6 py-8 sm:px-10 sm:py-10 rounded-r-2xl">
              <div className="w-full max-w-md mx-auto py-4 sm:py-6">
                {/* Mobile logo */}
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
                  Create your account
                </h1>
                <p className="text-slate-500 text-sm mt-1.5 mb-8">
                  Enter your details to get started
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

                {verificationStep ? (
                  <EmailVerification
                    email={formData.email}
                    onVerified={() => performSignup()}
                    onChangeEmail={() => setVerificationStep(false)}
                  />
                ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
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
                  {googleLoading ? "Redirecting to Google..." : "Sign up with Google"}
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
                      htmlFor="fullName"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                      placeholder="name@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      I want to
                    </label>
                    <input
                      type="hidden"
                      name="role"
                      value={formData.role}
                    />
                    <div className="flex flex-wrap justify-center gap-6">
                      {[
                        {
                          value: "collector" as const,
                          label: "Collector",
                          desc: "Collect data and earn",
                        },
                        {
                          value: "requester" as const,
                          label: "Requester",
                          desc: "Request data collection",
                        },
                        {
                          value: "agent" as const,
                          label: "Agent",
                          desc: "Help validate data",
                        },
                      ].map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              role: role.value,
                            }))
                          }
                          className={`role-hero-card focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded-xl ${formData.role === role.value ? "selected" : ""}`}
                          aria-pressed={formData.role === role.value}
                          aria-label={`Select ${role.label}: ${role.desc}`}
                        >
                          <div className="role-hero-wrapper">
                            <div className="relative w-full h-full rounded-xl overflow-hidden">
                              <Image
                                src={`/characters/${role.value}-bg.webp`}
                                alt=""
                                fill
                                className="role-hero-cover object-cover"
                                sizes="(max-width: 160px) 100vw, 133px"
                              />
                            </div>
                          </div>
                          <span className="role-hero-title">
                            {role.label}
                          </span>
                          <Image
                            src={`/characters/${role.value}.png`}
                            alt=""
                            width={192}
                            height={192}
                            className="role-hero-character object-contain"
                            aria-hidden
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
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

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        className="w-full px-4 py-3 pr-11 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 text-sm transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
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
                        Creating account...
                      </span>
                    ) : (
                      "Sign up"
                    )}
                  </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-8">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
