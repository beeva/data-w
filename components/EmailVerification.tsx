"use client";

import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase/client";

type Props = {
  email: string;
  onVerified: () => void;
  initialCooldown?: number;
  onChangeEmail?: () => void;
};

export default function EmailVerification({
  email,
  onVerified,
  initialCooldown = 60,
  onChangeEmail,
}: Props) {
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const lastSentEmail = useRef<string | null>(null);

  const sendOtp = async () => {
    setError("");
    setSending(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setSavedEmail(email);
      setResendCooldown(initialCooldown);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send verification code";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (lastSentEmail.current === email) return;
    lastSentEmail.current = email;
    setSavedEmail(null);
    setDigits(Array(6).fill(""));
    sendOtp();
  }, [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async () => {
    const codeEntered = digits.join("");
    if (!codeEntered || codeEntered.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError("");
    setVerifying(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeEntered,
        type: "email",
      });
      if (verifyError) throw verifyError;
      onVerified();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid or expired verification code";
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    await sendOtp();
  };

  const handleChangeEmail = () => {
    setSavedEmail(null);
    setDigits(Array(6).fill(""));
    setError("");
    if (onChangeEmail) onChangeEmail();
  };

  const allFilled = digits.every((d) => d !== "");

  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index] === "") {
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          setDigits((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        }
      } else {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const arr = Array(6).fill("");
    for (let i = 0; i < Math.min(6, pasted.length); i++) arr[i] = pasted[i];
    setDigits(arr);
    const nextIndex = Math.min(5, pasted.length - 1);
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
    e.preventDefault();
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="mb-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <p className="text-sm text-slate-600">
        We've generated a 6-digit verification code for {email}. Enter it below to verify your account.
      </p>

      <div>
        <div className="text-center">
          <p className="text-lg font-semibold">Code Verification</p>
          <p className="text-sm text-slate-500 mt-1">A 6-digit code has been sent to</p>
          <p className="text-sm font-medium text-slate-900 mt-1">{email}</p>
          <p className="text-sm text-slate-500 mt-1">The code expires in 1 hour</p>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex flex-wrap gap-3">
            {digits.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                value={d}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                type="text"
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${idx + 1}`}
                className="w-12 h-12 text-center rounded-md border border-slate-300 bg-white text-slate-900 text-xl focus:outline-none"
              />
            ))}
          </div>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleChangeEmail}
            className="text-sm text-slate-700 underline"
          >
            Change email
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-center">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!allFilled || verifying}
          className="py-2 px-6 rounded-xl bg-slate-900 text-white font-medium disabled:opacity-50 disabled:bg-slate-400"
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          disabled={resendCooldown > 0 || sending}
          onClick={handleResend}
          className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 disabled:opacity-50"
        >
          {sending ? "Sending..." : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
