"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { demoBusinessDate, demoBusinessNow } from "@/lib/demo-clock";
import type { BusinessRequest } from "@/features/demo/demo-data-context";
import { applyWfhCommand, emptyWfhStore, reviewWfhSession } from "./wfh-model";
import type { WfhCommand, WfhResult, WfhReviewCommand, WfhStore } from "./wfh-model";

const key = "ohriise-wfh-demo-v1";
type Value = { store: WfhStore; run: (request: BusinessRequest | undefined, command: Omit<WfhCommand, "at" | "businessDate">) => WfhResult; review: (request: BusinessRequest | undefined, command: Omit<WfhReviewCommand, "at">) => WfhResult; resetWfhDemo: () => void };
const Context = createContext<Value | null>(null);

export function WfhDemoProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<WfhStore>(emptyWfhStore);
  const current = useRef(store);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
      if (parsed?.version === 1 && Array.isArray(parsed.sessions)) {
        current.current = parsed;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore local demo snapshot after hydration.
        setStore(parsed);
      }
    } catch { /* Keep empty demo store. */ }
    setHydrated(true);
    const sync = (event: StorageEvent) => { if (event.key !== key) return; try { const parsed = JSON.parse(event.newValue ?? "null"); if (parsed?.version === 1 && Array.isArray(parsed.sessions)) { current.current = parsed; setStore(parsed); } } catch { /* Keep last valid snapshot. */ } };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(key, JSON.stringify(store)); }, [hydrated, store]);
  function run(request: BusinessRequest | undefined, command: Omit<WfhCommand, "at" | "businessDate">) {
    const result = applyWfhCommand(current.current, request, { ...command, at: demoBusinessNow().toISOString(), businessDate: demoBusinessDate() });
    if (result.ok) { current.current = result.store; setStore(result.store); }
    return result;
  }
  function review(request: BusinessRequest | undefined, command: Omit<WfhReviewCommand, "at">) {
    const result = reviewWfhSession(current.current, request, { ...command, at: demoBusinessNow().toISOString() });
    if (result.ok) { current.current = result.store; setStore(result.store); }
    return result;
  }
  function resetWfhDemo() { current.current = emptyWfhStore; setStore(emptyWfhStore); window.localStorage.removeItem(key); }
  return <Context.Provider value={{ store, run, review, resetWfhDemo }}>{children}</Context.Provider>;
}

export function useWfhDemo() { const value = useContext(Context); if (!value) throw new Error("useWfhDemo must be used within WfhDemoProvider"); return value; }
