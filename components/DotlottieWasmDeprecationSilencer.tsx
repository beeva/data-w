"use client";

import { useEffect } from "react";

/** Substring from wasm-bindgen when init is called with a URL string instead of `{ module_or_path }`. */
const DOTLOTTIE_WASM_INIT_DEPRECATION =
  "using deprecated parameters for the initialization function";

/**
 * @supabase/realtime-js logs this when `channel.send({ type: "broadcast", ... })` falls back to
 * REST. Chat broadcasts use `httpSend()` instead; any remaining emit is usually a stale tab or
 * DevTools mis-attributing the stack to this `console.warn` forwarder.
 */
const REALTIME_SEND_REST_FALLBACK =
  "Realtime send() is automatically falling back to REST API";

let warnFilterInstalled = false;

/**
 * Filters known third-party deprecation noise. Uses `bind(console)` before patching so forwarded
 * warnings keep a useful stack (not this file’s forwarder line).
 */
export function DotlottieWasmDeprecationSilencer() {
  useEffect(() => {
    if (warnFilterInstalled) return;
    warnFilterInstalled = true;
    const originalWarn = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === "string") {
        if (first.includes(DOTLOTTIE_WASM_INIT_DEPRECATION)) {
          return;
        }
        if (first.includes(REALTIME_SEND_REST_FALLBACK)) {
          return;
        }
      }
      originalWarn(...(args as Parameters<typeof console.warn>));
    };
  }, []);
  return null;
}
