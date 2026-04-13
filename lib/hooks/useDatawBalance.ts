"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getDatawBalance,
  ensureSepoliaNetwork,
  isMetaMaskInstalled,
} from "@/lib/web3/client";

/**
 * DATAW (ERC-20) balance for the browser wallet (MetaMask), when connected on Sepolia.
 */
export function useDatawBalance() {
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !isMetaMaskInstalled()) {
      setAmount(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const eth = (typeof window !== "undefined"
        ? (window as Window & { ethereum?: { request: (a: { method: string }) => Promise<unknown> } }).ethereum
        : undefined) as { request: (a: { method: string }) => Promise<unknown> } | undefined;
      const raw = (await eth?.request({ method: "eth_accounts" })) as
        | string[]
        | undefined;
      const accounts = raw || [];

      if (!accounts[0]) {
        setAmount(null);
        setError(null);
        return;
      }

      await ensureSepoliaNetwork();
      const b = await getDatawBalance(accounts[0]);
      setAmount(b);
      setError(null);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to load DATAW balance";
      setError(msg);
      setAmount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const eth = (window as Window & {
      ethereum?: {
        on?: (ev: string, fn: () => void) => void;
        removeListener?: (ev: string, fn: () => void) => void;
      };
    }).ethereum;
    if (!eth?.on) return;

    const onAccounts = () => void refresh();
    const onChain = () => void refresh();
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  return { amount, loading, error, refresh };
}
