"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { effectiveLeaveEntitlement, initialLeaveStore, submitLeave, transitionLeave } from "./leave-model";
import type { LeavePortion, LeaveResult, LeaveStore, LeaveType } from "./leave-model";
import { demoBusinessDate, demoBusinessNow } from "@/lib/demo-clock";
import { useHrDemo } from "@/features/hr/hr-demo-context";

const key = "ohriise-leave-demo-v1";
type SubmitInput = { employeeId: string; managerId: string; hrReviewerId: string; type: LeaveType; from: string; to: string; portion: LeavePortion; reason: string; handover: string; adjustment: number };
type LeaveContextValue = { store: LeaveStore; submit: (input: SubmitInput) => LeaveResult; act: (id: string, actorId: string, action: Parameters<typeof transitionLeave>[3], note: string) => LeaveResult; resetLeaveDemo: () => void };
const LeaveContext = createContext<LeaveContextValue | null>(null);

function readStore(): LeaveStore {
  if (typeof window === "undefined") return initialLeaveStore;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null") as LeaveStore | null;
    if (parsed?.version === 1 && Array.isArray(parsed.requests)) return { ...parsed, requests: [...parsed.requests, ...initialLeaveStore.requests.filter((seed) => !parsed.requests.some((item) => item.id === seed.id))] };
  } catch { /* Ignore invalid local demo data. */ }
  return initialLeaveStore;
}

export function LeaveDemoProvider({ children }: { children: React.ReactNode }) {
  const { policies } = useHrDemo();
  const [store, setStore] = useState<LeaveStore>(initialLeaveStore);
  const [hydrated, setHydrated] = useState(false);
  const current = useRef(store);
  useEffect(() => {
    const restored = readStore();
    current.current = restored;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser-only demo state after hydration.
    setStore(restored);
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(key, JSON.stringify(store)); }, [hydrated, store]);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== key) return;
      const next = readStore();
      current.current = next;
      setStore(next);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function commit(result: LeaveResult) {
    if (result.ok) { current.current = result.store; setStore(result.store); }
    return result;
  }
  const value: LeaveContextValue = {
    store,
    submit: (input) => {
      const { adjustment, ...request } = input;
      const policy = effectiveLeaveEntitlement(policies, request.from);
      if (!policy) return { ok: false, error: "Chưa có chính sách quỹ nghỉ phép có hiệu lực cho ngày này." };
      return commit(submitLeave(current.current, { ...request, id: `LV-${crypto.randomUUID().slice(0, 8).toUpperCase()}` }, demoBusinessNow().toISOString(), adjustment, demoBusinessDate(), policy));
    },
    act: (id, actorId, action, note) => commit(transitionLeave(current.current, id, actorId, action, note, demoBusinessNow().toISOString())),
    resetLeaveDemo: () => { current.current = initialLeaveStore; setStore(initialLeaveStore); },
  };
  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
}

export function useLeaveDemo() {
  const value = useContext(LeaveContext);
  if (!value) throw new Error("useLeaveDemo must be used within LeaveDemoProvider");
  return value;
}
