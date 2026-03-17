"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Factor } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Smartphone, MessageSquare } from "lucide-react";

type PhoneTwoFactorAuthProps = {
  defaultPhone: string;
};

function isE164Phone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value.trim());
}

export default function PhoneTwoFactorAuth({ defaultPhone }: PhoneTwoFactorAuthProps) {
  const CODE_LENGTH = 6;
  const [loadingState, setLoadingState] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [phone, setPhone] = useState(defaultPhone || "");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const verificationPending = Boolean(challengeId && (pendingFactorId || verifiedFactorId));

  useEffect(() => {
    setPhone((prev) => (prev ? prev : defaultPhone || ""));
  }, [defaultPhone]);

  const loadFactors = useCallback(async () => {
    setLoadingState(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setErrorMessage(error.message || "Failed to load 2FA status");
      setLoadingState(false);
      return;
    }

    const allFactors: Factor[] = data?.all ?? [];
    const verifiedPhoneFactor =
      data?.phone?.[0] ??
      allFactors.find((factor) => factor.factor_type === "phone" && factor.status === "verified") ??
      null;
    const unverifiedPhoneFactor =
      allFactors.find((factor) => factor.factor_type === "phone" && factor.status === "unverified") ??
      null;

    setEnabled(Boolean(verifiedPhoneFactor));
    setVerifiedFactorId(verifiedPhoneFactor?.id ?? null);
    setPendingFactorId(unverifiedPhoneFactor?.id ?? null);
    setChallengeId(null);
    setDigits(Array(CODE_LENGTH).fill(""));
    setLoadingState(false);
  }, [CODE_LENGTH]);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  const activeFactorId = useMemo(() => {
    return pendingFactorId ?? verifiedFactorId;
  }, [pendingFactorId, verifiedFactorId]);

  const challengeFactor = useCallback(
    async (factorId: string) => {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
        channel: "sms",
      });

      if (error) {
        throw new Error(error.message || "Failed to send verification code");
      }

      setChallengeId(data.id);
      setDigits(Array(CODE_LENGTH).fill(""));
      setStatusMessage("Verification code sent to your phone.");
      setTimeout(() => codeInputRefs.current[0]?.focus(), 0);
    },
    [CODE_LENGTH]
  );

  const startEnableFlow = async () => {
    if (!isE164Phone(phone)) {
      setErrorMessage("Use E.164 format, example: +14155552671");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      let factorId = pendingFactorId;

      if (!factorId) {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "phone",
          phone: phone.trim(),
          friendlyName: "Primary phone",
        });

        if (error) {
          throw new Error(error.message || "Failed to enroll phone factor");
        }

        factorId = data.id;
        setPendingFactorId(data.id);
      }

      if (!factorId) {
        throw new Error("Failed to initialize phone factor");
      }

      await challengeFactor(factorId);
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to start 2FA setup");
    } finally {
      setBusy(false);
    }
  };

  const disable2FA = async () => {
    if (!verifiedFactorId) {
      setErrorMessage("No verified phone factor found.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
      if (error) {
        throw new Error(error.message || "Failed to disable 2FA");
      }

      setStatusMessage("Two-factor authentication has been disabled.");
      await loadFactors();
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to disable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (nextChecked: boolean) => {
    if (busy) return;
    if (nextChecked) {
      setErrorMessage("");
      setStatusMessage("Enter your phone number and click Send Code.");
    } else {
      await disable2FA();
    }
  };

  const verifyCode = async () => {
    const otpCode = digits.join("");
    if (!activeFactorId || !challengeId) {
      setErrorMessage("Please request a verification code first.");
      return;
    }

    if (otpCode.length !== CODE_LENGTH) {
      setErrorMessage(`Enter the ${CODE_LENGTH}-digit SMS code.`);
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: activeFactorId,
        challengeId,
        code: otpCode,
      });

      if (error) {
        throw new Error(error.message || "Invalid verification code");
      }

      setStatusMessage("Two-factor authentication enabled successfully.");
      await loadFactors();
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to verify code");
    } finally {
      setBusy(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && codeInputRefs.current[index + 1]) {
      codeInputRefs.current[index + 1]?.focus();
      codeInputRefs.current[index + 1]?.select();
    }
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return;

    if (digits[index] === "") {
      if (index > 0) {
        codeInputRefs.current[index - 1]?.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const handleDigitPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const nextDigits = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < Math.min(CODE_LENGTH, pasted.length); i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);
    const nextIndex = Math.min(CODE_LENGTH - 1, pasted.length - 1);
    setTimeout(() => codeInputRefs.current[nextIndex]?.focus(), 0);
    e.preventDefault();
  };

  const resendCode = async () => {
    if (!activeFactorId) {
      setErrorMessage("No pending factor found.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      await challengeFactor(activeFactorId);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to resend code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader className="py-4 px-4 sm:px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription className="text-xs">
          Secure your account with SMS verification using your phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 py-4 px-4 sm:px-5">
        <div className="p-2.5 rounded-md bg-muted/50 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Phone 2FA status</p>
            <p className="text-sm font-medium flex items-center gap-2">
              {enabled ? "Enabled" : "Disabled"}
              <Badge variant={enabled ? "default" : "secondary"} className="text-[10px]">
                {enabled ? "Protected" : "Not active"}
              </Badge>
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={busy || loadingState}
            aria-label="Toggle phone two-factor authentication"
          />
        </div>

        {!enabled && (
          <div className="space-y-1.5">
            <Label htmlFor="twofa-phone" className="text-xs">
              <Smartphone className="w-3 h-3 inline mr-1" />
              Verification Phone Number
            </Label>
            <Input
              id="twofa-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155552671"
              className="text-sm"
              disabled={busy || loadingState}
            />
            <p className="text-[11px] text-muted-foreground">
              Use E.164 format with country code (example: +14155552671).
            </p>
            <div className="pt-1">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={startEnableFlow}
                disabled={busy || loadingState}
              >
                {busy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Code"
                )}
              </Button>
            </div>
          </div>
        )}

        {verificationPending && (
          <div className="space-y-2 rounded-md border border-border/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <MessageSquare className="w-3.5 h-3.5" />
              Enter verification code
            </div>
            <div className="flex flex-wrap gap-2">
              {digits.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    codeInputRefs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  onPaste={handleDigitPaste}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Verification code digit ${index + 1}`}
                  className="h-10 w-10 text-center text-base font-semibold"
                  disabled={busy}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={verifyCode}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-3"
                onClick={resendCode}
                disabled={busy}
              >
                Resend Code
              </Button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-600 dark:text-green-400 text-xs">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs">
            {errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
