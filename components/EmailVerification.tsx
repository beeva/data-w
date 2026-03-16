"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const CODE_LENGTH = 8;
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const lastAutoVerifiedCode = useRef<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    setResendCooldown(initialCooldown)
  }, [initialCooldown]);

  const handleVerify = useCallback(async () => {
    const codeEntered = digits.join("");
    if (!codeEntered || codeEntered.length !== CODE_LENGTH) {
      setError(`Please enter the ${CODE_LENGTH}-digit code`);
      return;
    }
    setError("");
    setVerifying(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeEntered,
        // When confirming the email address that was just used for sign-up,
        // Supabase expects the "signup" verification type.
        type: "signup",
      });
      if (verifyError) throw verifyError;
      onVerified();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid or expired verification code";
      setError(msg);
    } finally {
      setVerifying(false);
    }
  }, [CODE_LENGTH, digits, email, onVerified]);

  const handleResend = async () => {
    setError("");
    setResendCooldown(initialCooldown);
    setSending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        email,
        // Resend the signup confirmation email/code
        type: "signup",
      });
      if (resendError) throw resendError;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to resend verification code";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleChangeEmail = () => {
    setDigits(Array(CODE_LENGTH).fill(""));
    setError("");
    if (onChangeEmail) onChangeEmail();
  };

  const allFilled = digits.every((d) => d !== "");

  useEffect(() => {
    if (!allFilled || verifying) return;

    const currentCode = digits.join("");
    if (!currentCode || currentCode === lastAutoVerifiedCode.current) return;

    lastAutoVerifiedCode.current = currentCode;
    void handleVerify();
  }, [allFilled, verifying, digits, handleVerify]);

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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const arr = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < Math.min(CODE_LENGTH, pasted.length); i++) arr[i] = pasted[i];
    setDigits(arr);
    const nextIndex = Math.min(CODE_LENGTH - 1, pasted.length - 1);
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
    e.preventDefault();
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="mb-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <p className="text-sm text-slate-600">
        We've generated an 8-digit verification code for {email}. Enter it below to verify your account.
      </p>

      <div>
        <div className="text-center">
          <p className="text-lg font-semibold">Code Verification</p>
          <p className="text-sm text-slate-500 mt-1">An 8-digit code has been sent to</p>
          <p className="text-sm font-medium text-slate-900 mt-1">{email}</p>
          <p className="text-sm text-slate-500 mt-1">The code expires in 1 hour</p>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex flex-wrap gap-2">
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
